import { useState, useEffect } from 'react';
import { Package, CheckCircle, Truck, Clock, XCircle, Trash2, CreditCard, Banknote, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import BackButton from '../components/BackButton';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  estimatedTime: string | null;
  createdAt: string;
  orderItems: { product: { name: string } | null, quantity: number, price: number }[];
  address: { building: string, room: string, instructions?: string, mobileNumber?: string | null } | null;
  cancellationReason?: string | null;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const res = await apiClient.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await apiClient.delete(`/orders/${id}`);
      toast.success('Order history deleted');
      setOrders(orders.filter(o => o.id !== id));
    } catch (error) {
      toast.error('Failed to delete order history');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'ON_THE_WAY') return <Truck className="w-5 h-5 text-orange-500" />;
    if (status === 'CANCELLED') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading order history...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 relative z-10">
      <div className="mb-6 glass-panel p-6 rounded-3xl">
        <BackButton className="mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center tracking-tight">
          <Package className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Order History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">View all your previous and active Smart Canteen orders.</p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 font-medium">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            No orders placed yet. Start ordering your favorite items from Smart Canteen!
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="glass-card rounded-3xl overflow-hidden hover:shadow-2xl transition-all relative group hover:-translate-y-1">
              <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-dark-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="font-extrabold text-gray-900 dark:text-white text-lg mr-3 tracking-wider">Order #{order.id.slice(0, 8)}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/80 dark:bg-dark-800/80 border border-white/20 dark:border-white/5 px-4 py-2 rounded-xl shadow-sm backdrop-blur">
                  {getStatusIcon(order.status)}
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${order.status === 'CANCELLED' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{order.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {order.status === 'CANCELLED' && order.cancellationReason && (
                <div className="px-5 pt-5 pb-0">
                  <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-4 flex items-start text-red-800 dark:text-red-400 text-sm">
                    <XCircle className="w-5 h-5 mr-3 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <span className="font-extrabold block mb-1">Order Cancelled</span>
                      <span className="font-medium">{order.cancellationReason}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Items Ordered</h4>
                  {order.estimatedTime && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-800/50">{order.estimatedTime}</span>
                  )}
                </div>

                {order.address && (
                  <div className="mb-5 p-4 bg-white/40 dark:bg-dark-800/40 rounded-2xl border border-white/20 dark:border-white/5 text-sm text-gray-700 dark:text-gray-300 space-y-2 font-medium">
                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" /> {order.address.building}, {order.address.room}</p>
                    <p className="flex items-center"><Phone className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" /> {order.address.mobileNumber || 'N/A'}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100/50 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <span className="font-extrabold text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md mr-3">{item.quantity}x</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{item.product?.name || 'Deleted Product'}</span>
                      </div>
                      <span className="font-extrabold text-gray-500 dark:text-gray-400 text-base">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/30 dark:bg-dark-800/30 p-5 border-t border-white/20 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-700 flex items-center justify-center shadow-sm">
                    {order.paymentMode === 'COD' ? <Banknote className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider mb-0.5">Payment Method</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold inline-block w-max ${order.paymentMode === 'COD' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'}`}>{order.paymentMode === 'COD' ? 'CASH ON DELIVERY' : 'ONLINE PAYMENT'}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-5 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Amount</span>
                    <span className="font-extrabold text-2xl text-primary-600 dark:text-primary-400">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setDeletingId(order.id)}
                    className="p-3 bg-white/50 dark:bg-dark-700/50 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all shadow-sm hover:shadow border border-white/20 dark:border-white/5"
                    title="Delete Order History"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 border-b border-white/20 dark:border-white/5 flex items-center text-red-500 bg-white/40 dark:bg-dark-800/40">
              <Trash2 className="w-7 h-7 mr-3" />
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Delete Order</h3>
            </div>
            <div className="p-8">
              <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">Are you sure you want to delete this order history? This action cannot be undone.</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 px-4 glass-panel text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-white/50 dark:hover:bg-dark-800/50 transition-colors border border-white/20"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteOrder(deletingId)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
