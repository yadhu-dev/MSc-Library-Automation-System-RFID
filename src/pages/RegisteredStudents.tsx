import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabase';
export default function AllRegisteredStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [issuedData, setIssuedData] = useState<Record<string, { total: number; notReturned: number }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from("students").select("*").order("name", { ascending: true });
    if (error) console.error(error);
    else {
      setStudents(data || []);
      fetchIssuedData();
    }
  };

  const fetchIssuedData = async () => {
    const { data: issued, error } = await supabase
      .from("issued_books")
      .select("student_id, return_status");

    if (error) {
      console.error(error);
      return;
    }

    const stats: Record<string, { total: number; notReturned: number }> = {};

    issued?.forEach((item) => {
      const sid = item.student_id;
      if (!stats[sid]) stats[sid] = { total: 0, notReturned: 0 };

      stats[sid].total += 1;
      if (item.return_status === "issued") stats[sid].notReturned += 1;
    });

    setIssuedData(stats);
  };


  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-10 gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-cyan-400 hover:text-white transition-all hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <h1 className="text-2xl font-bold text-white drop-shadow-lg tracking-wide text-center flex-1">
          All Registered Students
        </h1>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name or Roll No"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/70 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table Header (centered) */}
      <div className="hidden lg:grid grid-cols-6 gap-4 text-gray-400 text-sm font-semibold mb-3 px-4 items-center">
        <p className="text-center">Photo</p>
        <p className="text-center">Roll No</p>
        <p className="text-center">Name</p>
        <p className="text-center">Email</p>
        <p className="text-center">Department</p>
        <p className="text-center">Books (Issued / Not Returned)</p>
      </div>

      {/* Student Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredStudents.length === 0 ? (
            <motion.p
              className="text-center text-gray-400 mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No students found.
            </motion.p>
          ) : (
            filteredStudents.map((student) => {
              const stats = issuedData[student.student_id] || { total: 0, notReturned: 0 };
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center bg-gray-900/60 border border-cyan-500/20 rounded-xl p-4 hover:shadow-[0_0_25px_rgba(0,255,255,0.25)] hover:border-cyan-400/40 transition-all duration-300"
                >
                  {/* Photo */}
                  <div className="flex justify-center">
                    <img
                      src={student.photo_url || '/default-student.png'}
                      alt={student.name}
                      className="w-24 h-24 rounded-lg object-cover border border-cyan-400/30 shadow-lg"
                    />
                  </div>

                  {/* Roll No */}
                  <p className="text-blue-400 font-semibold text-lg text-center">{student.student_id}</p>

                  {/* Name */}
                  <p className="text-green-400 font-semibold text-lg text-center">{student.name}</p>

                  {/* Email */}
                  <p className="text-gray-300 text-sm text-center">{student.email}</p>

                  {/* Department */}
                  <p className="text-gray-400 text-sm text-center">{student.department}</p>

                  {/* Book Stats */}
                  <div className="text-center">
                    <p className="text-cyan-400 font-semibold">
                      {stats.total} <span className="text-gray-400">/</span>{" "}
                      <span className="text-red-400">{stats.notReturned}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
