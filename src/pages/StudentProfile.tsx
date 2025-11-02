import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, User, BookOpen, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { io } from "socket.io-client";

export function StudentProfile() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any | null>(null);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to backend via SocketIO");
    });

    socket.on("serial_data", (msg) => {
      const line = msg.data;

      if (!line.startsWith("BK") && line !== "") {
        console.log("Received Student ID:", line);
        setStudentId(line);

        // Wait for React to update state, then submit the form
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) form.requestSubmit();
        }, 300);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (studentError || !studentData) {
      addToast('Student not found', 'error');
      setStudent(null);
      setLoading(false);
      return;
    }

    const { data: allIssuedBooks, error: booksError } = await supabase
      .from('issued_books')
      .select('*, books(*)')
      .eq('student_id', studentData.student_id);

    if (booksError) {
      console.error('Error fetching issued books:', booksError);
      addToast('Error fetching books', 'error');
    }

    console.log('Fetched issued_books:', allIssuedBooks);

    const issued = allIssuedBooks?.filter(
      (b) => b.status === 'issued' || b.return_status === 'issued'
    ) || [];

    const returned = allIssuedBooks?.filter(
      (b) => b.status === 'returned' || b.return_status === 'returned'
    ) || [];

    console.log('Issued:', issued);
    console.log('Returned:', returned);

    setStudent(studentData);
    setIssuedBooks(issued);
    setReturnedBooks(returned);
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-6xl mx-auto px-4 py-8">
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

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Student Profile</h2>
              <p className="text-gray-400">Search by Student ID to view details</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Tap your Student ID"
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold px-8 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </motion.button>
          </form>
        </motion.div>

        {/* Student Details Section */}
        {searched && student && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 flex items-start gap-8">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-blue-500 shadow-lg shadow-blue-500/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-2">{student.name}</h3>
                <p className="text-gray-300 text-lg mb-1">Roll No: {student.student_id}</p>
                <p className="text-gray-300 mb-1">Department: {student.department || '-'}</p>
                <p className="text-gray-300 mb-1">Batch: {student.batch || '-'}</p>
                <p className="text-gray-400">{student.email}</p>
              </div>
            </div>

            {/* Currently Issued Books */}
            {/* Currently Issued Books */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/50 p-8 shadow-lg shadow-blue-500/20"
            >
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-400" />
                Currently Issued Books
              </h4>

              {issuedBooks.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No books currently issued</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-500/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-blue-500/30 text-blue-300">
                        <th className="p-3">Book Name</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuedBooks.map((issued) => (
                        <motion.tr
                          key={issued.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-900/50 transition-colors border-b border-gray-700/50"
                        >
                          <td className="p-3">{issued.books?.book_name || '-'}</td>
                          <td className="p-3 text-gray-400">
                            {issued.issue_date
                              ? new Date(Date.parse(issued.issue_date)).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="p-3 text-gray-400">
                            {issued.due_date
                              ? new Date(Date.parse(issued.due_date)).toLocaleDateString()
                              : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Returned Books History */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/50 p-8 shadow-lg shadow-purple-500/20"
            >
              <h4 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                <History className="w-6 h-6 text-purple-400" />
                Returned Books History
              </h4>

              {returnedBooks.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No books returned yet</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-purple-500/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="p-3">Book Name</th>
                        <th className="p-3">Issued On</th>
                        <th className="p-3">Returned On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnedBooks.map((returned) => (
                        <motion.tr
                          key={returned.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-900/50 transition-colors border-b border-gray-700/50"
                        >
                          <td className="p-3">{returned.books?.book_name || '-'}</td>
                          <td className="p-3 text-gray-400">
                            {returned.issue_date
                              ? new Date(Date.parse(returned.issue_date)).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="p-3 text-gray-400">
                            {returned.return_date
                              ? new Date(Date.parse(returned.return_date)).toLocaleDateString()
                              : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* No student found */}
        {searched && !student && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-12 text-center"
          >
            <p className="text-gray-400 text-lg">No student found with this ID</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
