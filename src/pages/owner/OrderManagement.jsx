import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import {
    Clock, CheckCircle, ChefHat, Bell, XCircle, DollarSign,
    MessageCircle, Mic, QrCode, CreditCard, Receipt, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const OrderManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { socket, joinRestaurant } = useSocket();
    const [restaurantId, setRestaurantId] = useState(user?.restaurant);
    const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, HISTORY
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Initial setup
    useEffect(() => {
        if (!restaurantId && user) {
            api.get('/restaurant/my-restaurants').then(res => {
                if (res.data.data?.[0]) {
                    setRestaurantId(res.data.data[0]._id);
                    joinRestaurant(res.data.data[0]._id);
                }
            });
        } else if (restaurantId) {
            joinRestaurant(restaurantId);
        }
    }, [user, restaurantId]);

    // Socket Listeners
    useEffect(() => {
        if (socket) {
            const playSound = () => {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
            };

            socket.on('order:created', () => {
                playSound();
                toast.success('New Order Received!');
                queryClient.invalidateQueries(['orders']);
            });
            socket.on('order:status-changed', () => {
                queryClient.invalidateQueries(['orders']);
            });
            socket.on('order:payment-updated', () => {
                queryClient.invalidateQueries(['orders']);
                toast.success('Payment Received');
            });
            socket.on('order:cancelled', () => {
                toast.error('Order Cancelled');
                queryClient.invalidateQueries(['orders']);
            });

            // Listen for bill requests to update UI immediately
            socket.on('service:new', (data) => {
                if (data.type === 'REQUEST_BILL') {
                    queryClient.invalidateQueries(['service-requests-active']);
                }
            });

            return () => {
                socket.off('order:created');
                socket.off('order:status-changed');
                socket.off('order:payment-updated');
                socket.off('order:cancelled');
                socket.off('service:new');
            };
        }
    }, [socket, queryClient]);

    // Fetch Orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 30000
    });

    // Fetch Active Service Requests (to highlight bill requests)
    const { data: serviceRequests = [] } = useQuery({
        queryKey: ['service-requests-active', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/service?restaurant=${restaurantId}&status=PENDING`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 15000
    });

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            toast.success('Order status updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
    });

    const updatePaymentMutation = useMutation({
        mutationFn: ({ id }) => api.patch(`/orders/${id}/payment`, { paymentStatus: 'PAID' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['tables']); // Since table is freed
            toast.success('Order Paid & Table Freed');
        },
        onError: (err) => toast.error('Payment update failed')
    });

    // Configuration - 3 Columns Only
    const statusColumns = {
        PENDING: { label: 'Pending', icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', next: 'PREPARING' },
        PREPARING: { label: 'Preparing', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', next: 'READY' },
        READY: { label: 'Ready', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', next: 'SERVED' }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'VOICE': return <Mic size={14} className="text-primary" />;
            case 'WHATSAPP': return <MessageCircle size={14} className="text-green-400" />;
            case 'QR': return <QrCode size={14} className="text-blue-400" />;
            default: return null;
        }
    };

    // Filter Logic
    const activeOrders = useMemo(() => {
        return orders.filter(o =>
            ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        );
    }, [orders]);

    const historyOrders = useMemo(() => {
        return orders.filter(o =>
            o.status === 'SERVED' ||
            o.status === 'CANCELLED' ||
            o.paymentStatus === 'PAID'
        );
    }, [orders]);

    // Live Stats Calculation
    const stats = useMemo(() => {
        const active = activeOrders.length;
        const revenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
        const urgent = activeOrders.filter(o => {
            const created = new Date(o.createdAt).getTime();
            const now = Date.now();
            return (now - created) > 15 * 60 * 1000; // 15 mins
        }).length;
        return { active, revenue, urgent };
    }, [activeOrders]);

    const isBillRequested = (tableId) => {
        return serviceRequests.some(req =>
            req.table?._id === tableId && req.type === 'REQUEST_BILL'
        );
    };


    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center gap-2 text-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    Loading Orders...
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

                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">

                    {/* Top Stats Bar & Toolbar */}
                    <div className="flex flex-col gap-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold font-logo-stylish text-foreground">
                                    Order Manager
                                </h1>
                                <p className="text-muted-foreground text-sm">Live kitchen workflow</p>
                            </div>

                            <div className="flex bg-muted p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('ACTIVE')}
                                    className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'ACTIVE' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Active Board
                                </button>
                                <button
                                    onClick={() => setActiveTab('HISTORY')}
                                    className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        {/* Professional Stats Overview */}
                        {activeTab === 'ACTIVE' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Orders</p>
                                        <h3 className="text-2xl font-bold text-foreground">{stats.active}</h3>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        <ChefHat size={20} />
                                    </div>
                                </div>
                                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Est. Revenue</p>
                                        <h3 className="text-2xl font-bold text-foreground">${stats.revenue.toFixed(2)}</h3>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                                        <DollarSign size={20} />
                                    </div>
                                </div>
                                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Attention Needed</p>
                                        <h3 className={`text-2xl font-bold ${stats.urgent > 0 ? 'text-red-500' : 'text-foreground'}`}>{stats.urgent}</h3>
                                    </div>
                                    <div className={`p-3 rounded-full ${stats.urgent > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                                        <AlertCircle size={20} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {activeTab === 'ACTIVE' ? (
                        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                            <div className="flex gap-4 h-full min-w-[900px]">
                                {Object.entries(statusColumns).map(([status, config]) => {
                                    // Map orders to 3 columns visually
                                    const columnOrders = activeOrders.filter(o => {
                                        if (status === 'PENDING') return o.status === 'PENDING' || o.status === 'ACCEPTED';
                                        return o.status === status;
                                    });

                                    const Icon = config.icon;

                                    return (
                                        <div key={status} className="flex-1 flex flex-col min-w-[280px]">
                                            <div className={`flex items-center gap-2 p-3 rounded-t-xl font-bold border-b transition-colors bg-card border-border ${config.color}`}>
                                                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                                    <Icon size={18} />
                                                </div>
                                                {config.label}
                                                <span className="ml-auto bg-muted px-2 py-0.5 rounded text-xs text-foreground font-mono">
                                                    {columnOrders.length}
                                                </span>
                                            </div>

                                            <div className="flex-1 bg-muted/30 rounded-b-xl p-2 border-x border-b border-border space-y-3 overflow-y-auto custom-scrollbar">
                                                <AnimatePresence mode='popLayout'>
                                                    {columnOrders.map(order => {
                                                        const billRequested = isBillRequested(order.table?._id);

                                                        return (
                                                            <motion.div
                                                                key={order._id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    scale: 1,
                                                                    borderColor: billRequested ? 'rgba(239, 68, 68, 0.5)' : undefined
                                                                }}
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                className={`bg-card rounded-xl p-3 shadow-sm border ${billRequested ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : 'border-border'} hover:shadow-md transition-all group`}
                                                            >
                                                                {/* Card Header */}
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-sm font-bold text-foreground">#{order.orderNumber.split('-')[2]}</span>
                                                                        {order.table ? (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">
                                                                                T-{order.table.name}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase">
                                                                                Takeout
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        {getSourceIcon(order.orderSource)}
                                                                        <span className="text-xs bg-muted px-1 rounded">
                                                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {billRequested && (
                                                                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-red-500 animate-pulse">
                                                                        <Receipt size={14} /> Bill Requested
                                                                    </div>
                                                                )}

                                                                {/* Items Preview */}
                                                                <div className="space-y-1 mb-3">
                                                                    {order.items.slice(0, 3).map((item, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                                                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold font-mono text-primary w-6 text-center">{item.quantity}</span>
                                                                            <span className="truncate text-foreground/90">{item.name}</span>
                                                                        </div>
                                                                    ))}
                                                                    {order.items.length > 3 && (
                                                                        <div className="text-xs text-muted-foreground pl-8">+{order.items.length - 3} more items...</div>
                                                                    )}
                                                                </div>

                                                                {/* Footer Actions */}
                                                                <div className="pt-3 mt-1 border-t border-border flex items-center justify-between">
                                                                    <div className="font-bold text-foreground">
                                                                        ${order.total.toFixed(2)}
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => updateStatusMutation.mutate({ id: order._id, status: config.next })}
                                                                            className={`flex items-center gap-1 px-3 py-1.5 ${config.bg} ${config.color} hover:opacity-80 text-xs font-bold rounded-lg transition-all border ${config.border}`}
                                                                        >
                                                                            {status === 'READY' ? 'Serve Now' : 'Next'} <ArrowRightIcon className="w-3 h-3" />
                                                                        </button>

                                                                        {status === 'PENDING' && (
                                                                            <button
                                                                                onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'CANCELLED' })}
                                                                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <XCircle size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    })}
                                                </AnimatePresence>
                                                {columnOrders.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 gap-2">
                                                        <Icon size={24} className="opacity-20" />
                                                        <span className="text-xs font-medium">No orders</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        // History View
                        <div className="flex-1 overflow-visible bg-card border border-border rounded-xl shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl">Order #</th>
                                        <th className="p-4">Table</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Payment</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 rounded-tr-xl">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm">
                                    {historyOrders.map(order => (
                                        <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-mono font-medium text-primary">#{order.orderNumber.split('-')[1]}</td>
                                            <td className="p-4 text-foreground">{order.table?.name || 'Takeout'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-foreground">${order.total.toFixed(2)}</td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {historyOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">No history found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for arrow icon (since I didn't import it and don't want to break if Lucide doesn't have it explicitly as ArrowRightIcon, simplified)
const ArrowRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export default OrderManagement;
