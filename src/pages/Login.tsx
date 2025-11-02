import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Port states
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [connectedPort, setConnectedPort] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // 🔹 Fetch available ports from Flask backend
  const fetchPorts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ports');
      const data = await res.json();
      setPorts(data.ports || []);
    } catch (err) {
      console.error('Error fetching ports:', err);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  // 🔹 Connect to selected port
  const handleConnect = async () => {
  if (!selectedPort) return;
  setIsConnecting(true);

  try {
    const response = await fetch("http://localhost:5000/api/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ port: selectedPort }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(" Backend response:", data);
      setConnectedPort(selectedPort);
    } else {
      console.error(" Backend error:", data.error || "Connection failed");
    }
  } catch (error) {
    console.error(" Network error while connecting:", error);
  } finally {
    setIsConnecting(false);
  }
};


  // 🔹 Disconnect port
  const handleDisconnect = async () => {
    try {
      await fetch('http://localhost:5000/api/disconnect', {
        method: 'POST',
      });
      setConnectedPort('');
      setSelectedPort('');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // 🔹 Login handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Invalid email or password. Access restricted to authorized users.');
      setLoading(false);
      return;
    }

    if (data?.user) {
      console.log('Authenticated user:', data.user.email);
      navigate('/dashboard');
    } else {
      setError('Authentication failed.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>

      {/*  Port Control Panel (Top-right) */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 right-6 w-64 bg-gray-800/60 backdrop-blur-xl border border-cyan-500/40 rounded-xl shadow-lg p-4 text-white z-20"
      >
        <h3 className="text-sm font-semibold text-cyan-400 mb-2 text-center">Select Port</h3>

        {!connectedPort ? (
          <>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 mb-3 text-sm text-green focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">-- Choose Port --</option>
              {ports.length > 0 ? (
                ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))
              ) : (
                <option disabled>No ports found</option>
              )}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConnect}
              disabled={!selectedPort || isConnecting}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-medium text-sm py-2 rounded-lg hover:shadow-md hover:shadow-cyan-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center text-sm">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </motion.button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-cyan-400 text-sm mb-2">
               Connected to <span className="font-semibold">{connectedPort}</span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDisconnect}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm py-2 rounded-lg hover:shadow-md hover:shadow-red-500/40 transition-all duration-300"
            >
              Disconnect
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* 🔹 Login Box (Unchanged) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-grey-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-gray-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl font-bold text-center text-white mb-2">Authorized Access</h2>
            <p className="text-gray-400 text-center mb-8">Sign in with your library credentials</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
