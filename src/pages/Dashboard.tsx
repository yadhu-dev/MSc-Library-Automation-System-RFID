import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  BookPlus,
  UserPlus,
  Search,
  LogOut,
  Library,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const cards = [
  {
    title: 'Issue / Return Book',
    description: 'Manage book transactions',
    icon: BookOpen,
    path: '/issue-return',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Add Book',
    description: 'Add new books to library',
    icon: BookPlus,
    path: '/add-book',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Add Student',
    description: 'Register new students',
    icon: UserPlus,
    path: '/add-student',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Student Profile',
    description: 'View student details',
    icon: Search,
    path: '/student-profile',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Library Details',
    description: 'View or update library info',
    icon: Library,
    path: '/library-details',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    title: 'Registered Students',
    description: 'View list of all students',
    icon: Users,
    path: '/students-list',
    gradient: 'from-teal-500 to-lime-500',
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  //  FIXED: moved handleCardClick inside the component
  const handleCardClick = async (path: string) => {
    let mode = '';

    // Decide mode based on path
    if (path === '/issue-return' || path === '/student-profile') {
      mode = 'read';
    } else if (path === '/add-student' || path === '/add-book') {
      mode = 'write';
    }

    if (mode) {
      try {
        const res = await fetch('http://localhost:5000/api/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });

        const data = await res.json();
        console.log('Backend:', data);
      } catch (err) {
        console.error(' Error sending mode:', err);
      }
    }
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent animate-pulse"
        style={{ animationDuration: '8s' }}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src="/SPPU_Logo.png"
                  alt="SPPU Logo"
                  className="h-24 w-24 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Savitribai Phule Pune University
                  </h1>
                  <p className="text-gray-400 text-base">
                    Department of Instrumentation Science
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Cards */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Library Management Dashboard
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.path}
                onClick={() => handleCardClick(card.path)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 cursor-pointer overflow-hidden h-48"
              >
                {/* Gradient glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                ></div>

                <div className="relative">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                    {card.description}
                  </p>

                  <div className="mt-3 flex items-center text-gray-500 group-hover:text-gray-300 transition-colors text-sm">
                    <span>Click to open</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
