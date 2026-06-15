import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, Tag, Package, MapPin, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    weight: string;
    imageUrl: string;
    stock: number;
  };
}

interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  minOrderValue: number;
}

interface SavedAddress {
  id: string;
  building: string;
  floor: string | null;
  room: string;
  instructions: string | null;
  mobileNumber: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BUILDINGS = [
  'Annex Block',
  'Admin Block',
  'Library Block',
  'Degree Canteen Area',
  'Annex Quadrangle',
  'Admin Quadrangle'
];

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [address, setAddress] = useState({ building: '', floor: '', room: '', instructions: '', mobileNumber: '' });

  const [settings, setSettings] = useState<any>({ deliveryFee: 10, platformFee: 5, gstPercent: 5, freeDeliveryThreshold: 149, isMaintenance: false });

  useEffect(() => {
    fetchCart();
    fetchCoupons();
    fetchSavedAddresses();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await apiClient.get('/cart');
      setCartItems(response.data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
      toast.error('Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await apiClient.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to fetch coupons', error);
    }
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await apiClient.get('/auth/me/addresses');
      setSavedAddresses(response.data);
    } catch (error) {
      console.error('Failed to load addresses', error);
    }
  };

  const updateQuantity = async (id: string, current: number, delta: number) => {
    const newQty = current + delta;
    if (newQty < 1) return removeItem(id);
    const item = cartItems.find(i => i.id === id);
    if (item && newQty > item.product.stock) {
      toast.error(`Cannot add more. Only ${item.product.stock} left in stock.`);
      return;
    }
    
    // Optimistic update
    const prevItems = [...cartItems];
    setCartItems(cartItems.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    window.dispatchEvent(new Event('cartUpdated'));

    try {
      await apiClient.put(`/cart/${id}`, { quantity: newQty });
    } catch (error) {
      setCartItems(prevItems);
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (id: string) => {
    // Optimistic update
    const prevItems = [...cartItems];
    setCartItems(cartItems.filter(i => i.id !== id));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed');
    
    try {
      await apiClient.delete(`/cart/${id}`);
    } catch (error) {
      setCartItems(prevItems);
      toast.error('Failed to remove item');
    }
  };

  const itemTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const platformFee = settings.platformFee;
  const gst = itemTotal * (settings.gstPercent / 100);
  const eligibleTotal = itemTotal + platformFee + gst;
  const freeDeliveryLimit = settings.freeDeliveryThreshold ?? 149;
  const deliveryFee = eligibleTotal >= freeDeliveryLimit ? 0 : settings.deliveryFee;
  let discount = 0;

  if (appliedCoupon) {
    if (itemTotal >= appliedCoupon.minOrderValue) {
      discount = appliedCoupon.discountAmount;
    } else {
      setAppliedCoupon(null);
      if (itemTotal > 0) toast.error('Coupon removed: Minimum order amount not reached');
    }
  }

  const subtotal = itemTotal + deliveryFee + platformFee + gst;
  const toPay = subtotal - discount;

  const handleApplyCoupon = (coupon: Coupon) => {
    if (cartItems.length === 0) {
      toast.error('Add items to cart first');
      return;
    }
    if (itemTotal >= coupon.minOrderValue) {
      setAppliedCoupon(coupon);
      toast.success(`Coupon ${coupon.code} applied successfully!`);
    } else {
      toast.error(`Minimum order amount not reached (₹${coupon.minOrderValue})`);
    }
  };

  const handleSavedAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const selected = savedAddresses.find(a => a.id === id);
    if (selected) {
      setAddress({
        building: selected.building,
        floor: selected.floor || '',
        room: selected.room,
        instructions: selected.instructions || '',
        mobileNumber: selected.mobileNumber || ''
      });
      toast.success('Address applied');
    }
  };

  const validateCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }
    if (!address.building) {
      toast.error('Please select a building');
      return false;
    }
    if ((address.building === 'Annex Block' || address.building === 'Admin Block') && !address.floor) {
      toast.error('Please select a floor');
      return false;
    }
    if (!address.room) {
      toast.error('Please provide room/desk details');
      return false;
    }
    if (!address.mobileNumber || address.mobileNumber.length !== 10 || !/^\d+$/.test(address.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const triggerCheckout = () => {
    if (validateCheckout()) {
      setIsConfirmModalOpen(true);
    }
  };

  const executeCheckout = async () => {
    setIsConfirmModalOpen(false);
    const loadingToast = toast.loading('Placing your order...');

    try {
      // 1. Create Order in Database
      const { data: dbOrder } = await apiClient.post('/orders', {
        totalAmount: toPay,
        paymentStatus: 'PENDING',
        paymentMode: paymentMode,
        address: {
          building: address.building,
          floor: address.floor,
          room: address.room,
          instructions: address.instructions,
          mobileNumber: address.mobileNumber
        }
      });

      if (paymentMode === 'COD') {
        toast.success('Order Placed Successfully!', { id: loadingToast });
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/dashboard');
        return;
      }

      // ONLINE PAYMENT FLOW
      toast.loading('Initializing payment...', { id: loadingToast });
      const { data: rzpOrder } = await apiClient.post('/orders/razorpay-create', { 
        amount: toPay,
        receipt: dbOrder.id
      });

      const options = {
        key: 'rzp_test_SsRgPaAKjIR8OJ',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Smart Canteen',
        description: 'Order Payment',
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          try {
            await apiClient.post('/payment/verify', {
              orderId: dbOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            toast.success('Payment Successful! Order Placed Successfully!', { id: loadingToast });
            window.dispatchEvent(new Event('cartUpdated'));
            navigate('/dashboard');
          } catch (err) {
            console.error('Payment verification failed', err);
            toast.error('Payment verification failed', { id: loadingToast });
          }
        },
        modal: {
          ondismiss: async function() {
            toast.error('Payment Cancelled', { id: loadingToast });
            try {
              await apiClient.put(`/orders/${dbOrder.id}/cancel`);
            } catch (err) {
              console.error('Failed to cancel order', err);
            }
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: address.mobileNumber
        },
        theme: { color: '#6366f1' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        toast.error(`Payment Failed: ${response.error.description}`, { id: loadingToast });
        try {
          apiClient.put(`/orders/${dbOrder.id}/cancel`);
        } catch (err) {
          console.error('Failed to cancel order', err);
        }
      });
      rzp.open();

    } catch (error) {
      console.error('Checkout failed', error);
      toast.error('Checkout failed');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading cart...</div>;

  const requiresFloor = address.building === 'Annex Block' || address.building === 'Admin Block';

  return (
    <div className="max-w-4xl mx-auto pb-10 relative z-10">
      <div className="mb-8 glass-panel p-6 rounded-3xl">
        <BackButton className="mb-4" />
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Your Cart</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-3xl">
              <Package className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-6 drop-shadow-md" />
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Looks like you haven't added anything yet.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-8 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">Browse Smart Canteen</button>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className="glass-card rounded-3xl p-5 flex items-center hover:shadow-lg transition-shadow">
                  <img 
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=100&h=100"} 
                    alt={item.product.name} 
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 rounded-2xl object-cover drop-shadow-sm"
                  />
                  <div className="ml-5 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.product.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white/50 dark:bg-dark-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-5 h-5"/></button>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{item.product.weight || '1 portion'}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xl text-gray-900 dark:text-white">₹{item.product.price}</span>
                      <div className="flex items-center space-x-3 bg-white/60 dark:bg-dark-800/60 rounded-xl p-1.5 border border-white/20 dark:border-white/5 shadow-sm">
                        <button onClick={() => updateQuantity(item.id, item.quantity, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-dark-700 text-gray-600 dark:text-gray-300 shadow-sm hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="glass-card rounded-3xl p-6">
                <h3 className="font-extrabold text-gray-900 dark:text-white mb-5 flex items-center text-lg"><MapPin className="w-6 h-6 mr-2 text-primary-500" /> Delivery Details</h3>
                
                {savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <select 
                      onChange={handleSavedAddressSelect}
                      className="w-full px-5 py-3 bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-900 dark:text-primary-400 font-bold appearance-none"
                    >
                      <option value="" className="dark:bg-dark-900">Use a Saved Address...</option>
                      {savedAddresses.map(sa => (
                        <option key={sa.id} value={sa.id} className="dark:bg-dark-900">{sa.building} - {sa.room}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <select 
                      className="w-full px-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none font-bold text-gray-900 dark:text-white dark:bg-dark-800 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      value={address.building}
                      onChange={e => setAddress({...address, building: e.target.value, floor: ''})}
                    >
                      <option value="" className="dark:bg-dark-900">🏢 Select Building Block</option>
                      {BUILDINGS.map(b => <option key={b} value={b} className="dark:bg-dark-900">🏢 {b}</option>)}
                    </select>

                    {requiresFloor ? (
                      <select 
                        className="w-full px-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none font-bold text-gray-900 dark:text-white dark:bg-dark-800 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        value={address.floor}
                        onChange={e => setAddress({...address, floor: e.target.value})}
                      >
                        <option value="" className="dark:bg-dark-900">🪜 Select Floor</option>
                        {FLOORS.map(f => <option key={f} value={f} className="dark:bg-dark-900">🪜 {f}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center justify-center glass-panel rounded-xl px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">
                        {address.building ? 'No floor selection required for this location.' : 'Select a building first.'}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-xl">🚪</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Room Number / Specific Area" 
                      className="w-full pl-12 pr-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                      value={address.room} 
                      onChange={e => setAddress({...address, room: e.target.value})} 
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-xl">📱</span>
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Mobile Number (10 digits)" 
                      className="w-full pl-12 pr-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                      value={address.mobileNumber} 
                      onChange={e => setAddress({...address, mobileNumber: e.target.value})} 
                      maxLength={10}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute z-10 top-3 left-0 pl-4 pointer-events-none">
                      <span className="text-xl">📝</span>
                    </div>
                    <textarea 
                      placeholder="Additional Instructions (Optional)" 
                      className="w-full pl-12 pr-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                      rows={2} 
                      value={address.instructions} 
                      onChange={e => setAddress({...address, instructions: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 mt-6">
                <h3 className="font-extrabold text-gray-900 dark:text-white mb-5 text-lg">Payment Mode</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${paymentMode === 'ONLINE' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-white/10 hover:bg-white/50 dark:hover:bg-dark-800/50'}`}>
                    <input type="radio" name="paymentMode" value="ONLINE" checked={paymentMode === 'ONLINE'} onChange={() => setPaymentMode('ONLINE')} className="hidden" />
                    <span className={`font-bold ${paymentMode === 'ONLINE' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>💳 Online Payment</span>
                  </label>
                  <label className={`flex items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${paymentMode === 'COD' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-white/10 hover:bg-white/50 dark:hover:bg-dark-800/50'}`}>
                    <input type="radio" name="paymentMode" value="COD" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} className="hidden" />
                    <span className={`font-bold ${paymentMode === 'COD' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>💵 Cash on Delivery</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-3xl border border-blue-200/50 dark:border-blue-800/50 overflow-hidden shadow-sm backdrop-blur">
            <div className="bg-blue-100/50 dark:bg-blue-800/30 px-5 py-4 border-b border-blue-200/50 dark:border-blue-800/50 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md mr-3 uppercase shadow-sm">OFFERS</span>
              <span className="text-sm font-bold text-blue-900 dark:text-blue-100">Available Coupons</span>
            </div>
            <div className="p-5 space-y-5 max-h-72 overflow-y-auto">
              {coupons.map(coupon => {
                const isApplicable = itemTotal >= coupon.minOrderValue;
                const isApplied = appliedCoupon?.id === coupon.id;
                return (
                  <div key={coupon.id} className="flex items-start justify-between border-b border-blue-200/50 dark:border-blue-800/50 pb-5 border-dashed last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-4 mt-0.5 shrink-0 shadow-inner">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">{coupon.code}</h4>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md inline-block">₹{coupon.discountAmount} OFF</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">On orders above ₹{coupon.minOrderValue}</p>
                        {!isApplicable && itemTotal > 0 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-bold">Add ₹{coupon.minOrderValue - itemTotal} more to apply</p>
                        )}
                      </div>
                    </div>
                    {isApplied ? (
                      <button onClick={() => { setAppliedCoupon(null); toast.success('Coupon removed'); }} className="px-4 py-2 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Remove</button>
                    ) : (
                      <button 
                        onClick={() => handleApplyCoupon(coupon)} 
                        className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${(isApplicable && cartItems.length > 0) ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer shadow-sm' : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-dark-700 cursor-not-allowed'}`}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                );
              })}
              {coupons.length === 0 && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center py-4">No coupons available right now.</p>}
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-extrabold text-gray-900 dark:text-white mb-5 text-lg">🧾 Bill Details</h3>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Item Total</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>GST ({settings.gstPercent}%)</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{gst.toFixed(2)}</span>
                </div>
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>Delivery Fee</span>
                      {deliveryFee > 0 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                          Free above ₹{freeDeliveryLimit} (Unlock by adding ₹{(freeDeliveryLimit - eligibleTotal).toFixed(2)} more)
                        </span>
                      )}
                    </div>
                    <span className={`font-extrabold ${deliveryFee === 0 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded' : 'text-gray-900 dark:text-white'}`}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Platform Fee</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/20 dark:border-white/5 pt-4 flex justify-between font-extrabold text-gray-900 dark:text-white">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-bold bg-green-50/50 dark:bg-green-900/20 p-2 rounded-lg">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-4 flex justify-between font-extrabold text-2xl text-primary-600 dark:text-primary-400">
                  <span>To Pay</span>
                  <span>₹{toPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                  {eligibleTotal >= freeDeliveryLimit ? (
                    <p className="text-xs font-extrabold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 rounded-xl border border-green-100 dark:border-green-900/50 tracking-wider">FREE DELIVERY APPLIED</p>
                  ) : (
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 py-2 rounded-xl border border-orange-100 dark:border-orange-900/50">Add ₹{(freeDeliveryLimit - eligibleTotal).toFixed(2)} more to get FREE delivery</p>
                  )}
              </div>

              {settings?.isMaintenance ? (
                  <div className="w-full mt-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl flex items-center justify-center text-center px-4 border border-red-200 dark:border-red-800/50">
                    ⚠️ {settings.maintenanceReason || 'Canteen is currently unavailable'}
                  </div>
                ) : (
                  <button onClick={triggerCheckout} className="w-full mt-6 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center text-lg">
                    Place Order (₹{toPay.toFixed(2)})
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 border-b border-white/20 dark:border-white/5 flex items-center text-primary-600 dark:text-primary-400 bg-white/40 dark:bg-dark-800/40">
              <Package className="w-7 h-7 mr-3 drop-shadow-sm" />
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Confirm Order</h3>
            </div>
            <div className="p-8">
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg font-medium">Are you sure you want to place this order via Smart Canteen?</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-3 px-4 glass-panel text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-white/50 dark:hover:bg-dark-800/50 transition-colors border border-white/20"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeCheckout}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-extrabold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cart;
