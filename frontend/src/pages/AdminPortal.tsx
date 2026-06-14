import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Users, BarChart, X, Ticket, User, LogOut, Edit, Settings as SettingsIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import ThemeToggle from '../components/ThemeToggle';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  description: string;
  weight: string;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  minOrderValue: number;
}

const PREDEFINED_CATEGORIES = ['Snacks & Drinks', 'Food & Cafe', 'Stationary'];

interface Settings {
  deliveryFee: number;
  platformFee: number;
  gstPercent: number;
  isMaintenance?: boolean;
  maintenanceReason?: string | null;
  maintenanceInfo?: string | null;
}

const AdminPortal = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<Settings>({ deliveryFee: 0, platformFee: 0, gstPercent: 0 });
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingSettingKey, setEditingSettingKey] = useState<'deliveryFee' | 'platformFee' | 'gstPercent' | null>(null);
  const [singleSettingValue, setSingleSettingValue] = useState<string>('');
  
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ reason: '', info: '' });
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '', imageUrl: '', description: '', weight: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountAmount: '', minOrderValue: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const prodRes = await apiClient.get('/products');
        setProducts(prodRes.data);
      } else if (activeTab === 'users') {
        const userRes = await apiClient.get('/auth/users');
        setUsers(userRes.data || []);
      } else if (activeTab === 'coupons') {
        const couponRes = await apiClient.get('/coupons');
        setCoupons(couponRes.data);
      } else if (activeTab === 'settings') {
        const settingsRes = await apiClient.get('/settings');
        setSettings(settingsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiClient.delete(`/coupons/${id}`);
      toast.success('Coupon deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/auth/users/${id}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setNewProduct({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      category: p.category,
      imageUrl: p.imageUrl || '',
      description: p.description || '',
      weight: p.weight || ''
    });
    setEditingProductId(p.id);
    setIsProductModalOpen(true);
  };

  const handleOpenEditCoupon = (c: Coupon) => {
    setNewCoupon({
      code: c.code,
      discountAmount: c.discountAmount.toString(),
      minOrderValue: c.minOrderValue.toString()
    });
    setEditingCouponId(c.id);
    setIsCouponModalOpen(true);
  };

  const handleOpenEditSingleSetting = (key: 'deliveryFee' | 'platformFee' | 'gstPercent') => {
    setEditingSettingKey(key);
    setSingleSettingValue(settings[key].toString());
    setIsSettingsModalOpen(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.category) {
      toast.error('Please select a category');
      return;
    }
    
    const payload = { ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) };
    
    try {
      if (editingProductId) {
        await apiClient.put(`/products/${editingProductId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await apiClient.post('/products', payload);
        toast.success('Product added successfully');
      }
      setIsProductModalOpen(false);
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', stock: '', category: '', imageUrl: '', description: '', weight: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: newCoupon.code,
        discountAmount: parseFloat(newCoupon.discountAmount), 
        minOrderValue: parseFloat(newCoupon.minOrderValue) 
      };

      if (editingCouponId) {
        await apiClient.put(`/coupons/${editingCouponId}`, payload);
        toast.success('Coupon Updated Successfully');
      } else {
        await apiClient.post('/coupons', payload);
        toast.success('Coupon Saved Successfully');
      }
      setIsCouponModalOpen(false);
      setEditingCouponId(null);
      setNewCoupon({ code: '', discountAmount: '', minOrderValue: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleSaveSingleSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSettingKey) return;
    try {
      const updatedSettings = { ...settings, [editingSettingKey]: parseFloat(singleSettingValue) };
      await apiClient.put('/settings', updatedSettings);
      setSettings(updatedSettings);
      setIsSettingsModalOpen(false);
      setEditingSettingKey(null);
      toast.success('Setting updated successfully');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleToggleMaintenance = async (checked: boolean) => {
    if (checked) {
      setMaintenanceForm({ reason: settings.maintenanceReason || '', info: settings.maintenanceInfo || '' });
      setIsMaintenanceModalOpen(true);
      return;
    }
    
    try {
      const updatedSettings = { ...settings, isMaintenance: false, maintenanceReason: null, maintenanceInfo: null };
      await apiClient.put('/settings', updatedSettings);
      setSettings(updatedSettings);
      toast.success('Maintenance Mode Disabled');
    } catch (error) {
      toast.error('Failed to update maintenance mode');
    }
  };

  const handleConfirmMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.reason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      const updatedSettings = { ...settings, isMaintenance: true, maintenanceReason: maintenanceForm.reason, maintenanceInfo: maintenanceForm.info };
      await apiClient.put('/settings', updatedSettings);
      setSettings(updatedSettings);
      setIsMaintenanceModalOpen(false);
      toast.success('Maintenance Mode Enabled');
    } catch (error) {
      toast.error('Failed to enable maintenance');
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

  const handleLogout = () => {
    logout();
    navigate('/login?role=admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex transition-colors duration-500">
      <div className="w-64 glass-panel border-r border-white/20 dark:border-white/5 p-4 flex flex-col z-20">
        <h2 className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 whitespace-nowrap mb-8 pl-4 pr-2 pb-1 tracking-tight">Admin</h2>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'}`}>
            <Package className="w-5 h-5" />
            <span>Products</span>
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'coupons' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'}`}>
            <Ticket className="w-5 h-5" />
            <span>Coupons</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'}`}>
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'}`}>
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8 flex flex-col h-screen overflow-y-auto relative z-10">
        <div className="flex justify-between items-center mb-8 glass-card p-4 rounded-3xl">
          <BackButton />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur px-4 py-2 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 mx-2 px-3 border-x border-gray-200 dark:border-white/10">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 hidden sm:block">Dark Mode</span>
                <ThemeToggle />
              </div>
              <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center px-4 py-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-sm">
                <Lock className="w-4 h-4 mr-2" /> Change Password
              </button>
              <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-white/50 dark:bg-dark-800/50 backdrop-blur rounded-xl text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Products</h1>
              <button onClick={() => { setEditingProductId(null); setNewProduct({ name: '', price: '', stock: '', category: '', imageUrl: '', description: '', weight: '' }); setIsProductModalOpen(true); }} className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg hover:shadow-primary-500/40 transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-1.5" /> Add Product
              </button>
            </div>
            {loading ? <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading products...</div> : (
              <div className="glass-card rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/50 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Product Name</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Category</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs">Price</th>
                      <th className="p-5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50 dark:divide-white/5">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                        <td className="p-5 font-bold text-gray-900 dark:text-white flex items-center space-x-4">
                          <img src={product.imageUrl || 'https://via.placeholder.com/40'} loading="lazy" decoding="async" className="w-10 h-10 object-cover rounded-lg" alt="" />
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            {product.stock < 5 && (
                              <span className="text-xs font-bold text-red-600 mt-0.5">Low Stock: {product.stock} left</span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 font-medium text-gray-600 dark:text-gray-400">{product.category}</td>
                        <td className="p-5 font-extrabold text-gray-900 dark:text-white text-lg">₹{product.price}</td>
                        <td className="p-5 text-right space-x-2">
                          <button onClick={() => handleOpenEditProduct(product)} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                          <button onClick={() => deleteProduct(product.id)} className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">No products available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Coupons</h1>
              <button onClick={() => { setEditingCouponId(null); setNewCoupon({ code: '', discountAmount: '', minOrderValue: '' }); setIsCouponModalOpen(true); }} className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg hover:shadow-primary-500/40 transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-1.5" /> Add Coupon
              </button>
            </div>
            {loading ? <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading coupons...</div> : (
              <ul className="glass-card rounded-3xl divide-y divide-gray-100/50 dark:divide-white/5">
                {coupons.map(coupon => (
                  <li key={coupon.id} className="p-5 flex justify-between items-center hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                    <div>
                      <span className="font-extrabold text-xl mr-3 text-green-600 dark:text-green-400 tracking-wide">{coupon.code}</span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">(Discount: ₹{coupon.discountAmount}, Min Order: ₹{coupon.minOrderValue})</span>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleOpenEditCoupon(coupon)} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => deleteCoupon(coupon.id)} className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </li>
                ))}
                {coupons.length === 0 && <div className="p-8 text-center text-gray-500">No coupons active.</div>}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Registered Students</h1>
            {loading ? <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading users...</div> : (
              <ul className="glass-card rounded-3xl divide-y divide-gray-100/50 dark:divide-white/5">
                {users.map(u => (
                  <li key={u.id} className="p-5 flex justify-between items-center hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-lg">{u.name}</div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{u.email}</div>
                    </div>
                    <div className="text-right flex items-center justify-end">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold mr-4 uppercase tracking-wider ${u.role === 'TEACHER' ? 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                        {u.role}
                      </span>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-4">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      <button onClick={() => deleteUser(u.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
                {users.length === 0 && <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium">No students registered yet.</div>}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Global Settings</h1>
            </div>
            {loading ? <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading settings...</div> : (
              <div className="max-w-3xl">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4">Fees & Taxes</h2>
                <ul className="glass-card rounded-3xl divide-y divide-gray-100/50 dark:divide-white/5 mb-10">
                  <li className="p-5 flex justify-between items-center hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Delivery Fee</span>
                      <span className="text-sm font-medium text-gray-500">Base delivery charge</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">₹{settings.deliveryFee}</span>
                      <button onClick={() => handleOpenEditSingleSetting('deliveryFee')} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                    </div>
                  </li>
                  <li className="p-5 flex justify-between items-center hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Platform Fee</span>
                      <span className="text-sm font-medium text-gray-500">App maintenance charge</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">₹{settings.platformFee}</span>
                      <button onClick={() => handleOpenEditSingleSetting('platformFee')} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                    </div>
                  </li>
                  <li className="p-5 flex justify-between items-center hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">GST (%)</span>
                      <span className="text-sm font-medium text-gray-500">Tax percentage</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">{settings.gstPercent}%</span>
                      <button onClick={() => handleOpenEditSingleSetting('gstPercent')} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                    </div>
                  </li>
                </ul>

                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4">Canteen Status</h2>
                <div className="glass-card rounded-3xl p-6 border border-white/20 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">Maintenance Mode / Unavailable</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Shut down operations. Users will see a banner and cannot place orders.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={!!settings.isMaintenance} onChange={e => handleToggleMaintenance(e.target.checked)} />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  
                  {settings.isMaintenance && (
                    <div className="space-y-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                        <span className="font-extrabold text-lg">{settings.maintenanceReason}</span>
                      </div>
                      {settings.maintenanceInfo && (
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                          {settings.maintenanceInfo}
                        </div>
                      )}
                      <button onClick={() => { setMaintenanceForm({ reason: settings.maintenanceReason || '', info: settings.maintenanceInfo || '' }); setIsMaintenanceModalOpen(true); }} className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center mt-2">
                        <Edit className="w-4 h-4 mr-1" /> Edit Maintenance Info
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{editingProductId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-7 h-7" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <input type="text" placeholder="Name" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-5">
                <input type="number" placeholder="Price" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <input type="number" placeholder="Stock" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <select required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white dark:bg-dark-800" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                <option value="" className="dark:bg-dark-900">Select Category</option>
                {PREDEFINED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="dark:bg-dark-900">{cat}</option>
                ))}
              </select>
              <input type="url" placeholder="Image URL" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
              <input type="text" placeholder="Weight (e.g., 200g, 1 plate)" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newProduct.weight} onChange={e => setNewProduct({...newProduct, weight: e.target.value})} />
              <textarea placeholder="Description" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">Save Product</button>
            </form>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{editingCouponId ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-7 h-7" /></button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-5">
              <input type="text" placeholder="Coupon Code (e.g., SAVE100)" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold dark:text-white" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
              <input type="number" placeholder="Discount Amount (₹)" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newCoupon.discountAmount} onChange={e => setNewCoupon({...newCoupon, discountAmount: e.target.value})} />
              <input type="number" placeholder="Min Order Amount (₹)" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={newCoupon.minOrderValue} onChange={e => setNewCoupon({...newCoupon, minOrderValue: e.target.value})} />
              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">{editingCouponId ? 'Update Coupon' : 'Save Coupon'}</button>
            </form>
          </div>
        </div>
      )}

      {isSettingsModalOpen && editingSettingKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Edit {editingSettingKey === 'deliveryFee' ? 'Delivery Fee' : editingSettingKey === 'platformFee' ? 'Platform Fee' : 'GST (%)'}
              </h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-7 h-7" /></button>
            </div>
            <form onSubmit={handleSaveSingleSetting} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  New Value {editingSettingKey === 'gstPercent' ? '(%)' : '(₹)'}
                </label>
                <input type="number" required className="w-full px-5 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium dark:text-white" value={singleSettingValue} onChange={e => setSingleSettingValue(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">Save</button>
            </form>
          </div>
        </div>
      )}

      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Enable Maintenance</h2>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-7 h-7" /></button>
            </div>
            <form onSubmit={handleConfirmMaintenance} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                <select 
                  required
                  className="w-full px-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 dark:text-white dark:bg-dark-800 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] appearance-none"
                  value={maintenanceForm.reason}
                  onChange={e => setMaintenanceForm({...maintenanceForm, reason: e.target.value})}
                >
                  <option value="" disabled className="dark:bg-dark-900">Select Reason</option>
                  <option value="🔧 System Update" className="dark:bg-dark-900">🔧 System Update</option>
                  <option value="👨‍🍳 Kitchen Closed" className="dark:bg-dark-900">👨‍🍳 Kitchen Closed</option>
                  <option value="📦 Inventory Check" className="dark:bg-dark-900">📦 Inventory Check</option>
                  <option value="🧑‍💻 Staff Unavailable" className="dark:bg-dark-900">🧑‍💻 Staff Unavailable</option>
                  <option value="🚧 Technical Issue" className="dark:bg-dark-900">🚧 Technical Issue</option>
                  <option value="📝 Other" className="dark:bg-dark-900">📝 Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Additional Information (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Back in 30 minutes"
                  className="w-full px-5 py-3 glass-panel rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 border border-gray-300 dark:border-white/10 shadow-sm transition-all focus:border-primary-400 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  value={maintenanceForm.info}
                  onChange={e => setMaintenanceForm({...maintenanceForm, info: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all hover:scale-[1.02]">
                {settings.isMaintenance ? 'Save Changes' : 'Enable Maintenance'}
              </button>
            </form>
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

export default AdminPortal;
