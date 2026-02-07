import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Clock, Check, X, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';

const Reservations = () => {
    const [activeTab, setActiveTab] = useState('PENDING');
    const queryClient = useQueryClient();

    // Fetch Reservations
    const { data: reservations, isLoading } = useQuery({
        queryKey: ['reservations', activeTab],
        queryFn: async () => {
            const res = await api.get(`/reservations?status=${activeTab}&date=${new Date().toISOString()}`);
            return res.data.data;
        }
    });

    // Update Status Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/reservations/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['reservations']);
            toast.success('Reservation updated');
        }
    });

    return (
        <div className="min-h-screen pb-10">
            <div className="container p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Reservations
                        </h1>
                        <p className="text-gray-400">Manage table bookings</p>
                    </div>
                    <div className="glass p-1 rounded-lg flex gap-1">
                        {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveTab(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === status
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'hover:bg-white/5 text-gray-400'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading reservations...</div>
                ) : reservations?.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Calendar className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white">No {activeTab.toLowerCase()} reservations</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {reservations?.map((res) => (
                                <motion.div
                                    key={res._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="card hover:bg-white/5 transition-colors border-l-4 border-l-primary"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="bg-primary/20 p-3 rounded-xl h-fit">
                                                <Calendar size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{res.customerName}</h3>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {res.timeSlot.startTime} - {res.timeSlot.endTime}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {res.guestCount} Guests
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={14} />
                                                        {res.customerPhone}
                                                    </div>
                                                </div>
                                                {res.specialRequests && (
                                                    <div className="mt-3 bg-white/5 p-2 rounded text-sm italic">
                                                        <MessageSquare size={12} className="inline mr-1 opacity-70" />
                                                        "{res.specialRequests}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activeTab === 'PENDING' && (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => updateMutation.mutate({ id: res._id, status: 'CONFIRMED' })}
                                                    className="btn btn-success btn-sm w-full gap-2 p-2"
                                                    title="Confirm"
                                                >
                                                    <Check size={16} /> Confirm
                                                </button>
                                                <button
                                                    onClick={() => updateMutation.mutate({ id: res._id, status: 'CANCELLED' })}
                                                    className="btn btn-outline btn-sm w-full gap-2 p-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                    title="Reject"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'CONFIRMED' && (
                                            <button
                                                onClick={() => updateMutation.mutate({ id: res._id, status: 'COMPLETED' })}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Mark Seated
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reservations;
