import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

const ServiceRequests = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('PENDING');

    // Fetch Requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['serviceRequests', activeTab, user?.restaurant],
        queryFn: async () => {
            if (!user?.restaurant) return [];
            const res = await api.get(`/service?status=${activeTab}&restaurant=${user.restaurant}`);
            return res.data.data;
        },
        enabled: !!user?.restaurant,
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
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-800 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 ${isBill ? 'border-green-500' : 'border-primary'}`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                {isBill ? (
                                    <div className="bg-green-500/20 p-2 rounded-full">
                                        <MessageSquare className="h-6 w-6 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="bg-primary/20 p-2 rounded-full">
                                        <Bell className="h-6 w-6 text-primary animate-pulse" />
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-base font-bold text-white uppercase tracking-wider">
                                    {isBill ? 'Bill Requested!' : 'New Service Alert'}
                                </p>
                                <p className="mt-1 text-sm text-gray-300 font-medium">
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
            case 'CALL_WAITER': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            case 'REQUEST_BILL': return 'bg-green-500/20 text-green-500 border-green-500/50';
            case 'CLEANING': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
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
        <div className="min-h-screen pb-10">
            <div className="container p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Service Monitor
                        </h1>
                        <p className="text-gray-400">Real-time waiter & bill requests</p>
                    </div>
                    <div className="flex gap-2">
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveTab(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === status
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-400'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading requests...</div>
                ) : requests?.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Bell className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white">No requests found</h3>
                        <p className="text-gray-400">Waiting for new requests from tables...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {requests?.map((req) => (
                                <motion.div
                                    key={req._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`relative overflow-hidden rounded-xl border p-6 glass hover:shadow-xl transition-all ${getStatusColor(req.type)}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-full ${getStatusColor(req.type)} bg-opacity-20`}>
                                                {getIcon(req.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl">{req.table?.name || 'Unknown Table'}</h3>
                                                <span className="text-xs font-mono opacity-70">
                                                    {new Date(req.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                        {req.type === 'REQUEST_BILL' && (
                                            <span className="animate-pulse flex h-3 w-3 rounded-full bg-green-500"></span>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-lg font-medium">{req.type.replace('_', ' ')}</p>
                                        {req.comment && (
                                            <p className="text-sm mt-2 opacity-80 italic">"{req.comment}"</p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-2 text-sm opacity-70">
                                            <Clock size={16} />
                                            <span>
                                                {Math.floor((new Date() - new Date(req.createdAt)) / 60000)}m ago
                                            </span>
                                        </div>

                                        {activeTab === 'PENDING' && (
                                            <button
                                                onClick={() => updateMutation.mutate({ id: req._id, status: 'IN_PROGRESS' })}
                                                className="btn bg-white text-black hover:bg-gray-200 btn-sm gap-2"
                                            >
                                                Attend <Check size={16} />
                                            </button>
                                        )}

                                        {activeTab === 'IN_PROGRESS' && (
                                            <button
                                                onClick={() => updateMutation.mutate({ id: req._id, status: 'COMPLETED' })}
                                                className="btn btn-success btn-sm gap-2"
                                            >
                                                Complete <Check size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Background decorative blob */}
                                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${req.type === 'REQUEST_BILL' ? 'bg-green-500' : 'bg-primary'}`}></div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceRequests;
