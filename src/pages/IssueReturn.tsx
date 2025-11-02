import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, Student, IssuedBook, Book } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { io } from "socket.io-client";

export function IssueReturn() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [issuedBooks, setIssuedBooks] = useState<(IssuedBook & { books: Book })[]>([]);
  const [bookId, setBookId] = useState('');
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingBook, setSearchingBook] = useState(false);
  const [showSuccess, setShowSuccess] = useState<'issue' | 'return' | null>(null);
  const { toasts, addToast, removeToast } = useToast();


  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to backend via SocketIO");
    });
    // Listen for serial data from backend
    socket.on("serial_data", (msg) => {
      const line = msg.data;

      // Only accept data that doesn't start with '+'
      if (!line.startsWith("BK") && line !== "") {
        console.log("Received Student ID:", line);
        setStudentId(line);

        // After setting value, simulate pressing Enter
        setTimeout(() => {
          const input = document.querySelector("input"); // select your input box
          if (input) {
            const event = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            });
            input.dispatchEvent(event);
          }
        }, 300);
      }
      if (line.startsWith("BK") && line !== "") {
        console.log("Received Student ID:", line);
        // setBookId(line);
         handleBookIdChange(line);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStudentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('roll_no', studentId)
      .maybeSingle();

    if (studentError || !studentData) {
      addToast('Student not found', 'error');
      setLoading(false);
      return;
    }

    const { data: booksData, error: booksError } = await supabase
      .from('issued_books')
      .select('*, books(*)')
      .eq('student_id', studentData.roll_no)
      .eq('return_status', 'issued');

    if (booksError) {
      console.error('Supabase Error:', booksError);
    }

    setStudent(studentData);
    setIssuedBooks(booksData || []);
    setLoading(false);
  };

  const handleBookIdChange = async (value: string) => {
    setBookId(value);

    if (value.length >= 3) {
      setSearchingBook(true);
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('book_id', value)
        .maybeSingle();

      setBookDetails(bookData);
      setSearchingBook(false);
    } else {
      setBookDetails(null);
    }
  };

  const handleIssueBook = async () => {
    if (!bookDetails || !student) return;

    setLoading(true);

    if (issuedBooks.length >= 3) {
      addToast('Maximum limit reached (3 books per student)', 'error');
      setLoading(false);
      return;
    }

    if (bookDetails.available_count <= 0) {
      addToast('Book not available', 'error');
      setLoading(false);
      return;
    }

    const { error: issueError } = await supabase.from('issued_books').insert({
      student_id: student.roll_no,
      book_id: bookDetails.book_id,
      issue_date: new Date().toISOString(),
      return_status: 'issued',
    });

    if (issueError) {
      console.error(issueError);
      addToast('Failed to issue book', 'error');
      setLoading(false);
      return;
    }

    await supabase
      .from('books')
      .update({ available_count: bookDetails.available_count - 1 })
      .eq('book_id', bookDetails.book_id);

    await supabase.from('transactions').insert({
      student_id: student.roll_no,
      book_id: bookDetails.book_id,
      action_type: 'issue',
    });

    const { data: updatedBooks } = await supabase
      .from('issued_books')
      .select('*, books(*)')
      .eq('student_id', student.roll_no)
      .eq('return_status', 'issued');

    setIssuedBooks(updatedBooks || []);
    setBookId('');
    setBookDetails(null);
    setLoading(false);

    setShowSuccess('issue');
    setTimeout(() => setShowSuccess(null), 2000);
  };

  const handleReturnBook = async () => {
    if (!bookId || !student) return;

    setLoading(true);

    const targetIssuedBook = issuedBooks.find(
      (item) => item.books?.book_id === bookId
    );

    if (!targetIssuedBook) {
      addToast('Book ID does not match issued books', 'error');
      setLoading(false);
      return;
    }

    const { error: returnError } = await supabase
      .from('issued_books')
      .update({
        return_status: 'returned',
        return_date: new Date().toISOString(),
      })
      .eq('id', targetIssuedBook.id);

    if (returnError) {
      console.error(returnError);
      addToast('Failed to return book', 'error');
      setLoading(false);
      return;
    }

    await supabase
      .from('books')
      .update({
        available_count: (targetIssuedBook.books.available_count || 0) + 1,
      })
      .eq('book_id', targetIssuedBook.book_id);

    await supabase.from('transactions').insert({
      student_id: student.roll_no,
      book_id: targetIssuedBook.book_id,
      action_type: 'return',
    });

    const { data: updatedBooks } = await supabase
      .from('issued_books')
      .select('*, books(*)')
      .eq('student_id', student.roll_no)
      .eq('return_status', 'issued');

    setIssuedBooks(updatedBooks || []);
    setBookId('');
    setBookDetails(null);
    setLoading(false);

    setShowSuccess('return');
    setTimeout(() => setShowSuccess(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              await fetch("http://localhost:5000/api/stop_read", { method: "POST" });
              console.log("Stop command sent successfully");
            } catch (error) {
              console.error("Error sending stop command:", error);
            } finally {
              navigate('/dashboard');
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </motion.button>

        <h1 className="text-3xl font-bold text-white mb-8">Issue / Return Book</h1>

        <AnimatePresence mode="wait">
          {!student ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  Tap or Enter Student ID
                </h2>

                <form onSubmit={handleStudentSearch} className="space-y-6">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleStudentSearch(e);
                      }
                    }}
                    placeholder="Enter Roll No (e.g., IS2524)"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Identify Student'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                  <div className="flex items-start gap-6">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-white">{student.name}</h3>
                      <p className="text-gray-400 mt-1">Roll No: {student.roll_no}</p>
                      {student.department && (
                        <p className="text-gray-400">{student.department}</p>
                      )}
                      {student.batch && (
                        <p className="text-gray-400">Batch: {student.batch}</p>
                      )}
                      {student.email && (
                        <p className="text-gray-400 text-sm mt-2">{student.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Currently Issued Books</h3>

                  {issuedBooks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No books currently issued
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {issuedBooks.map((issued) => (
                        <div
                          key={issued.id}
                          className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center gap-4"
                        >
                          {issued.books?.photo_url ? (
                            <img
                              src={issued.books.photo_url}
                              alt={issued.books.book_name}
                              className="w-16 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-gray-500 text-xs">No cover</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              {issued.books?.book_name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {issued.books?.author}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              ID: {issued.books?.book_id}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Issue or Return Controls</h3>

                  <input
                    type="text"
                    value={bookId}
                    onChange={(e) => handleBookIdChange(e.target.value)}
                    placeholder="Enter or Tap Book ID"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6"
                  />

                  {searchingBook && (
                    <div className="text-center text-gray-400 py-4">
                      Searching for book...
                    </div>
                  )}

                  {bookDetails && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6"
                    >
                      <h4 className="text-lg font-bold text-white mb-4">Book Details</h4>
                      <div className="flex gap-4">
                        {bookDetails.photo_url ? (
                          <img
                            src={bookDetails.photo_url}
                            alt={bookDetails.book_name}
                            className="w-24 h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-32 bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-500 text-xs text-center">No cover</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold text-white text-lg">
                            {bookDetails.book_name}
                          </h5>
                          <p className="text-gray-400 mt-1">By {bookDetails.author}</p>
                          <p className="text-gray-500 text-sm mt-2">ID: {bookDetails.book_id}</p>
                          <p className="text-gray-400 text-sm mt-2">
                            Available: {bookDetails.available_count} / {bookDetails.total_count}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleIssueBook}
                      disabled={loading || !bookDetails}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Issue Book
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReturnBook}
                      disabled={loading || !bookId}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Return Book
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gray-800 border-2 border-green-500 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-2xl font-bold text-white">
                {showSuccess === 'issue' ? 'Book Issued Successfully ' : 'Book Returned Successfully '}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
