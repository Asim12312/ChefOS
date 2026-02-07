import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Table as TableIcon, Plus, QrCode, Trash2, X, Download, RefreshCw, Users, Clock, Filter, MoreVertical, Armchair, Coffee, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const TableManagement = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState(user?.restaurant);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Filter State
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: 4,
        location: 'Indoor'
    });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);
            let targetRestaurantId = restaurantId;

            // If we don't have the ID yet, try to find it
            if (!targetRestaurantId) {
                const res = await api.get('/restaurant/my-restaurants');
                if (res.data.data && res.data.data.length > 0) {
                    targetRestaurantId = res.data.data[0]._id;
                    setRestaurantId(targetRestaurantId);
                }
            }

            if (targetRestaurantId) {
                const { data } = await api.get(`/tables?restaurant=${targetRestaurantId}`);
                setTables(data.data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            toast.error('Failed to load tables');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tables', {
                ...formData,
                restaurant: restaurantId
            });
            toast.success('Table created successfully');
            setShowAddModal(false);
            setFormData({ name: '', capacity: 4, location: 'Indoor' });
            fetchTables();
        } catch (error) {
            console.error('Error creating table:', error);
            toast.error(error.response?.data?.message || 'Failed to create table');
        }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm('Are you sure you want to delete this table?')) return;

        try {
            await api.delete(`/tables/${id}`);
            toast.success('Table deleted successfully');
            fetchTables();
        } catch (error) {
            console.error('Error deleting table:', error);
            toast.error('Failed to delete table');
        }
    };

    const handleDownloadQR = async (table) => {
        try {
            const response = await api.get(`/tables/${table._id}/qr`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `table-${table.name}-qr.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading QR:', error);
            toast.error('Failed to download QR code');
        }
    };

    const openQRModal = (table) => {
        setSelectedTable(table);
        setShowQRModal(true);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            // Note: Assuming backend supports PATCH /tables/:id with { status }
            // If strictly using dedicated endpoints like /reset, we might need to adjust.
            // But usually a direct update is also possible or we can simulate it.
            // Reusing reset endpoint for FREE status if generic update fails.

            if (status === 'FREE') {
                await api.patch(`/tables/${id}/reset`);
            } else {
                // Determine if we need to call a specific endpoint or generic update
                // Trying generic update first as per typical REST patterns
                await api.patch(`/tables/${id}`, { status });
            }

            toast.success(`Table marked as ${status}`);
            fetchTables();
        } catch (error) {
            console.error('Error updating table status:', error);
            toast.error('Failed to update status');
        }
    };

    // Component for Table Timer
    const TableTimer = ({ startTime }) => {
        const [elapsed, setElapsed] = useState('');

        useEffect(() => {
            if (!startTime) return;

            const updateTimer = () => {
                const now = new Date();
                const start = new Date(startTime);
                const diff = Math.floor((now - start) / 1000); // seconds

                if (diff < 0) {
                    setElapsed('0m');
                    return;
                }

                const hours = Math.floor(diff / 3600);
                const minutes = Math.floor((diff % 3600) / 60);

                if (hours > 0) {
                    setElapsed(`${hours}h ${minutes}m`);
                } else {
                    setElapsed(`${minutes}m`);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000); // Update every minute

            return () => clearInterval(interval);
        }, [startTime]);

        return (
            <div className="flex items-center gap-1 text-xs font-mono text-foreground font-bold">
                <Clock size={12} className="text-muted-foreground" />
                {elapsed}
            </div>
        );
    };

    // Filtering Logic
    const filteredTables = tables.filter(table => {
        const matchLocation = filterLocation === 'All' || table.location === filterLocation;
        // Map backend statuses to filter if needed, assuming direct match for now
        const matchStatus = filterStatus === 'All' || table.status === filterStatus;
        return matchLocation && matchStatus;
    });

    // Stats Calculation
    const stats = {
        total: tables.length,
        occupied: tables.filter(t => t.status === 'OCCUPIED').length,
        capacity: tables.reduce((acc, t) => acc + (t.capacity || 0), 0),
        free: tables.filter(t => t.status === 'FREE').length
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
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Table Management
                            </h1>
                            <p className="text-muted-foreground">
                                Oversee layout, occupancy, and QR codes
                            </p>
                        </motion.div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add New Table
                        </button>
                    </div>

                    {/* Stats & Filters */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                        {/* Stats Cards */}
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Tables', value: stats.total, icon: TableIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Occupied', value: stats.occupied, icon: Users, color: 'text-red-500', bg: 'bg-red-500/10' },
                                { label: 'Available', value: stats.free, icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-500/10' },
                                { label: 'Total Capacity', value: stats.capacity, icon: Armchair, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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

                        {/* Filters */}
                        <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-center gap-3 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Filter size={16} /> Filters
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterLocation}
                                    onChange={(e) => setFilterLocation(e.target.value)}
                                    className="input text-sm py-1.5 px-3 w-full"
                                >
                                    <option value="All">All Locations</option>
                                    <option value="Indoor">Indoor</option>
                                    <option value="Outdoor">Outdoor</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Patio">Patio</option>
                                    <option value="Bar">Bar</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="input text-sm py-1.5 px-3 w-full"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="FREE">Free</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="RESERVED">Reserved</option>
                                    <option value="CLEANING">Cleaning</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredTables.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                            <TableIcon size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Tables Found</h3>
                            <p className="text-muted-foreground mb-6">Adjust filters or create your first table.</p>
                            <button onClick={() => setShowAddModal(true)} className="btn-primary">
                                Create Table
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            <AnimatePresence>
                                {filteredTables.map(table => (
                                    <motion.div
                                        key={table._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`relative group rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg ${table.status === 'OCCUPIED' ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' :
                                            table.status === 'RESERVED' ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' :
                                                table.status === 'CLEANING' ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' :
                                                    'bg-card border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${table.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-500' :
                                                    table.status === 'RESERVED' ? 'bg-orange-500/10 text-orange-500' :
                                                        table.status === 'CLEANING' ? 'bg-blue-500/10 text-blue-500' :
                                                            'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    {table.status === 'OCCUPIED' ? <Users size={20} /> :
                                                        table.status === 'RESERVED' ? <Clock size={20} /> :
                                                            table.status === 'CLEANING' ? <RefreshCw size={20} /> :
                                                                <Coffee size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-foreground">{table.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <MapPin size={10} />
                                                        {table.location}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Context Menu Placeholder (using simple hover buttons for now) */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={() => openQRModal(table)}
                                                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                                                    title="QR Code"
                                                >
                                                    <QrCode size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table._id)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${table.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-600' :
                                                    table.status === 'RESERVED' ? 'bg-orange-500/10 text-orange-600' :
                                                        table.status === 'CLEANING' ? 'bg-blue-500/10 text-blue-600' :
                                                            'bg-green-500/10 text-green-600'
                                                    }`}>
                                                    {table.status}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <Armchair size={14} /> Capacity
                                                </span>
                                                <span className="font-medium text-foreground">{table.capacity} Seats</span>
                                            </div>

                                            {table.status === 'OCCUPIED' && table.currentSession?.occupiedAt && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                                        <Clock size={14} /> Time
                                                    </span>
                                                    <TableTimer startTime={table.currentSession.occupiedAt} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Switcher Overlay on Hover/Details */}
                                        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
                                            {table.status !== 'FREE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'FREE')}
                                                    className="btn-outline text-xs h-8 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:border-green-500/50"
                                                >
                                                    Mark Free
                                                </button>
                                            )}
                                            {table.status === 'FREE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'OCCUPIED')}
                                                    className="btn-outline text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50"
                                                >
                                                    Occupied
                                                </button>
                                            )}
                                            {table.status !== 'CLEANING' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'CLEANING')}
                                                    className="btn-outline text-xs h-8 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 hover:border-blue-500/50"
                                                >
                                                    Clean
                                                </button>
                                            )}
                                            {table.status === 'FREE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'RESERVED')}
                                                    className="btn-outline text-xs h-8 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500/50"
                                                >
                                                    Reserve
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Add New Table</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTable} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Table Name / Number</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Table 1, VIP-A"
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Capacity (Seats)</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        min="1"
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block text-foreground">Location</label>
                                    <select
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="Indoor">Indoor</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="VIP">VIP</option>
                                        <option value="Patio">Patio</option>
                                        <option value="Bar">Bar</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 mt-8 pt-4 border-t border-border">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Create Table
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View QR Modal */}
            <AnimatePresence>
                {showQRModal && selectedTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-xl w-full max-w-sm text-center shadow-2xl p-6"
                        >
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setShowQRModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={24} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold mb-2 text-foreground">{selectedTable.name}</h2>
                            <p className="text-muted-foreground mb-6">Scan to order</p>

                            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
                                <img src={selectedTable.qrCodeImage} alt="Large QR" className="h-48 w-48" />
                            </div>

                            <button onClick={() => handleDownloadQR(selectedTable)} className="btn-primary w-full gap-2">
                                <Download size={18} />
                                Download PNG
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Icon for Stats
const CheckCircleIcon = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default TableManagement;
