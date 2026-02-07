import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertTriangle, CheckCircle, Search, RefreshCw, XCircle, Plus, Filter, TrendingDown, TrendingUp, Package, DollarSign, Truck, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const InventoryManagement = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const restaurantId = user?.restaurant?._id || user?.restaurant;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');

    // Modal States
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [stockAdjustment, setStockAdjustment] = useState({ type: 'restock', quantity: 0, reason: '' });

    // Constants
    const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Dry Goods', 'Beverages', 'Spices', 'Packaging', 'Other'];

    // Fetch Inventory
    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/inventory/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Update Stock Mutation
    const updateStockMutation = useMutation({
        mutationFn: ({ id, quantity, reason }) => api.patch(`/inventory/${id}`, { quantity, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory']);
            toast.success('Stock updated successfully');
            setShowStockModal(false);
            setStockAdjustment({ type: 'restock', quantity: 0, reason: '' });
        },
        onError: (err) => toast.error('Failed to update stock')
    });

    const handleStockSubmit = (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        let newQuantity = selectedItem.stockQuantity;
        const adjustmentQty = parseInt(stockAdjustment.quantity);

        if (stockAdjustment.type === 'restock') {
            newQuantity += adjustmentQty;
        } else {
            newQuantity -= adjustmentQty;
        }

        if (newQuantity < 0) {
            toast.error('Cannot reduce stock below zero');
            return;
        }

        updateStockMutation.mutate({
            id: selectedItem._id,
            quantity: newQuantity,
            reason: stockAdjustment.reason
        });
    };

    const openStockModal = (item, type = 'restock') => {
        setSelectedItem(item);
        setStockAdjustment({ type, quantity: 0, reason: '' });
        setShowStockModal(true);
    };

    // Filter items
    const filteredItems = inventory?.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Stats
    const stats = {
        totalItems: inventory?.length || 0,
        lowStock: inventory?.filter(i => i.isLowStock).length || 0,
        totalValue: inventory?.reduce((acc, item) => acc + (item.stockQuantity * (item.costPrice || 0)), 0) || 0,
        outOfStock: inventory?.filter(i => i.stockQuantity === 0).length || 0
    };

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
                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Inventory Management
                            </h1>
                            <p className="text-muted-foreground">
                                Track stock, manage suppliers, and monitor waste
                            </p>
                        </motion.div>
                        <button
                            onClick={() => setShowAddItemModal(true)}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add Item
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Low Stock Alerts', value: stats.lowStock, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                            { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                            { label: 'Est. Value', value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, SKU..."
                                className="input w-full pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-lg text-sm font-medium text-foreground whitespace-nowrap">
                                <Filter size={16} />
                                Filter:
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="input text-sm py-2 px-3 min-w-[140px]"
                            >
                                <option value="All">All Categories</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10 border-b border-border">
                                        <th className="p-4 font-semibold text-sm text-muted-foreground">Item Details</th>
                                        <th className="p-4 font-semibold text-sm text-muted-foreground">Category</th>
                                        <th className="p-4 font-semibold text-sm text-muted-foreground">Stock Status</th>
                                        <th className="p-4 font-semibold text-sm text-muted-foreground">Supplier</th>
                                        <th className="p-4 font-semibold text-sm text-muted-foreground">Value</th>
                                        <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center">
                                                <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                                            </td>
                                        </tr>
                                    ) : filteredItems?.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-muted-foreground">
                                                No items found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        <AnimatePresence>
                                            {filteredItems?.map((item) => (
                                                <motion.tr
                                                    key={item._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className={`border-b border-border/50 hover:bg-muted/5 transition-colors group ${item.stockQuantity === 0 ? 'bg-red-500/5' : ''}`}
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                                {item.image ? (
                                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package size={20} className="text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">SKU: {item.sku || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded-md bg-muted/20 text-xs font-medium text-foreground">
                                                            {item.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-bold ${item.stockQuantity === 0 ? 'text-red-500' :
                                                                    item.isLowStock ? 'text-yellow-500' : 'text-green-500'
                                                                    }`}>
                                                                    {item.stockQuantity} {item.unit || 'units'}
                                                                </span>
                                                                {item.isLowStock && (
                                                                    <AlertTriangle size={14} className="text-yellow-500" />
                                                                )}
                                                            </div>
                                                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${item.stockQuantity === 0 ? 'bg-red-500' :
                                                                        item.isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min((item.stockQuantity / (item.maxStock || 100)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-foreground">
                                                        {item.supplier ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Truck size={14} className="text-muted-foreground" />
                                                                {item.supplier}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic">No Supplier</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-foreground">
                                                        ${(item.costPrice || 0).toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openStockModal(item, 'restock')}
                                                                className="p-1.5 hover:bg-green-500/10 rounded-md text-muted-foreground hover:text-green-500 transition-colors"
                                                                title="Restock"
                                                            >
                                                                <TrendingUp size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openStockModal(item, 'waste')}
                                                                className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                                                                title="Record Waste"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button
                                                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                                title="Edit Details"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Stock Adjustment Modal */}
            <AnimatePresence>
                {showStockModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6"
                        >
                            <h3 className="text-lg font-bold mb-1 text-foreground">
                                {stockAdjustment.type === 'restock' ? 'Restock Item' : 'Record Waste'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                {selectedItem.name} (Current: {selectedItem.stockQuantity})
                            </p>

                            <form onSubmit={handleStockSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stockAdjustment.quantity}
                                        onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                                        className="input w-full"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {stockAdjustment.type === 'waste' && (
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block text-foreground">Reason</label>
                                        <select
                                            value={stockAdjustment.reason}
                                            onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                                            className="input w-full"
                                            required
                                        >
                                            <option value="">Select Reason</option>
                                            <option value="Spoilage">Spoilage</option>
                                            <option value="Damage">Damage</option>
                                            <option value="Theft">Theft</option>
                                            <option value="Mistake">Kitchen Mistake</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setShowStockModal(false)}
                                        className="btn-outline flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 btn ${stockAdjustment.type === 'restock' ? 'btn-primary' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                    >
                                        {stockAdjustment.type === 'restock' ? 'Add Stock' : 'Confirm Waste'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Item Modal Placeholder (Simpler version for shortness) */}
            {/* You can implement full add form here if needed */}
        </div>
    );
};

export default InventoryManagement;
