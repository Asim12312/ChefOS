import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Play, Box, Plus, X, ChevronRight, Star, Info } from 'lucide-react';
import api from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Menu = () => {
    const { restaurant } = useOutletContext();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null); // For Modal

    // Fetch Menu Items
    const { data: menuItems, isLoading } = useQuery({
        queryKey: ['menu', restaurant._id],
        queryFn: async () => {
            const res = await api.get(`/menu?restaurant=${restaurant._id}`);
            return res.data.data;
        },
        enabled: !!restaurant?._id
    });

    // Extract unique categories
    const categories = useMemo(() => {
        if (!menuItems) return ["All"];
        const cats = new Set(menuItems.map(item => item.category));
        return ["All", ...Array.from(cats)];
    }, [menuItems]);

    // Filter items
    const filteredItems = useMemo(() => {
        if (!menuItems) return [];
        return menuItems.filter(item => {
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [menuItems, selectedCategory, searchTerm]);

    if (isLoading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    );

    return (
        <div className="pb-24">
            {/* Hero Section */}
            <div className="relative h-48 -mx-4 -mt-20 mb-6 bg-gray-900">
                {restaurant.coverImage ? (
                    <img src={restaurant.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="flex items-end gap-3">
                        <div className="w-16 h-16 rounded-xl bg-gray-800 border-2 border-black overflow-hidden flex-shrink-0 shadow-lg">
                            {restaurant.logo ? (
                                <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                                    {restaurant.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="pb-1">
                            <h1 className="text-2xl font-bold leading-tight">{restaurant.name}</h1>
                            <p className="text-sm text-gray-400 line-clamp-1">{restaurant.description || "Welcome to our digital menu"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Search & Categories */}
            <div className="sticky top-16 bg-black/95 backdrop-blur-md z-30 py-2 -mx-4 px-4 space-y-3 shadow-lg shadow-black/20">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search for food..."
                        className="w-full bg-white/10 border-none rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${selectedCategory === cat
                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="mt-6 space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>No items found matching your search.</p>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <MenuItemCard
                            key={item._id}
                            item={item}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))
                )}
            </div>

            {/* Item Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <ItemDetailModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-Components ---

const MenuItemCard = ({ item, onClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
    >
        {/* Image */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden relative">
            {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Box size={24} />
                </div>
            )}
            {/* Badges */}
            {(item.video || item.model3D?.glb) && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                    {item.video && <div className="bg-black/60 p-1 rounded-full backdrop-blur-sm"><Play size={10} className="fill-white" /></div>}
                    {item.model3D?.glb && <div className="bg-primary/90 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">3D</div>}
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between py-1">
            <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-base leading-tight text-white mb-1">{item.name}</h3>
                    <span className="font-bold text-primary font-mono">${item.price}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                    {item.isVegetarian && <span className="w-2 h-2 rounded-full bg-green-500" title="Vegetarian"></span>}
                    {item.isSpicy && <span className="w-2 h-2 rounded-full bg-red-500" title="Spicy"></span>}
                </div>
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-primary hover:bg-white/20 transition-colors">
                    <Plus size={16} />
                </button>
            </div>
        </div>
    </motion.div>
);

const ItemDetailModal = ({ item, onClose }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState("");

    const handleAddToCart = () => {
        addToCart(item, quantity, instructions);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Image Header */}
                <div className="relative h-64 w-full flex-shrink-0">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Box size={48} className="text-gray-600" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                </div>

                {/* Body */}
                <div className="px-6 pb-6 pt-2 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-white">{item.name}</h2>
                        <span className="text-xl font-bold text-primary">${item.price}</span>
                    </div>

                    <p className="text-gray-300 leading-relaxed mb-6">{item.description}</p>

                    {/* Meta info */}
                    <div className="flex gap-3 mb-6">
                        {item.prepTime && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {item.prepTime} mins
                            </div>
                        )}
                        {item.calories && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                {item.calories} cal
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-gray-400 block mb-3">Quantity</label>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            <div className="text-sm text-gray-400">
                                Total: <span className="text-white font-bold ml-1">${(item.price * quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-8">
                        <label className="text-sm font-medium text-gray-400 block mb-2">Special Instructions</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Allergies, extra sauce, etc..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-white/5 bg-[#1a1a1a]">
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <span>Add to Order</span>
                        <span className="w-1 h-1 rounded-full bg-black/40"></span>
                        <span>${(item.price * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Menu;
