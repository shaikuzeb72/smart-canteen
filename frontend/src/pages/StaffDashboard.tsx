import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Truck, MapPin, User, Phone, LogOut, XCircle, X, Lock, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

interface Order {
  id: string;
  user: { name: string; mobile: string };
  orderItems: { product: { name: string }, quantity: number, price: number }[];
  address: { building: string, room: string, instructions?: string, mobileNumber?: string | null };
  totalAmount: number;
  status: string;
  paymentMode: string;
  estimatedTime: string | null;
  createdAt: string;
  cancellationReason?: string | null;
}

const StaffDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Item Out of Stock');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchOrders();
    // In a real app, use WebSockets or polling. For now, simple polling every 10s
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI Update
    const prevOrders = [...orders];
    setOrders(orders.map(order => order.id === id ? { ...order, status: newStatus } : order));
    
    try {
      await apiClient.put(`/orders/${id}/status`, { status: newStatus });
      fetchOrders(); // sync with server
    } catch (error) {
      setOrders(prevOrders); // Revert on failure
      console.error('Failed to update status', error);
      toast.error('Failed to update status');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    try {
      await apiClient.put(`/orders/${cancellingOrderId}/staff-cancel`, { cancellationReason: cancelReason });
      fetchOrders();
      setCancelModalOpen(false);
      setCancellingOrderId(null);
      // We don't have toast imported, let's just log or we can import toast.
      // Wait, let's just fetchOrders. It will update the UI.
    } catch (error) {
      console.error('Failed to cancel order', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/auth/me/password', passwordForm);
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">New</span>;
      case 'ACCEPTED': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Accepted</span>;
      case 'PREPARING': return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">Preparing</span>;
      case 'PACKED': return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">Packed</span>;
      case 'ON_THE_WAY': return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">Out for Delivery</span>;
      case 'DELIVERED': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Delivered</span>;
      case 'CANCELLED': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Cancelled</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-10">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 p-6 transition-colors duration-500">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-4 flex justify-between items-center">
          <BackButton />
          <div className="flex items-center space-x-4">
            <div className="glass-panel px-3 py-1.5 rounded-full flex items-center shadow-sm space-x-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 hidden sm:block pl-2">Dark Mode</span>
              <ThemeToggle />
            </div>
            <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center px-4 py-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-sm">
              <Lock className="w-4 h-4 mr-2" /> Change Password
            </button>
            <button onClick={() => { logout(); window.location.href = '/'; }} className="flex items-center px-4 py-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur rounded-xl text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-8 glass-panel p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Smart Canteen Staff</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage incoming orders and update their status.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="glass-card rounded-3xl overflow-hidden flex flex-col hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-dark-800/40 flex justify-between items-center">
                <span className="font-extrabold text-lg text-primary-600 dark:text-primary-400 tracking-wider">#{order.id.slice(0, 8)}</span>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center"><User className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
                    <span className="font-bold text-gray-900 dark:text-white">{order.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center"><Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
                    <span className="text-sm font-medium">{order.address?.mobileNumber || order.user.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-start space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
                    <span className="text-sm font-medium mt-1">{order.address?.building}, {order.address?.room}</span>
                  </div>
                  {order.estimatedTime && (
                    <div className="flex items-start space-x-3 text-gray-700 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">{order.estimatedTime}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-3 text-gray-700 dark:text-gray-300 mt-2">
                    <span className="px-3 py-1 bg-white/60 dark:bg-dark-700/60 border border-gray-200/50 dark:border-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                      {order.paymentMode === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                  {order.address?.instructions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-11 italic bg-white/40 dark:bg-dark-800/40 p-2 rounded-lg border border-white/20">"{order.address.instructions}"</p>
                  )}
                  {order.status === 'CANCELLED' && order.cancellationReason && (
                    <div className="mt-3 bg-red-50/80 dark:bg-red-900/20 p-3 rounded-xl text-red-800 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/50">
                      Reason: {order.cancellationReason}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100/50 dark:border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
                  <ul className="space-y-2">
                    {order.orderItems.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300"><span className="font-extrabold text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5 rounded mr-1">{item.quantity}x</span> {item.product?.name || 'Deleted Product'}</span>
                        <span className="font-bold text-gray-500 dark:text-gray-400">₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-5 bg-white/40 dark:bg-dark-800/40 border-t border-white/20 dark:border-white/5">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center bg-white/50 dark:bg-dark-700/50 px-2 py-1 rounded-lg"><Clock className="w-3.5 h-3.5 mr-1.5"/> {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                  <span className="font-extrabold text-xl text-gray-900 dark:text-white">₹{order.totalAmount}</span>
                </div>
                
                <div className="flex space-x-2">
                  {order.status === 'PLACED' && (
                    <button onClick={() => updateStatus(order.id, 'ACCEPTED')} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]">Accept Order</button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button onClick={() => updateStatus(order.id, 'PREPARING')} className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]">Start Preparing</button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button onClick={() => updateStatus(order.id, 'PACKED')} className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]">Mark Packed</button>
                  )}
                  {order.status === 'PACKED' && (
                    <button onClick={() => updateStatus(order.id, 'ON_THE_WAY')} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] flex justify-center items-center"><Truck className="w-4 h-4 mr-2"/> Out for Delivery</button>
                  )}
                  {order.status === 'ON_THE_WAY' && (
                    <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] flex justify-center items-center"><CheckCircle className="w-4 h-4 mr-2"/> Delivered</button>
                  )}
                </div>
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <button 
                    onClick={() => { setCancellingOrderId(order.id); setCancelModalOpen(true); }}
                    className="w-full mt-3 bg-red-50/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center"><XCircle className="w-6 h-6 mr-2 text-red-500" /> Cancel Order</h2>
              <button onClick={() => { setCancelModalOpen(false); setCancellingOrderId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-5">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Please select a reason for cancellation. Stock will be restored automatically.</p>
              <select 
                className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-900 dark:text-white dark:bg-dark-800"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Item Out of Stock" className="dark:bg-dark-900">Item Out of Stock</option>
                <option value="Kitchen Closed" className="dark:bg-dark-900">Kitchen Closed</option>
                <option value="Delivery Issue" className="dark:bg-dark-900">Delivery Issue</option>
                <option value="Technical Problem" className="dark:bg-dark-900">Technical Problem</option>
                <option value="Other" className="dark:bg-dark-900">Other</option>
              </select>
              <button 
                onClick={handleCancelOrder}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-7 h-7" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPassword ? "text" : "password"} required className="w-full pl-5 pr-12 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500">
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} required minLength={6} className="w-full pl-5 pr-12 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500">
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">Update Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
