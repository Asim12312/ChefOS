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

                        <div className="flex bg-card border-4 border-border p-1.5 rounded-2xl shadow-xl">
                            {['OPEN', 'RESOLVED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedStatus === status
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {selectedStatus === 'OPEN' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[
                                { label: 'Critical Issues', value: stats.critical, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                                { label: 'High Priority', value: stats.high, icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                { label: 'Total Open', value: stats.total, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-card border-4 border-border rounded-[2.5rem] p-8 flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                    <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color} shadow-inner relative z-10`}>
                                        <stat.icon size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-4xl font-black text-foreground tracking-tighter">{stat.value}</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
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
        </div >
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
            className={`bg-card border-2 ${isExpanded ? 'border-primary shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]' : 'border-border shadow-md'} rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 relative group`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div
                className="p-5 cursor-pointer flex gap-5 relative z-10"
                onClick={() => !isExpanded && setIsExpanded(true)}
            >
                {/* Severity Indicator Strip - Compact */}
                <div className={`w-1.5 self-stretch rounded-full ${complaint.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                    complaint.severity === 'HIGH' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                        complaint.severity === 'MEDIUM' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    }`} />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${severityColors[complaint.severity] || severityColors.LOW}`}>
                                {complaint.severity}
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider px-2 py-0.5 bg-muted/30 rounded-lg">
                                {complaint.type}
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={10} strokeWidth={3} /> {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="bg-muted/50 text-muted-foreground hover:text-foreground p-1.5 rounded-xl transition-all active:scale-90"
                        >
                            <ChevronDown size={18} strokeWidth={2.5} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <h3 className="text-base font-bold text-foreground mb-3 leading-snug tracking-tight">
                        {complaint.message}
                    </h3>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-xl border border-border/20">
                            <User size={12} className="text-primary" strokeWidth={3} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{complaint.customerName}</span>
                        </div>
                        {complaint.contact && (
                            <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-xl border border-border/20">
                                <Phone size={12} className="text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground">{complaint.contact}</span>
                            </div>
                        )}
                        {complaint.voiceNoteUrl && (
                            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10">
                                <Mic size={12} className="text-primary" strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Voice Note</span>
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
                        className="border-t border-border/30 bg-muted/5"
                    >
                        <div className="p-6 pt-2">
                            {/* Detailed Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-muted/10 p-4 rounded-2xl border border-border/20">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Customer Profile</label>
                                    <div className="space-y-1">
                                        <p className="text-md font-bold text-foreground">{complaint.customerName}</p>
                                        <p className="text-xs font-medium text-muted-foreground">{complaint.contact || 'No contact provided'}</p>
                                    </div>
                                </div>
                                {complaint.voiceNoteUrl && (
                                    <div className="bg-muted/10 p-4 rounded-2xl border border-border/20">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Voice Evidence</label>
                                        <audio controls src={complaint.voiceNoteUrl} className="h-8 w-full rounded-xl" />
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            {isResolved ? (
                                <div className="bg-emerald-500/5 border-2 border-emerald-500/20 p-5 rounded-2xl flex items-start gap-4">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-inner">
                                        <CheckCircle size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-emerald-500 mb-1 uppercase tracking-tight">Resolution Report</h4>
                                        <p className="text-xs text-foreground/80 font-medium leading-relaxed italic truncate-multiline">{complaint.resolution}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border-2 border-primary/20 p-6 rounded-[2rem] shadow-lg relative overflow-hidden">
                                    <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <ShieldAlert size={14} strokeWidth={3} /> RESOLUTION MESSAGE
                                    </h4>
                                    <textarea
                                        className="w-full min-h-[100px] mb-4 text-xs bg-muted/20 border border-border/50 focus:border-primary/50 font-medium py-3 px-4 rounded-xl outline-none transition-all"
                                        placeholder="Describe the resolution..."
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                            className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onResolve({ id: complaint._id, resolution });
                                            }}
                                            className="px-8 py-2.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg shadow-primary/10 hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                            disabled={!resolution.trim() || resolveMutation.isPending}
                                        >
                                            <CheckCircle size={14} strokeWidth={3} /> {resolveMutation.isPending ? 'Saving...' : 'Resolve'}
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
