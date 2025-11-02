import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

export function AddStudent() {
  const navigate = useNavigate();
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Auto-detect department & batch from roll number
  useEffect(() => {
    if (rollNo.startsWith('IS')) {
      setDepartment('Instrumentation Science');

      const yearCode = rollNo.substring(2, 4);
      if (/^\d{2}$/.test(yearCode)) {
        const startYear = parseInt('20' + yearCode);
        const endYear = startYear + 2;
        setBatch(`${startYear}–${endYear}`);
      } else {
        setBatch('');
      }
    } else {
      setDepartment('');
      setBatch('');
    }
  }, [rollNo]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check duplicates
      const { data: existingStudent } = await supabase
        .from("students")
        .select("roll_no")
        .eq("roll_no", rollNo)
        .maybeSingle();

      if (existingStudent) {
        addToast("Roll Number already exists", "error");
        setLoading(false);
        return;
      }

      const { data: existingEmail } = await supabase
        .from("students")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (existingEmail) {
        addToast("Email already exists", "error");
        setLoading(false);
        return;
      }

      let photoUrl = null;

      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `students/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("library-photos")
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error(uploadError.message);
          addToast("Photo upload failed", "error");
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("library-photos")
          .getPublicUrl(filePath);

        photoUrl = publicUrlData?.publicUrl || null;
      }

      //  Insert into Supabase
      const { error: insertError } = await supabase.from("students").insert({
        roll_no: rollNo,
        student_id: rollNo,
        name,
        department,
        batch,
        email,
        photo_url: photoUrl,
      });

      if (insertError) {
        console.error(insertError);
        addToast("Failed to add student", "error");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/write_student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roll_no: rollNo }),
        });

        if (response.ok) {
          console.log("Roll number sent to backend successfully");
        } else {
          console.error("Failed to send roll number to backend");
        }
      } catch (err) {
        console.error("Error sending roll number to backend:", err);
      }

      addToast("Student Added Successfully", "success");

      // Reset form
      setRollNo("");
      setName("");
      setDepartment("");
      setBatch("");
      setEmail("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setLoading(false);
    } catch (error) {
      console.error(error);
      addToast("An error occurred", "error");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              await fetch("http://localhost:5000/api/stop_write", { method: "POST" });
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

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Add New Student</h2>
              <p className="text-gray-400">Register a new student to the library</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Enter roll number (e.g. IS24...)"
                required
              />
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Enter student full name"
                required
              />
            </div>

            {/* Department (auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <input
                type="text"
                value={department}
                readOnly
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Auto-filled if applicable"
              />
            </div>

            {/* Batch (auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Batch</label>
              <input
                type="text"
                value={batch}
                readOnly
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Auto-filled if applicable"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Enter student email"
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student Photo</label>
              <div className="space-y-4">
                {photoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-full border-4 border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 w-full bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg px-4 py-8 text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-all cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>{photoFile ? 'Change Photo' : 'Upload Student Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding Student...
                </span>
              ) : (
                'Add Student'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
