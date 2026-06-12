import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Coffee, Pizza, ShoppingCart, Clock, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const categories = [
    { name: 'All Products', icon: ShoppingBag, path: '/dashboard' },
    { name: 'Snacks & Drinks', icon: Coffee, path: '/dashboard?category=snacks' },
    { name: 'Food & Cafe', icon: Pizza, path: '/dashboard?category=food' },
    { name: 'Stationary', icon: PenTool, path: '/dashboard?category=stationary' },
    { name: 'Cart', icon: ShoppingCart, path: '/cart' },
    { name: 'Order History', icon: Clock, path: '/orders' },
  ];

  const location = useLocation();

  const checkIsActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search.includes('category=');
    }
    if (path.startsWith('/dashboard?category=')) {
      return location.pathname === '/dashboard' && location.search.includes(path.split('?')[1]);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-20 md:w-64 glass-card border-none flex flex-col h-full z-30">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-100/50 dark:border-white/5">
        <h1 className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 whitespace-nowrap hidden md:block tracking-tight truncate pr-2 pb-1">
          Smart Canteen
        </h1>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold shadow-lg shadow-primary-500/30 md:hidden">
          C
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-3 md:px-4 relative">
          <p className="hidden md:block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">Menu</p>
          {categories.map((item) => {
            const isActive = checkIsActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400 font-bold' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-2xl shadow-inner border border-primary-100 dark:border-primary-800/50"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="hidden md:block relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
