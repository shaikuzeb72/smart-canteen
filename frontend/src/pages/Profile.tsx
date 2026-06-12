import { useState, useEffect } from 'react';
import { User, Package, MapPin, LogOut, ChevronRight, CheckCircle, Truck, Clock, XCircle, Trash2, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import BackButton from '../components/BackButton';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  estimatedTime: string | null;
  createdAt: string;
  orderItems: { product: { name: string }, quantity: number }[];
}

interface SavedAddress {
  id: string;
  building: string;
  floor: string | null;
  room: string;
  instructions: string | null;
  mobileNumber: string | null;
}

import ThemeToggle from '../components/ThemeToggle';

const ORDER_STAGES = ['PLACED', 'ACCEPTED', 'PREPARING', 'PACKED', 'ON_THE_WAY', 'DELIVERED'];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchMyOrders();
    fetchAddresses();
    // Poll for live tracking updates
    const interval = setInterval(fetchMyOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyOrders = async () => {
    try {
      const res = await apiClient.get('/orders/my-orders');
      // only show active orders in Profile live tracking
      setOrders(res.data.filter((o: Order) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get('/auth/me/addresses');
      setSavedAddresses(res.data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await apiClient.delete(`/auth/me/addresses/${id}`);
      toast.success('Address deleted successfully');
      setSavedAddresses(savedAddresses.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login?role=student');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'ON_THE_WAY') return <Truck className="w-5 h-5 text-orange-500" />;
    if (status === 'CANCELLED') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const getProgressPercentage = (status: string) => {
    const idx = ORDER_STAGES.indexOf(status);
    if (idx === -1) return 0;
    return ((idx) / (ORDER_STAGES.length - 1)) * 100;
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 relative z-10">
      <div className="mb-8 glass-panel p-6 rounded-3xl">
        <BackButton className="mb-4" />
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center border-4 border-white/50 dark:border-white/10 shadow-lg shrink-0">
            <User className="w-10 h-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{user?.name || 'Student'}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{user?.email}</p>
            {(user?.mobile || user?.department) && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 font-medium">
                {user.department && <span className="mr-3 text-primary-700 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/50 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">{user.department}</span>}
                {user.mobile}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden mb-8 shadow-xl">
        <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-dark-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h2 className="font-extrabold text-xl text-gray-900 dark:text-white">Live Order Tracking</h2>
          </div>
          <button onClick={() => navigate('/orders')} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-white/50 dark:bg-dark-700/50 px-3 py-1.5 rounded-lg border border-white/20 dark:border-white/5 transition-colors shadow-sm">View All History</button>
        </div>
        <div className="divide-y divide-gray-100/50 dark:divide-white/5">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium">No active orders right now.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="p-6 hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-extrabold text-gray-900 dark:text-white mr-3 tracking-wider">Order #{order.id.slice(0, 8)}</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                    {order.estimatedTime && (
                      <div className="mt-2 block w-max text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/50 px-2 py-1 rounded-md">
                        {order.estimatedTime}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 dark:bg-dark-700/80 border border-white/20 dark:border-white/5 shadow-sm px-3 py-1.5 rounded-full backdrop-blur">
                    {getStatusIcon(order.status)}
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-700 dark:text-gray-300">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium bg-white/50 dark:bg-dark-800/50 p-3 rounded-xl border border-white/20 dark:border-white/5 shadow-sm">
                  {order.orderItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                </div>
                
                {/* Progress Bar UI */}
                <div className="mb-5">
                  <div className="h-2 w-full bg-gray-200/50 dark:bg-dark-700/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-in-out relative" 
                      style={{ width: `${getProgressPercentage(order.status)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-extrabold uppercase tracking-wider">
                    <span className={ORDER_STAGES.indexOf(order.status) >= 0 ? 'text-primary-600 dark:text-primary-400' : ''}>Placed</span>
                    <span className={ORDER_STAGES.indexOf(order.status) >= 1 ? 'text-primary-600 dark:text-primary-400' : ''}>Accepted</span>
                    <span className={ORDER_STAGES.indexOf(order.status) >= 2 ? 'text-primary-600 dark:text-primary-400' : ''}>Preparing</span>
                    <span className={ORDER_STAGES.indexOf(order.status) >= 3 ? 'text-primary-600 dark:text-primary-400' : ''}>Packed</span>
                    <span className={ORDER_STAGES.indexOf(order.status) >= 4 ? 'text-primary-600 dark:text-primary-400' : ''}>On the Way</span>
                    <span className={ORDER_STAGES.indexOf(order.status) >= 5 ? 'text-primary-600 dark:text-primary-400' : ''}>Delivered</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-5 border-t border-gray-100/50 dark:border-white/5">
                  <div className="flex items-center space-x-2">
                    {order.paymentMode === 'COD' ? <Banknote className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                    <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">{order.paymentMode === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                  </div>
                  <span className="font-extrabold text-xl text-gray-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {orders.length > 0 && (
        <div className="glass-card rounded-3xl overflow-hidden mb-8 shadow-md">
          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Need help with your order?</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Call support or raise a ticket.</p>
            </div>
            <button 
              onClick={() => setShowHelpModal(true)}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Contact Support
            </button>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 border border-white/20 relative shadow-2xl">
            <button 
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">Support Contacts</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-dark-800/50 rounded-2xl border border-white/20">
                <h3 className="font-bold text-primary-600 dark:text-primary-400 mb-2 uppercase tracking-wider text-xs">Admin Support</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">📞 +91 98765 43210</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">✉️ admin@Smart Canteen.com</p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-dark-800/50 rounded-2xl border border-white/20">
                <h3 className="font-bold text-primary-600 dark:text-primary-400 mb-2 uppercase tracking-wider text-xs">Staff/Kitchen Support</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">📞 +91 87654 32109</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">✉️ kitchen@Smart Canteen.com</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-dark-800/40">
          <h2 className="font-extrabold text-xl text-gray-900 dark:text-white">Settings</h2>
        </div>
        <div className="divide-y divide-gray-100/50 dark:divide-white/5">
          <div className="w-full flex items-center justify-between p-5 hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                <span className="text-xl">🌙</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-white">Dark Mode</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Toggle dark appearance</div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <button 
            onClick={() => setShowAddresses(!showAddresses)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-white">Saved Addresses</div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showAddresses ? 'rotate-90' : ''}`} />
          </button>
          
          {showAddresses && (
            <div className="bg-white/20 dark:bg-dark-800/20 p-5 border-b border-white/20 dark:border-white/5">
              {savedAddresses.length === 0 ? (
                <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-4">No saved addresses yet. Place an order to save your address automatically.</p>
              ) : (
                <div className="space-y-4">
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className="glass-panel p-5 rounded-2xl flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">{addr.building}</h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Room: {addr.room}</p>
                        {addr.floor && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Floor: {addr.floor}</p>}
                        {addr.mobileNumber && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Mobile: {addr.mobileNumber}</p>}
                        {addr.instructions && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 italic bg-white/40 dark:bg-dark-800/40 p-2 rounded-lg border border-white/20">"{addr.instructions}"</p>}
                      </div>
                      <button 
                        onClick={() => deleteAddress(addr.id)}
                        className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl bg-white/50 dark:bg-dark-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border border-white/20 dark:border-white/5 shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-between p-5 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-colors group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="font-bold text-red-600 dark:text-red-400">Logout</div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-300 dark:text-red-500/50 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
