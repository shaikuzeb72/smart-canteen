import { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid token. Please request a new link.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', { token, newPassword });
      toast.success(response.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="glass-card rounded-3xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Set New Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Enter your new secure password below.</p>
        </div>

        {!token ? (
          <div className="text-center py-6">
            <p className="text-red-500 font-bold mb-4">No reset token found in URL.</p>
            <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Go back to Forgot Password</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Update Password
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
