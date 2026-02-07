import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle, MessageSquare, CheckCircle, ChevronDown, User,
    Clock, Phone, Mic, Filter, Search, MoreVertical, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const Complaints = () => {
    const [selectedStatus, setSelectedStatus] = useState('OPEN');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: complaints, isLoading } = useQuery({
        queryKey: ['complaints', selectedStatus],
        queryFn: async () => {
            const res = await api.get(`/complaints?status=${selectedStatus}`);
            return res.data.data;
        }
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, resolution }) => api.patch(`/complaints/${id}`, { status: 'RESOLVED', resolution }),
        onSuccess: () => {
            queryClient.invalidateQueries(['complaints']);
            toast.success('Complaint resolved successfully');
        },
        onError: () => {
            toast.error('Failed to resolve complaint');
        }
    });

    // Simple client-side stats based on loaded data (approximate for now)
    const stats = useMemo(() => {
        if (!complaints) return { critical: 0, total: 0 };
        return {
            total: complaints.length,
            critical: complaints.filter(c => c.severity === 'CRITICAL').length,
            high: complaints.filter(c => c.severity === 'HIGH').length
        };
    }, [complaints]);

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
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Complaints & Feedback
                            </h1>
                            <p className="text-muted-foreground">
                                Track and resolve customer issues efficiently
                            </p>
                        </motion.div>

                        <div className="flex bg-card border border-border p-1 rounded-lg shadow-sm">
                            {['OPEN', 'RESOLVED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedStatus === status
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats (Only relevant for OPEN usually, but nice to have) */}
                    {selectedStatus === 'OPEN' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Critical Issues</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.critical}</h3>
                                </div>
                            </div>
                            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">High Priority</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.high}</h3>
                                </div>
                            </div>
                            <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Open</p>
                                    <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Complaints List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : complaints?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-card border border-dashed border-border/50 rounded-xl text-center">
                                <div className="p-4 bg-green-500/10 rounded-full mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h3>
                                <p className="text-muted-foreground">
                                    No {selectedStatus.toLowerCase()} complaints found.
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {complaints?.map((comp) => (
                                    <ComplaintCard
                                        key={comp._id}
                                        complaint={comp}
                                        onResolve={resolveMutation.mutate}
                                        isResolved={selectedStatus === 'RESOLVED'}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

const ComplaintCard = ({ complaint, onResolve, isResolved }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [resolution, setResolution] = useState(complaint.resolution || '');

    const severityColors = {
        CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
        HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-card border ${isExpanded ? 'border-primary/50 shadow-md' : 'border-border/50 shadow-sm'} rounded-xl overflow-hidden hover:border-border transition-all`}
        >
            <div
                className="p-6 cursor-pointer flex gap-4"
                onClick={() => !isExpanded && setIsExpanded(true)}
            >
                {/* Severity Indicator Strip */}
                <div className={`w-1.5 self-stretch rounded-full ${complaint.severity === 'CRITICAL' ? 'bg-red-500' :
                    complaint.severity === 'HIGH' ? 'bg-orange-500' :
                        complaint.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${severityColors[complaint.severity] || severityColors.LOW}`}>
                                {complaint.severity}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {complaint.type}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} /> {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">
                        {complaint.message}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <User size={14} className="text-primary" />
                            <span className="text-foreground font-medium">{complaint.customerName}</span>
                        </div>
                        {complaint.contact && (
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} />
                                <span>{complaint.contact}</span>
                            </div>
                        )}
                        {complaint.voiceNoteUrl && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/30 rounded text-xs font-medium">
                                <Mic size={12} /> Voice Note
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50 bg-muted/5"
                    >
                        <div className="p-6 pt-4">
                            {/* Detailed Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Customer Details</label>
                                    <div className="text-sm text-foreground space-y-1">
                                        <p>{complaint.customerName}</p>
                                        <p className="font-mono text-muted-foreground">{complaint.contact || 'No contact info'}</p>
                                    </div>
                                </div>
                                {complaint.voiceNoteUrl && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Voice Attachment</label>
                                        <audio controls src={complaint.voiceNoteUrl} className="h-8 w-full max-w-xs rounded" />
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            {isResolved ? (
                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-start gap-3">
                                    <CheckCircle size={20} className="text-green-500 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-green-500 mb-1">Resolved</h4>
                                        <p className="text-sm text-foreground/80">{complaint.resolution}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-background border border-border p-4 rounded-xl shadow-sm">
                                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-primary" /> Resolution Details
                                    </h4>
                                    <textarea
                                        className="input w-full min-h-[100px] mb-4 text-sm resize-none"
                                        placeholder="Describe how this issue was resolved..."
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                            className="btn-ghost text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onResolve({ id: complaint._id, resolution });
                                            }}
                                            className="btn-primary text-sm gap-2"
                                            disabled={!resolution.trim()}
                                        >
                                            <CheckCircle size={16} /> Mark as Resolved
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Complaints;
