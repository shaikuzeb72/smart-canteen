import { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      // Since this is a demo without a real SMTP mailer, the backend returns the token directly
      if (response.data.token) {
        toast.success('Simulation: Email sent! Redirecting to reset...', { duration: 4000 });
        setTimeout(() => {
          navigate(`/reset-password?token=${response.data.token}`);
        }, 2000);
      } else {
        toast.success(response.data.message || 'If the email exists, a reset link has been sent.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="glass-card rounded-3xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Enter your Smart Canteen account email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  placeholder="you@Smart Canteen.com"
                  value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Send Reset Link
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
          Remember your password? <Link to="/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-bold">Log in here</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
