import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, GraduationCap, Briefcase, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get('role'); // student | staff | admin
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New: Student/Teacher toggle
  const [subRole, setSubRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    if (roleFromQuery === 'admin') {
      setEmail('admin@canteen.com');
      setPassword('admin123');
    } else if (roleFromQuery === 'staff') {
      setEmail('staff@canteen.com');
      setPassword('staff123');
    } else {
      setEmail('');
      setPassword('');
    }
  }, [roleFromQuery]);

  useEffect(() => {
    // Check if returning from Google OAuth
    const checkGoogleLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLoading(true);
        try {
          // Pass Supabase session details to our backend to generate our JWT
          const savedRole = localStorage.getItem('oauth_role') || 'STUDENT';
          const res = await apiClient.post('/auth/google', {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: savedRole.toUpperCase()
          });
          login(res.data.token, res.data.user);
          
          if (res.data.user.role === 'ADMIN') navigate('/admin');
          else if (res.data.user.role === 'STAFF') navigate('/staff');
          else navigate('/dashboard');
          
          // Sign out from Supabase since we have our custom JWT now
          await supabase.auth.signOut();
        } catch (err: any) {
          setError(err.response?.data?.message || 'Google Auth failed');
          toast.error('Google Authentication Failed');
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
          localStorage.removeItem('oauth_role');
        }
      }
    };
    checkGoogleLogin();
  }, []);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-gray-700' };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password);
  const isStrong = strength.label === 'Strong';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Email Validation Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (roleFromQuery === 'student' && !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      toast.error('Invalid email format');
      return;
    }

    if (!isLogin && roleFromQuery === 'student' && !isStrong) {
      setError('Please choose a strong password before continuing.');
      toast.error('Weak password');
      return;
    }

    setLoading(true);

    try {
      if (roleFromQuery === 'admin' && email === 'admin@canteen.com' && password === 'admin123') {
        login('dummy-admin-token', { id: 'admin1', name: 'Admin', email, role: 'ADMIN' });
        navigate('/admin');
        return;
      }

      if (roleFromQuery === 'staff' && email === 'staff@canteen.com' && password === 'staff123') {
        login('dummy-staff-token', { id: 'staff1', name: 'Staff', email, role: 'STAFF' });
        navigate('/staff');
        return;
      }

      if (isLogin) {
        const response = await apiClient.post('/auth/login', { email, password });
        login(response.data.token, response.data.user);
        
        if (response.data.user.role === 'ADMIN') navigate('/admin');
        else if (response.data.user.role === 'STAFF') navigate('/staff');
        else navigate('/dashboard');
      } else {
        // Pass subRole to backend
        await apiClient.post('/auth/register', { name, email, password, role: subRole });
        setIsLogin(true);
        setError('Registration successful! Please sign in.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    // Save selected role before redirecting
    localStorage.setItem('oauth_role', subRole);
    
    // Real Supabase OAuth Flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login?role=student'
      }
    });
    
    if (error) {
      setError(error.message);
      toast.error(error.message);
      setLoading(false);
    }
  };

  const roleDisplay = roleFromQuery === 'student' ? 'Student/Teacher' : roleFromQuery ? roleFromQuery.charAt(0).toUpperCase() + roleFromQuery.slice(1) : 'Student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card rounded-3xl overflow-hidden relative z-10"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 whitespace-nowrap mb-2 tracking-tight pr-2 pb-1">Smart Canteen</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {roleDisplay} {isLogin ? 'Login' : 'Registration'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 mb-4 text-sm rounded-xl text-center font-medium ${error.includes('successful') ? 'bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100/80 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {roleFromQuery === 'student' && (
              <div className="flex p-1 bg-gray-100 dark:bg-dark-900 rounded-xl border border-gray-300 dark:border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setSubRole('student')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-bold rounded-lg transition-all ${subRole === 'student' ? 'bg-white dark:bg-dark-700 shadow text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-white/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                  <GraduationCap className="w-4 h-4 mr-2" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setSubRole('teacher')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-bold rounded-lg transition-all ${subRole === 'teacher' ? 'bg-white dark:bg-dark-700 shadow text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-white/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                  <Briefcase className="w-4 h-4 mr-2" /> Teacher
                </button>
              </div>
            )}

            {!isLogin && roleFromQuery === 'student' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  placeholder={roleFromQuery === 'student' ? (subRole === 'teacher' ? 'teacher@gmail.com' : 'student@gmail.com') : 'name@institution.edu'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={roleFromQuery === 'admin' || roleFromQuery === 'staff'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full pl-10 pr-12 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={roleFromQuery === 'admin' || roleFromQuery === 'staff'}
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Meter - Only on Registration */}
              <AnimatePresence>
                {!isLogin && roleFromQuery === 'student' && password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${level <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${strength.label === 'Strong' ? 'text-green-600 dark:text-green-400' : strength.label === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                        {strength.label} Password
                      </span>
                      {strength.label === 'Strong' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                    <ul className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      <li>• Min 8 chars & 1 Number</li>
                      <li>• 1 Uppercase & 1 Lowercase</li>
                      <li>• 1 Special Character</li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isLogin && roleFromQuery === 'student' && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400">Forgot password?</Link>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (!isLogin && roleFromQuery === 'student' && !isStrong)}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </div>
              ) : (isLogin ? 'Sign In to Smart Canteen' : 'Create Account')}
              {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {roleFromQuery === 'student' && (
            <>
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl shadow-sm bg-white dark:bg-dark-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </div>
            </>
          )}

          {roleFromQuery === 'student' && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }} 
                  className="font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors"
                  type="button"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold"
            >
              ← Back to Role Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
