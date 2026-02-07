import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, ChefHat, Bell, AlertCircle, LayoutGrid, List, ArrowUpDown, History, X, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

// --- Components ---

const OrderTimer = ({ createdAt, status }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const startTime = new Date(createdAt).getTime();
        const updateTimer = () => {
            const now = Date.now();
            setElapsed(Math.floor((now - startTime) / 1000));
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getColor = () => {
        if (elapsed > 1200) return 'text-red-400 font-bold animate-pulse'; // > 20 mins
        if (elapsed > 600) return 'text-yellow-400 font-bold'; // > 10 mins
        return 'text-gray-400';
    };

    return (
        <div className={`flex items-center gap-1.5 text-sm font-mono ${getColor()}`}>
            <Clock size={14} />
            <span>{formatTime(elapsed)}</span>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        PENDING: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
        ACCEPTED: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
        PREPARING: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
        READY: 'bg-green-500/20 text-green-500 border-green-500/50',
        SERVED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
};

const KitchenDisplay = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { socket, joinKDS } = useSocket();
    const [restaurantId, setRestaurantId] = useState(user?.restaurant);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('OLDEST'); // OLDEST, NEWEST
    const [viewMode, setViewMode] = useState('TICKETS'); // TICKETS, ITEMS
    const [showHistory, setShowHistory] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // History fetch (only when modal is open)
    const { data: historyOrders = [], refetch: refetchHistory } = useQuery({
        queryKey: ['kds-history', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/kds/orders?restaurant=${restaurantId}&status=SERVED&limit=20`);
            return res.data.data || [];
        },
        enabled: !!restaurantId && showHistory,
    });

    // Real-time stats (using analytics endpoint for accuracy)
    const { data: kdsStats } = useQuery({
        queryKey: ['kds-stats', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/analytics/dashboard/${restaurantId}`);
            return res.data.data?.performance || { avgPrepTime: 15 };
        },
        enabled: !!restaurantId,
        refetchInterval: 60000,
    });

    // Initial setup
    useEffect(() => {
        if (!restaurantId && user) {
            api.get('/restaurant/my-restaurants').then(res => {
                if (res.data.data?.[0]) {
                    setRestaurantId(res.data.data[0]._id);
                    joinKDS(res.data.data[0]._id);
                }
            });
        } else if (restaurantId) {
            joinKDS(restaurantId);
        }
    }, [user, restaurantId]);

    // Socket Listeners
    useEffect(() => {
        if (socket) {
            const playSound = () => {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
            };

            socket.on('kds:new-order', (order) => {
                playSound();
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex bg-[#1e1e1e] border border-white/10 shadow-2xl rounded-lg p-4 gap-3`}>
                        <Bell className="text-yellow-500" />
                        <div>
                            <h4 className="font-bold text-white">New Order #{order.orderNumber.split('-')[2]}</h4>
                            <p className="text-sm text-gray-400">Time to cook!</p>
                        </div>
                    </div>
                ));
                queryClient.invalidateQueries(['kds-orders']);
            });

            socket.on('kds:order-updated', () => {
                queryClient.invalidateQueries(['kds-orders']);
            });

            return () => {
                socket.off('kds:new-order');
                socket.off('kds:order-updated');
            };
        }
    }, [socket, queryClient]);

    // Fetch KDS Orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['kds-orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/kds/orders?restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 15000
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['kds-orders']);
            toast.success('Ticket Updated');
        },
        onError: () => toast.error('Failed to update status')
    });

    // Derived State
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        if (filterStatus !== 'ALL') {
            result = result.filter(o => o.status === filterStatus);
        } else {
            result = result.filter(o => o.status !== 'SERVED' && o.status !== 'CANCELLED');
        }

        result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortBy === 'OLDEST' ? timeA - timeB : timeB - timeA;
        });

        return result;
    }, [orders, filterStatus, sortBy]);

    // Group items logic
    const aggregatedItems = useMemo(() => {
        const items = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const key = `${item.name}-${JSON.stringify(item.selectedOptions || {})}`;
                if (!items[key]) {
                    items[key] = { ...item, count: 0, orders: [] };
                }
                items[key].count += item.quantity;
                items[key].orders.push(order.orderNumber.split('-')[2]);
            });
        });
        return Object.values(items);
    }, [filteredOrders]);

    // Stats
    const stats = useMemo(() => {
        const pending = orders.filter(o => o.status === 'PENDING').length;
        const preparing = orders.filter(o => o.status === 'PREPARING').length;
        const avgTime = "12m"; // Mock
        return { pending, preparing, avgTime };
    }, [orders]);


    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center gap-2 text-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    Loading Kitchen Display...
                </div>
            </div>
        </div>
    );

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

                {/* --- KDS Toolbar --- */}
                <div className="bg-card border-b border-border p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <ChefHat className="text-primary-foreground" size={24} />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-tight text-foreground leading-none">Kitchen</h1>
                                <span className="text-xs text-muted-foreground font-medium">Live Orders</span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-border hidden md:block" />

                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock size={16} className="text-primary" />
                                <span>Avg: <span className="text-foreground font-bold">{kdsStats?.avgPrepTime || 12}m</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Utensils size={16} className="text-orange-500" />
                                <span>Prep: <span className="text-foreground font-bold">{stats.preparing}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle size={16} className="text-blue-500" />
                                <span>Pending: <span className="text-foreground font-bold">{stats.pending}</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {/* View Switcher */}
                        <div className="flex bg-muted p-1 rounded-lg border border-border">
                            <button
                                onClick={() => setViewMode('TICKETS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'TICKETS' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid size={14} /> Tickets
                            </button>
                            <button
                                onClick={() => setViewMode('ITEMS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ITEMS' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List size={14} /> Items
                            </button>
                        </div>

                        <div className="w-px h-8 bg-border mx-2" />

                        {/* Filters */}
                        <div className="flex gap-2">
                            {['ALL', 'PENDING', 'PREPARING', 'READY'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterStatus === status
                                        ? 'bg-primary/10 border-primary/50 text-primary'
                                        : 'bg-muted border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}
                                >
                                    {status === 'ALL' ? 'All' : status}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setSortBy(prev => prev === 'OLDEST' ? 'NEWEST' : 'OLDEST')}
                            className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                            title="Sort Order"
                        >
                            <ArrowUpDown size={18} />
                        </button>

                        <button
                            onClick={() => { setShowHistory(true); refetchHistory(); }}
                            className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary hover:bg-muted/80 transition-all ml-2"
                            title="Recall / History"
                        >
                            <History size={18} />
                        </button>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">

                    {viewMode === 'TICKETS' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            <AnimatePresence mode='popLayout'>
                                {filteredOrders.map((order) => (
                                    <OrderTicket
                                        key={order._id}
                                        order={order}
                                        updateStatus={updateStatusMutation.mutate}
                                    />
                                ))}
                            </AnimatePresence>
                            {filteredOrders.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                                    <CheckCircle size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium">All caught up!</p>
                                    <p className="text-sm">No orders to display.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Aggregated Items View
                        aggregatedItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {aggregatedItems.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-card rounded-xl border border-border p-4 flex flex-col justify-between group hover:border-primary/50 transition-colors"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-foreground line-clamp-2">{item.name}</h3>
                                                <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-md text-xl font-bold font-mono">
                                                    x{item.count}
                                                </span>
                                            </div>
                                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                <div className="text-sm text-muted-foreground mb-3 space-y-1">
                                                    {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                        <div key={key} className="flex gap-1">
                                                            <span className="text-muted-foreground/80">{key}:</span>
                                                            <span className="text-muted-foreground">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-border">
                                            <p className="text-xs text-muted-foreground mb-2 font-mono">Orders: {item.orders.map(id => `#${id}`).join(', ')}</p>
                                            <button
                                                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
                                                onClick={() => toast('Item level updates coming soon')}
                                            >
                                                Mark All Ready
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[60vh] text-muted-foreground">No items to prepare.</div>
                        )
                    )}
                </main>

                {/* History Modal */}
                <AnimatePresence>
                    {showHistory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden text-foreground"
                            >
                                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <History className="text-primary" /> Order History
                                    </h2>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background">
                                    {historyOrders.length > 0 ? (
                                        <div className="space-y-3">
                                            {historyOrders.map(order => (
                                                <div key={order._id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-mono text-primary font-bold">#{order.orderNumber}</span>
                                                            <StatusBadge status={order.status} />
                                                            <span className="text-xs text-muted-foreground">{new Date(order.updatedAt || order.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            updateStatusMutation.mutate({ id: order._id, status: 'PREPARING' });
                                                            toast.success('Check KDS - Order recalled!');
                                                            setShowHistory(false);
                                                        }}
                                                        className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-bold text-foreground transition-colors"
                                                    >
                                                        Recall
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            No recently completed orders found.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Sub-components ---

const OrderTicket = ({ order, updateStatus }) => {

    // Status Logic
    const nextStatus = {
        'PENDING': 'ACCEPTED',
        'ACCEPTED': 'PREPARING',
        'PREPARING': 'READY',
        'READY': 'SERVED'
    };

    const actionLabel = {
        'PENDING': 'Accept',
        'ACCEPTED': 'Start Cook',
        'PREPARING': 'Ready',
        'READY': 'Serve'
    };

    const actionColor = {
        'PENDING': 'bg-blue-600 hover:bg-blue-500',
        'ACCEPTED': 'bg-orange-600 hover:bg-orange-500',
        'PREPARING': 'bg-green-600 hover:bg-green-500',
        'READY': 'bg-zinc-700 hover:bg-zinc-600'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col bg-card rounded-xl overflow-hidden shadow-sm border border-border h-full hover:shadow-md transition-shadow"
        >
            {/* Ticket Header */}
            <div className={`p-3 border-b-2 flex justify-between items-start ${order.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/50' :
                order.status === 'READY' ? 'bg-green-500/10 border-green-500/50' :
                    'bg-muted/50 border-border'
                }`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold font-mono tracking-tight text-foreground">#{order.orderNumber.split('-')[2]}</span>
                        {/* Table or Takeout Pill */}
                        {order.table ? (
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase">
                                T-{order.table.name}
                            </span>
                        ) : (
                            <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 uppercase">
                                Takeout
                            </span>
                        )}
                    </div>
                    <OrderTimer createdAt={order.createdAt} />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    {order.waiter && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <ChefHat size={10} /> {order.waiter.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Content */}
            <div className="p-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar bg-card">
                {/* Customer Note */}
                {order.note && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500 flex gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{order.note}</span>
                    </div>
                )}

                <ul className="space-y-3">
                    {order.items.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm group">
                            <div className="font-bold text-lg text-foreground tabular-nums w-6 shrink-0 text-center bg-muted/50 rounded h-7 flex items-center justify-center">
                                {item.quantity}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="font-medium text-foreground leading-tight mb-0.5">
                                    {item.name}
                                </div>
                                { /* Modifiers / Options */}
                                {item.selectedOptions && Object.values(item.selectedOptions).length > 0 && (
                                    <div className="text-muted-foreground text-xs mb-1">
                                        {Object.values(item.selectedOptions).join(', ')}
                                    </div>
                                )}
                                { /* Special Instructions */}
                                {item.specialInstructions && (
                                    <div className="text-yellow-500 text-xs italic">
                                        "{item.specialInstructions}"
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ticket Footer / Actions */}
            <div className="p-3 bg-muted/20 border-t border-border">
                {order.status !== 'SERVED' && (
                    <button
                        onClick={() => updateStatus({ id: order._id, status: nextStatus[order.status] })}
                        className={`w-full py-3 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-[0.98] text-white ${actionColor[order.status]}`}
                    >
                        {actionLabel[order.status]}
                    </button>
                )}

                {/* Secondary Action for PENDING (Cancel/Reject could go here) */}
                {order.status === 'PENDING' && (
                    <button
                        className="w-full mt-2 py-2 rounded-lg font-medium text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => toast.error("Cancel not implemented yet")} // Placeholder
                    >
                        Reject Order
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default KitchenDisplay;
