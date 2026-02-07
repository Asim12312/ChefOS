import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Box, AlertTriangle, CheckCircle, XCircle, Upload, Clock, Flame, Utensils, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const MenuManagement = () => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [editingItem, setEditingItem] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const queryClient = useQueryClient();
    const restaurantId = user?.restaurant?._id || user?.restaurant;

    // Fetch Menu Items
    const { data: menuItems, isLoading } = useQuery({
        queryKey: ['menuItems', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/menu?restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/menu', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            setIsModalOpen(false);
            if (editingItem) setEditingItem(null);
            toast.success('Menu item saved successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save item')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/menu/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success('Menu item updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update item')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/menu/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            toast.success('Menu item deleted');
        }
    });

    const toggleAvailabilityMutation = useMutation({
        mutationFn: (id) => api.patch(`/menu/${id}/availability`),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            toast.success('Availability updated');
        }
    });

    // Form Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            restaurant: restaurantId,
            name: formData.get('name'),
            description: formData.get('description'),
            price: Number(formData.get('price')),
            category: formData.get('category'),
            stockQuantity: Number(formData.get('stockQuantity')),
            lowStockThreshold: Number(formData.get('lowStockThreshold')),
            image: formData.get('image'),
            video: formData.get('video'),
            model3D: {
                glb: formData.get('glbModel'),
                usdz: formData.get('usdzModel')
            },
            dietaryInfo: {
                isVegetarian: formData.get('isVegetarian') === 'on',
                isVegan: formData.get('isVegan') === 'on',
                isGlutenFree: formData.get('isGlutenFree') === 'on',
                spiceLevel: formData.get('spiceLevel')
            },
            // New Features
            prepTime: Number(formData.get('prepTime')) || 0,
            nutritionalInfo: {
                calories: Number(formData.get('calories')) || 0,
                protein: Number(formData.get('protein')) || 0,
                carbs: Number(formData.get('carbs')) || 0,
                fats: Number(formData.get('fats')) || 0
            },
            ingredients: formData.get('ingredients').split(',').map(i => i.trim()).filter(i => i)
        };

        if (editingItem) {
            updateMutation.mutate({ id: editingItem._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        setUploading(true);
        const toastId = toast.loading('Uploading file...');

        try {
            const res = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const input = document.querySelector(`input[name="${fieldName}"]`);
                if (input) {
                    input.value = res.data.data.url;
                }
                toast.success('Upload complete', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    // Filtering
    const categories = ['All', 'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Side Dish', 'Special'];

    const filteredItems = menuItems?.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Menu Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage items, stock, pricing, and details
                            </p>
                        </motion.div>
                        <button
                            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add New Item
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card border border-border/50 p-4 rounded-xl shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                className="input pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all font-medium ${selectedCategory === cat
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-96 rounded-2xl bg-muted/20 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            <AnimatePresence>
                                {filteredItems?.map((item) => (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-card border border-border/50 hover:border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                                    >
                                        <div className="relative h-48 bg-muted overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    <Box size={40} />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                                                {item.isLowStock && (
                                                    <span className="badge bg-yellow-500/90 text-white border-none shadow-sm flex items-center gap-1">
                                                        <AlertTriangle size={12} /> Low Stock
                                                    </span>
                                                )}
                                                <div className="flex gap-1">
                                                    {item.model3D?.glb && (
                                                        <span className="badge bg-purple-500/90 text-white border-none shadow-sm text-xs">3D</span>
                                                    )}
                                                    {item.video && (
                                                        <span className="badge bg-blue-500/90 text-white border-none shadow-sm text-xs">VIDEO</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                <div className="flex justify-between items-end">
                                                    <h3 className="font-bold text-lg text-white truncate shadow-black drop-shadow-md">{item.name}</h3>
                                                    <span className="text-primary-foreground bg-primary px-2 py-0.5 rounded-md font-bold text-sm shadow-sm">${item.price}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col gap-3">
                                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">{item.description}</p>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-md">
                                                    <Clock size={14} className="text-blue-500" />
                                                    <span>{item.prepTime || 15}m prep</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-md">
                                                    <Flame size={14} className="text-orange-500" />
                                                    <span>{item.nutritionalInfo?.calories || 0} kcal</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg text-sm mt-auto">
                                                <span className="text-muted-foreground">Stock:</span>
                                                <span className={`font-mono font-bold ${item.stockQuantity === 0 ? 'text-red-500' :
                                                    item.isLowStock ? 'text-yellow-500' : 'text-green-500'
                                                    }`}>
                                                    {item.stockQuantity}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 border-t border-border flex justify-between items-center bg-muted/10">
                                            <button
                                                onClick={() => toggleAvailabilityMutation.mutate(item._id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.isAvailable
                                                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                                    : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                                    }`}
                                            >
                                                {item.isAvailable ? <><CheckCircle size={14} /> Available</> : <><XCircle size={14} /> Unavailable</>}
                                            </button>

                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredItems?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-muted p-6 rounded-full mb-4">
                                <Utensils size={48} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No menu items found</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                {searchTerm ? `No items match "${searchTerm}"` : 'Get started by adding your first menu item.'}
                            </p>
                            <button
                                onClick={() => { setEditingItem(null); setSearchTerm(''); setIsModalOpen(true); }}
                                className="btn-primary"
                            >
                                <Plus size={18} className="mr-2" /> Add Item
                            </button>
                        </div>
                    )}

                    {/* Form Modal */}
                    <AnimatePresence>
                        {isModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                                >
                                    <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                                            <p className="text-sm text-muted-foreground">Fill in the details for your menu item</p>
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                                            <XCircle size={24} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                        {/* Basic Info Section */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">Basic Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="form-group md:col-span-2">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Item Name</label>
                                                    <input name="name" defaultValue={editingItem?.name} required className="input w-full" placeholder="e.g. Truffle Burger" />
                                                </div>

                                                <div className="form-group md:col-span-2">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Description</label>
                                                    <textarea name="description" defaultValue={editingItem?.description} className="input w-full h-24 resize-none" placeholder="Describe the dish..." />
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Price ($)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                        <input type="number" name="price" defaultValue={editingItem?.price} required min="0" step="0.01" className="input w-full pl-7" placeholder="0.00" />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Category</label>
                                                    <select name="category" defaultValue={editingItem?.category || 'Main Course'} className="input w-full">
                                                        {categories.filter(c => c !== 'All').map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Media Section */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">Media & Presentation</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Image URL</label>
                                                    <div className="flex gap-2">
                                                        <input name="image" defaultValue={editingItem?.image} placeholder="https://..." className="input w-full" />
                                                        <label className="btn btn-outline px-3 cursor-pointer" title="Upload Image">
                                                            <Upload size={18} />
                                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Video URL</label>
                                                    <div className="flex gap-2">
                                                        <input name="video" defaultValue={editingItem?.video} placeholder="https://..." className="input w-full" />
                                                        <label className="btn btn-outline px-3 cursor-pointer" title="Upload Video">
                                                            <Upload size={18} />
                                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} accept="video/*" />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-purple-500">3D Model (GLB)</label>
                                                    <input name="glbModel" defaultValue={editingItem?.model3D?.glb} placeholder="model.glb" className="input w-full border-purple-500/20 focus:border-purple-500" />
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-purple-500">3D Model (USDZ)</label>
                                                    <input name="usdzModel" defaultValue={editingItem?.model3D?.usdz} placeholder="model.usdz" className="input w-full border-purple-500/20 focus:border-purple-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inventory & Prep */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">Operations</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-blue-500">Stock Quantity</label>
                                                    <input type="number" name="stockQuantity" defaultValue={editingItem?.stockQuantity ?? 100} required min="0" className="input w-full border-blue-500/20 focus:border-blue-500" />
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-blue-500">Low Stock Alert</label>
                                                    <input type="number" name="lowStockThreshold" defaultValue={editingItem?.lowStockThreshold ?? 10} required min="0" className="input w-full border-blue-500/20 focus:border-blue-500" />
                                                </div>

                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Prep Time (mins)</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                                        <input type="number" name="prepTime" defaultValue={editingItem?.prepTime ?? 15} required min="0" className="input w-full pl-9" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details & Nutrition */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">Details & Nutrition</h4>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium mb-1.5 text-foreground">Ingredients (comma separated)</label>
                                                <input name="ingredients" defaultValue={editingItem?.ingredients?.join(', ')} placeholder="Flour, Sugar, Eggs, Milk..." className="input w-full" />
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="form-group">
                                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Calories (kcal)</label>
                                                    <input type="number" name="calories" defaultValue={editingItem?.nutritionalInfo?.calories ?? 0} min="0" className="input w-full" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Protein (g)</label>
                                                    <input type="number" name="protein" defaultValue={editingItem?.nutritionalInfo?.protein ?? 0} min="0" className="input w-full" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Carbs (g)</label>
                                                    <input type="number" name="carbs" defaultValue={editingItem?.nutritionalInfo?.carbs ?? 0} min="0" className="input w-full" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Fats (g)</label>
                                                    <input type="number" name="fats" defaultValue={editingItem?.nutritionalInfo?.fats ?? 0} min="0" className="input w-full" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-3 text-foreground">Dietary Labels</label>
                                                    <div className="flex flex-wrap gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                            <input type="checkbox" name="isVegetarian" defaultChecked={editingItem?.dietaryInfo?.isVegetarian} className="checkbox checkbox-primary w-5 h-5" />
                                                            <span className="text-sm">Vegetarian</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                            <input type="checkbox" name="isVegan" defaultChecked={editingItem?.dietaryInfo?.isVegan} className="checkbox checkbox-primary w-5 h-5" />
                                                            <span className="text-sm">Vegan</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                            <input type="checkbox" name="isGlutenFree" defaultChecked={editingItem?.dietaryInfo?.isGlutenFree} className="checkbox checkbox-primary w-5 h-5" />
                                                            <span className="text-sm">Gluten Free</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5 text-foreground">Spice Level</label>
                                                    <div className="flex items-center gap-2">
                                                        <Flame className={`text-orange-500`} size={20} />
                                                        <select name="spiceLevel" defaultValue={editingItem?.dietaryInfo?.spiceLevel || 'None'} className="input w-full">
                                                            <option value="None">No Spice</option>
                                                            <option value="Mild">Mild</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hot">Hot</option>
                                                            <option value="Extra Hot">Extra Hot 🔥</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline">Cancel</button>
                                            <button type="submit" className="btn-primary min-w-[120px]">Save Item</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default MenuManagement;
