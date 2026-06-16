import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import BackButton from '../components/BackButton';

interface Product {
  id: string;
  name: string;
  price: number;
  weight: string;
  description: string;
  stock: number;
  imageUrl: string;
  category: string;
}

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (id: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden group relative hover:shadow-2xl transition-all flex flex-col h-full"
    >
      <div className="relative h-40 bg-gray-50/50 dark:bg-dark-900/50 overflow-hidden flex items-center justify-center p-4">
        <motion.img 
          src={product.imageUrl || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=200&h=200'} 
          alt={product.name} 
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md"
        />
        {product.stock > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 dark:bg-dark-800/90 backdrop-blur text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors z-40 border border-white/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between z-10 bg-white/40 dark:bg-dark-800/40">
        <div>
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{product.weight || '1 portion'}</div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight line-clamp-2">{product.name}</h3>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-extrabold text-lg text-gray-900 dark:text-white">₹{product.price}</span>
        </div>
      </div>
      
      <div className="absolute inset-x-0 bottom-0 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30 flex flex-col justify-end border-t border-white/20 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium line-clamp-3">{product.description || `Delicious ${product.name} prepared fresh daily.`}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Weight: {product.weight}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${product.stock > 10 ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}
          disabled={product.stock === 0}
          className={`w-full font-bold py-3 rounded-xl text-sm transition-all shadow-lg ${product.stock === 0 ? 'bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-primary-500/40 hover:scale-[1.02]'}`}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  );
};

const StudentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const sortOption = searchParams.get('sort') || 'name';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, settingsRes] = await Promise.all([
          apiClient.get('/products'),
          apiClient.get('/settings')
        ]);
        setProducts(prodRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = async (productId: string) => {
    // Optimistic UI update
    toast.success('Added to cart!');
    window.dispatchEvent(new Event('cartUpdated'));
    try {
      await apiClient.post('/cart', { productId, quantity: 1 });
      window.dispatchEvent(new Event('cartUpdatedDb'));
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  let filteredProducts = products.filter(p => {
    let matchesCategory = true;
    if (categoryFilter === 'snacks') matchesCategory = p.category === 'Snacks & Drinks';
    else if (categoryFilter === 'sweets') matchesCategory = p.category === 'Sweets & Chocolates';
    else if (categoryFilter === 'food') matchesCategory = p.category === 'Food & Cafe';
    else if (categoryFilter === 'stationary') matchesCategory = p.category === 'Stationary';

    const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.description && p.description.toLowerCase().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price_low') return a.price - b.price;
    if (sortOption === 'price_high') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-32 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary-500 mb-6" />
        </motion.div>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg animate-pulse">Loading Smart Canteen inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative z-10">
      <BackButton className="mb-4" />
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6 glass-panel p-6 rounded-3xl">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {searchQuery ? `Search results for "${searchQuery}"` : (categoryFilter ? (categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)) : 'All Products')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Get your favorite items delivered instantly via Smart Canteen.</p>
        </div>
        
        <div>
          <select 
            className="px-5 py-3 border border-gray-200/50 dark:border-white/10 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer transition-all"
            value={sortOption}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('sort', e.target.value);
              setSearchParams(newParams);
            }}
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>
      
      {settings?.isMaintenance && (
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-100 dark:bg-red-800/30 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-xl font-extrabold text-red-700 dark:text-red-400 flex items-center mb-2">
            <span className="mr-2 text-2xl">⚠️</span> Canteen is Unavailable
          </h3>
          <p className="text-red-600 dark:text-red-300 font-medium">{settings.maintenanceReason || 'Under Maintenance'}</p>
          {settings.maintenanceInfo && (
            <p className="text-sm mt-2 text-red-500 dark:text-red-400 font-bold bg-white/50 dark:bg-red-950/50 p-3 rounded-xl border border-red-100 dark:border-red-800/30 italic">
              "{settings.maintenanceInfo}"
            </p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))}
        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full text-center py-24 glass-card rounded-3xl flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-gray-100/50 dark:bg-dark-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <span className="text-3xl">🍔</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Try adjusting your search or category filter in Smart Canteen.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
