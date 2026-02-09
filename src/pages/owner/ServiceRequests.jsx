import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock, User, MessageSquare, AlertCircle, ShoppingBag, ShieldAlert, ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { useTheme } from '../../context/ThemeContext';

const ServiceRequests = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('PENDING');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch Requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['serviceRequests', activeTab, user?.restaurant?._id || user?.restaurant],
        queryFn: async () => {
            const restaurantId = user?.restaurant?._id || user?.restaurant;
            if (!restaurantId) return [];
            const res = await api.get(`/service?status=${activeTab}&restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!(user?.restaurant?._id || user?.restaurant),
        refetchInterval: 30000 // Fallback polling
    });

    // Update Request Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/service/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['serviceRequests']);
            toast.success('Request updated');
        }
    });

    // Real-time listener
    useEffect(() => {
        if (!socket) return;

        const handleNewRequest = (data) => {
            const isBill = data.type === 'REQUEST_BILL';

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-card border-4 ${isBill ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-primary shadow-[0_0_50px_rgba(249,115,22,0.3)]'} rounded-[2rem] pointer-events-auto flex relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <div className="flex-1 w-0 p-6 relative z-10">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                {isBill ? (
                                    <div className="bg-emerald-500/20 p-3 rounded-2xl">
                                        <MessageSquare className="h-6 w-6 text-emerald-500" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="bg-primary/20 p-3 rounded-2xl">
                                        <Bell className="h-6 w-6 text-primary animate-pulse" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                                    {isBill ? 'Bill Requested!' : 'New Service Alert'}
                                </p>
                                <p className="text-sm font-black text-foreground">
                                    {data.tableName || 'A table'} is requesting {isBill ? 'their bill' : 'assistance'}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 10000 });

            // Audio Alert with fallback
            try {
                // Using a more standard/reliable notification sound URL
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => {
                    console.warn('Audio play failed - User interaction may be required', e);
                });
            } catch (err) {
                console.error('Sound system error', err);
            }

            queryClient.invalidateQueries(['serviceRequests']);
        };

        socket.on('service:new', handleNewRequest);
        socket.on('service:updated', () => queryClient.invalidateQueries(['serviceRequests']));

        return () => {
            socket.off('service:new', handleNewRequest);
            socket.off('service:updated');
        };
    }, [socket, queryClient]);

    const getStatusColor = (type) => {
        switch (type) {
            case 'CALL_WAITER': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'REQUEST_BILL': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'CLEANING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-muted/10 text-muted-foreground border-border/20';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'CALL_WAITER': return <User size={20} />;
            case 'REQUEST_BILL': return <MessageSquare size={20} />;
            case 'CLEANING': return <AlertCircle size={20} />;
            default: return <Bell size={20} />;
        }
    };

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl font-black text-foreground mb-1 tracking-tight italic">
                                SERVICE MONITOR
                            </h1>
                            <p className="text-muted-foreground font-medium text-sm">
                                Real-time table assistance & billing terminal
                            </p>
                        </motion.div>

                        <div className="flex bg-card border-4 border-border p-1.5 rounded-2xl shadow-xl overflow-x-auto max-w-full">
                            {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setActiveTab(status)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === status
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : requests?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-card border-4 border-dashed border-border rounded-[2.5rem] text-center">
                            <div className="p-6 bg-primary/10 rounded-3xl mb-6">
                                <Bell size={48} className="text-primary animate-pulse" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-2">ALL CAUGHT UP</h3>
                            <p className="text-muted-foreground max-w-md font-medium">
                                No {activeTab.toLowerCase()} requests at the moment.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {requests?.map((req) => (
                                    <motion.div
                                        key={req._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                        className={`relative overflow-hidden rounded-[2.5rem] border-4 ${isBill ? 'border-emerald-500/30' : 'border-primary/30'} p-8 bg-card shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all duration-500 group`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl ${getStatusColor(req.type)} shadow-inner`}>
                                                    {getIcon(req.type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-2xl text-foreground tracking-tighter">{req.table?.name || 'Table X'}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock size={12} className="text-muted-foreground" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {req.type === 'REQUEST_BILL' && (
                                                <div className="bg-emerald-500 h-3 w-3 rounded-full animate-ping shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                            )}
                                        </div>

                                        <div className="mb-8 relative z-10">
                                            <div className={`inline-flex px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${getStatusColor(req.type)}`}>
                                                {req.type.replace('_', ' ')}
                                            </div>
                                            {req.comment && (
                                                <div className="bg-muted/20 p-5 rounded-[2rem] border-2 border-dashed border-border/50">
                                                    <p className="text-sm font-medium text-foreground/80 italic leading-relaxed">"{req.comment}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-6 border-t border-border relative z-10">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                <Clock size={14} strokeWidth={3} />
                                                <span>
                                                    {Math.floor((new Date() - new Date(req.createdAt)) / 60000)}m WAITING
                                                </span>
                                            </div>

                                            {activeTab === 'PENDING' && (
                                                <button
                                                    onClick={() => updateMutation.mutate({ id: req._id, status: 'IN_PROGRESS' })}
                                                    className="px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    Attend <Check size={16} strokeWidth={3} />
                                                </button>
                                            )}

                                            {activeTab === 'IN_PROGRESS' && (
                                                <button
                                                    onClick={() => updateMutation.mutate({ id: req._id, status: 'COMPLETED' })}
                                                    className="px-6 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    Complete <Check size={16} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Background decorative elements */}
                                        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity ${req.type === 'REQUEST_BILL' ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ServiceRequests;
