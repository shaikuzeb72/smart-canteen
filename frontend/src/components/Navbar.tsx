import { Search, User, ShoppingCart, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/client';

const SUGGESTIONS = ["Pizza", "Cold Coffee", "Sandwich", "Pasta", "Burger", "Fries", "Maggie", "Coke"];

const Navbar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cartCount, setCartCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHoveringSuggestions, setIsHoveringSuggestions] = useState(false);
  
  const searchQuery = searchParams.get('search') || '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCartCount();
    fetchAddresses();
    fetchSuggestions();
    
    const interval = setInterval(() => {
      fetchCartCount();
      fetchSuggestions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await apiClient.get('/products');
      const available = response.data
        .filter((p: any) => p.stock > 0)
        .map((p: any) => p.name);
      setSuggestions(available);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await apiClient.get('/cart');
      const count = response.data.reduce((acc: number, item: any) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      // ignore
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/auth/me/addresses');
      setAddresses(response.data);
      
      const saved = localStorage.getItem('smart_canteen_selected_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify it still exists
        if (response.data.find((a: any) => a.id === parsed.id)) {
          setSelectedAddress(parsed);
        } else if (response.data.length > 0) {
          setSelectedAddress(response.data[0]);
          localStorage.setItem('smart_canteen_selected_location', JSON.stringify(response.data[0]));
        }
      } else if (response.data.length > 0) {
        setSelectedAddress(response.data[0]);
        localStorage.setItem('smart_canteen_selected_location', JSON.stringify(response.data[0]));
      }
    } catch (error) {
      // ignore
    }
  };

  const handleSelectLocation = (addr: any) => {
    setSelectedAddress(addr);
    localStorage.setItem('smart_canteen_selected_location', JSON.stringify(addr));
    setShowLocationDropdown(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      searchParams.set('search', val);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleSuggestionClick = (suggestion: string) => {
    searchParams.set('search', suggestion);
    setSearchParams(searchParams);
    setIsFocused(false);
  };

  return (
    <header className="h-16 glass-navbar flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      
      {/* Mobile Title */}
      <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap md:hidden mr-2 truncate pr-2 pb-1">
        Smart Canteen
      </h1>

      {/* Location Selector */}
      <div className="hidden md:flex relative mr-4" ref={dropdownRef}>
        <button 
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="flex flex-col items-start hover:bg-gray-100 dark:hover:bg-dark-800 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center text-xs font-bold text-primary-600 dark:text-primary-400">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Deliver to <ChevronDown className="w-3 h-3 ml-0.5" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
            {selectedAddress ? `${selectedAddress.building}, ${selectedAddress.room}` : 'Select Location'}
          </span>
        </button>

        <AnimatePresence>
          {showLocationDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 top-full left-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden py-2"
            >
              <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">
                Saved Addresses
              </div>
              {addresses.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No saved addresses yet.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {addresses.map(addr => (
                    <button 
                      key={addr.id}
                      onClick={() => handleSelectLocation(addr)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center ${selectedAddress?.id === addr.id ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <MapPin className="w-4 h-4 mr-2 opacity-70" />
                      <div>
                        <p className="font-medium">{addr.building}, {addr.room}</p>
                        {addr.instructions && <p className="text-xs opacity-70 truncate">{addr.instructions}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl flex flex-col relative group">
        <div className="relative w-full z-20">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search for delicious food..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-dark-700 rounded-xl leading-5 bg-gray-50/80 dark:bg-dark-800/80 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-inner text-gray-900 dark:text-gray-100"
          />
        </div>
        
        {/* Animated Suggestion Marquee */}
        {isFocused && !searchQuery && suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl p-3 overflow-hidden whitespace-nowrap z-10 shadow-xl"
            onMouseEnter={() => setIsHoveringSuggestions(true)}
            onMouseLeave={() => setIsHoveringSuggestions(false)}
          >
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Popular Searches</p>
            <div className="relative w-full overflow-hidden flex items-center">
              <motion.div 
                className="flex space-x-3 w-max"
                animate={{ x: isHoveringSuggestions ? 0 : [0, -1000] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              >
                {/* Duplicate the array to create a seamless infinite scroll effect */}
                {[...suggestions, ...suggestions, ...suggestions].map((suggestion, idx) => (
                  <button
                    key={`${suggestion}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before click registers
                      handleSuggestionClick(suggestion);
                    }}
                    className="px-4 py-2 bg-white/60 dark:bg-dark-700/60 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all whitespace-nowrap flex-shrink-0 shadow-sm border border-gray-200/50 dark:border-white/5 hover:scale-105"
                  >
                    <Search className="w-3.5 h-3.5 inline mr-1.5 opacity-60 text-primary-500" />
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Icons */}
      <div className="ml-4 flex items-center space-x-2 md:space-x-4">
        <button onClick={() => navigate('/cart')} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
          <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 shadow-md shadow-red-500/40 rounded-full border-2 border-white dark:border-dark-900"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
        <button onClick={() => navigate('/profile')} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors shadow-inner">
          <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
