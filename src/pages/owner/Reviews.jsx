import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Clock, Download, ArrowUpRight, ArrowDownRight, Star, MessageSquare, Trash2, AlertTriangle, Check, User, ThumbsUp, Filter, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const Reviews = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState(0); // 0 = all
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    useEffect(() => {
        if (restaurantId) {
            fetchReviews();
        }
    }, [restaurantId, filterRating]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let url = `/reviews?restaurant=${restaurantId}`;
            if (filterRating > 0) url += `&rating=${filterRating}`;

            const response = await api.get(url);
            setReviews(response.data.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // toast.error('Failed to load reviews'); // Suppress to avoid spam on initial load if empty
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (reviewId) => {
        if (!replyMessage.trim()) return;

        try {
            await api.post(`/reviews/${reviewId}/reply`, { message: replyMessage });
            toast.success('Reply posted successfully');
            setReplyingTo(null);
            setReplyMessage('');
            fetchReviews(); // Refresh
        } catch (error) {
            console.error('Error sending reply:', error);
            toast.error('Failed to post reply');
        }
    };

    const handleMarkSpam = async (reviewId) => {
        if (!window.confirm('Mark this review as spam? It will be hidden.')) return;

        try {
            await api.patch(`/reviews/${reviewId}/spam`);
            toast.success('Review marked as spam');
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (error) {
            console.error('Error marking spam:', error);
            toast.error('Failed to mark as spam');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={14}
                className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}
            />
        ));
    };

    // Calculate Summary Stats (Frontend side for now)
    const summary = useMemo(() => {
        if (!reviews.length) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = (sum / total).toFixed(1);

        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                distribution[5 - r.rating]++; // Index 0 = 5 stars, Index 4 = 1 star
            }
        });

        return { average, total, distribution };
    }, [reviews]);

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
                                Customer Reviews
                            </h1>
                            <p className="text-muted-foreground">
                                Manage feedback and build customer trust
                            </p>
                        </motion.div>

                        <button
                            onClick={fetchReviews}
                            className="btn-outline gap-2 bg-card"
                            title="Refresh Reviews"
                        >
                            <RotateCcw size={16} /> Refresh
                        </button>
                    </div>

                    {/* Summary Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Average Rating Card */}
                        <div className="bg-card border-4 border-border rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-6xl font-black text-foreground mb-3 tracking-tighter">{summary.average}</h2>
                                <div className="flex gap-1.5 mb-3 justify-center">
                                    {renderStars(Math.round(summary.average))}
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Based on {summary.total} reviews</p>
                            </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="bg-card border-4 border-border rounded-[2.5rem] p-8 shadow-2xl col-span-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Rating Distribution</h3>
                                <div className="space-y-4">
                                    {[5, 4, 3, 2, 1].map((stars, index) => {
                                        const count = summary.distribution[index];
                                        const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                                        return (
                                            <div key={stars} className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 w-16 text-muted-foreground">
                                                    <span className="text-xs font-black">{stars}</span> <Star size={12} className="fill-current" />
                                                </div>
                                                <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden border border-border/20">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${stars >= 4 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : stars === 3 ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
                                                    />
                                                </div>
                                                <div className="w-12 text-right text-foreground font-black text-xs">
                                                    {count}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-card border-4 border-border rounded-[2rem] p-5 mb-10 flex flex-wrap gap-3 items-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-4 flex items-center gap-2 relative z-10">
                            <Filter size={16} /> Filter by:
                        </span>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {[0, 5, 4, 3, 2, 1].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() => setFilterRating(rating)}
                                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-4 ${filterRating === rating
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                        : 'bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {rating === 0 ? 'All Reviews' : `${rating} Stars`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reviews List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-card border border-dashed border-border/50 rounded-xl text-center">
                            <div className="p-4 bg-muted/20 rounded-full mb-4">
                                <MessageSquare size={32} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No Reviews Found</h3>
                            <p className="text-muted-foreground max-w-md">
                                {filterRating > 0
                                    ? `No ${filterRating}-star reviews found. Try changing the filter.`
                                    : "You haven't received any reviews yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {reviews.map((review) => (
                                    <motion.div
                                        key={review._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                                            {/* Reviewer Info - Ultra Compact */}
                                            <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:w-28 text-center border-b md:border-b-0 md:border-r border-border/30 pb-2 md:pb-0">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-orange-600 flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg shadow-primary/10">
                                                    {review.customerName ? review.customerName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="text-left md:text-center">
                                                    <p className="font-bold text-xs text-foreground tracking-tight line-clamp-1">
                                                        {review.customerName || 'Anonymous'}
                                                    </p>
                                                    <div className="flex items-center gap-1 justify-start md:justify-center">
                                                        <Check size={9} className="text-emerald-500" strokeWidth={3} />
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/60">Verified</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content - Ultra Compact */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="flex gap-0.5 px-1.5 py-0.5 bg-muted/30 rounded-md border border-border/50" title={`${review.rating} Stars`}>
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleMarkSpam(review._id)}
                                                        className="text-muted-foreground hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10 active:scale-95"
                                                        title="Mark as Spam"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <p className="text-xs font-medium text-foreground/80 italic mb-3 leading-relaxed bg-muted/5 p-3 rounded-xl border border-dashed border-border/20">
                                                    "{review.comment}"
                                                </p>

                                                {/* Reply Section - Ultra Compact */}
                                                {review.ownerReply ? (
                                                    <div className="bg-primary/5 border-l-2 border-primary p-3 rounded-xl relative overflow-hidden">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/10">
                                                                <User size={10} className="text-primary-foreground" strokeWidth={3} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Reply</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] font-medium text-foreground/70 leading-relaxed italic">
                                                            {review.ownerReply.message}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-1">
                                                        {replyingTo === review._id ? (
                                                            <div className="bg-card p-3 rounded-xl border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-1">
                                                                <textarea
                                                                    value={replyMessage}
                                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                                    placeholder="Type response..."
                                                                    className="w-full min-h-[60px] mb-2 text-[10px] bg-muted/20 border border-border/50 rounded-lg p-2 outline-none focus:border-primary/50 font-medium"
                                                                    autoFocus
                                                                />
                                                                <div className="flex justify-end gap-2 text-[8px]">
                                                                    <button
                                                                        onClick={() => setReplyingTo(null)}
                                                                        className="px-3 py-1 text-muted-foreground font-black uppercase tracking-widest hover:bg-muted rounded-md"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReply(review._id)}
                                                                        className="px-4 py-1 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-md shadow-md shadow-primary/10 active:scale-95 disabled:opacity-50"
                                                                        disabled={!replyMessage.trim()}
                                                                    >
                                                                        Post
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingTo(review._id);
                                                                    setReplyMessage('');
                                                                }}
                                                                className="px-4 py-1.5 bg-primary/10 text-primary font-black uppercase tracking-widest text-[8px] rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
                                                            >
                                                                <MessageSquare size={12} strokeWidth={3} /> Reply
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>
        </div >
    );
};

export default Reviews;
