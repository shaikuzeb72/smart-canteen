import { useNavigate } from 'react-router-dom';
import { User, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-primary-600 dark:text-primary-400 whitespace-nowrap mb-4 tracking-tight pr-2 pb-1"
          >
            Smart Canteen
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-lg font-medium"
          >
            Please select your role to continue
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => handleRoleSelect('student')}
            className="glass-card p-8 rounded-3xl cursor-pointer transition-all group text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40 transition-colors shadow-inner">
              <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student / Teacher</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Order food, check live tracking, and manage your cart.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => handleRoleSelect('staff')}
            className="glass-card p-8 rounded-3xl cursor-pointer transition-all group text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 dark:group-hover:bg-green-800/40 transition-colors shadow-inner">
              <Users className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Staff</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage active orders and update preparation status.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => handleRoleSelect('admin')}
            className="glass-card p-8 rounded-3xl cursor-pointer transition-all group text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-100 dark:group-hover:bg-purple-800/40 transition-colors shadow-inner">
              <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage products, categories, coupons, and users.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
