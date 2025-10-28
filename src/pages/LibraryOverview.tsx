import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LibraryBig,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LibraryOverview() {
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLibraryData();
  }, []);

  async function fetchLibraryData() {
    setLoading(true);

    // Fetch all tables individually
    const { data: booksData, error: bookErr } = await supabase.from("books").select("*");
    const { data: issuedData, error: issueErr } = await supabase.from("issued_books").select("*");
    const { data: studentData, error: studentErr } = await supabase.from("students").select("*");

    if (bookErr || issueErr || studentErr) {
      console.error("Supabase Error:", bookErr || issueErr || studentErr);
      setLoading(false);
      return;
    }

    setBooks(booksData || []);
    setIssuedBooks(issuedData || []);
    setStudents(studentData || []);
    setLoading(false);
  }

  const issueCount = (bookId: string) =>
    issuedBooks.filter((i) => i.book_id === bookId && i.return_status === 'issued').length;

  const studentsWithBook = (bookId: string) =>
    issuedBooks
      .filter((i) => i.book_id === bookId && i.return_status === 'issued')
      .map((entry) => students.find((s) => s.roll_no === entry.student_id))
      .filter(Boolean);


  const availableCopies = (book: any) =>
    Math.max(0, (book.total_count || 0) - issueCount(book.book_id));

  const filteredBooks = books.filter(
    (b) =>
      b.book_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      b.book_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white px-6 py-8">
      {/* 🔙 Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </motion.button>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-10"
        >
          <LibraryBig className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Library Overview
          </h1>
        </motion.div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Book ID, Name or Author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-7 text-gray-400 text-sm uppercase tracking-wide border-b border-gray-700 pb-3 mb-4 text-center">
          <div>Photo</div>
          <div>Book ID</div>
          <div>Book Name</div>
          <div>Author</div>
          <div>Available</div>
          <div>Times Issued</div>
          <div>Currently With</div>
        </div>

        {/* 📚 Books */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 animate-pulse">Loading...</p>
          ) : (
            <AnimatePresence>
              {filteredBooks.map((book, index) => {
                const currentStudents = studentsWithBook(book.book_id);
                return (
                  <motion.div
                    key={book.book_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.005 }}
                    className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 items-center text-center gap-3">
                      <img
                        src={book.photo_url || "https://via.placeholder.com/80x100?text=Book"}
                        alt={book.book_name}
                        className="w-16 h-20 object-cover rounded-lg border border-gray-700 mx-auto"
                      />
                      <div className="text-blue-400 font-medium">{book.book_id}</div>
                      <div className="text-green-400 font-semibold truncate">{book.book_name}</div>
                      <div className="text-gray-300 text-sm truncate hidden md:block">
                        {book.author}
                      </div>
                      <div className="text-green-400 font-semibold text-sm">
                        {availableCopies(book)}/{book.total_count}
                      </div>
                      <div className="text-gray-300 text-sm">{issueCount(book.book_id)}</div>
                      <button
                        onClick={() => setExpanded(expanded === index ? null : index)}
                        className="flex items-center justify-center gap-2 text-cyan-400 hover:text-white transition-colors"
                      >
                        <span>{currentStudents.length}</span>
                        {expanded === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {expanded === index && currentStudents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 border-t border-gray-700 pt-4 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                          {currentStudents.map((stu: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-gray-900/60 border border-gray-700 rounded-lg p-3"
                            >
                              <img
                                src={stu?.photo_url || "https://via.placeholder.com/60x60?text=User"}
                                alt={stu?.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-700"
                              />
                              <div>
                                <p className="text-white font-medium text-sm">{stu?.name}</p>
                                <p className="text-gray-400 text-xs">{stu?.student_id}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
