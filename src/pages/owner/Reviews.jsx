import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Star, MessageSquare, Trash2, AlertTriangle, Check, User, ThumbsUp, Filter, Search, RotateCcw } from 'lucide-react';
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Average Rating Card */}
                        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                            <h2 className="text-5xl font-bold text-foreground mb-2">{summary.average}</h2>
                            <div className="flex gap-1 mb-2">
                                {renderStars(Math.round(summary.average))}
                            </div>
                            <p className="text-muted-foreground text-sm">Based on {summary.total} reviews</p>
                        </div>

                        {/* Rating Distribution */}
                        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm col-span-2">
                            <h3 className="font-semibold mb-4 text-foreground">Rating Distribution</h3>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((stars, index) => {
                                    const count = summary.distribution[index];
                                    const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-1 w-16 text-muted-foreground">
                                                <span className="font-medium">{stars}</span> <Star size={12} className="fill-current" />
                                            </div>
                                            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${stars >= 4 ? 'bg-green-500' : stars === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-10 text-right text-muted-foreground font-mono text-xs">
                                                {count}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-center shadow-sm">
                        <span className="text-sm font-medium text-muted-foreground mr-2 flex items-center gap-2">
                            <Filter size={16} /> Filter by:
                        </span>
                        {[0, 5, 4, 3, 2, 1].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => setFilterRating(rating)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterRating === rating
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                {rating === 0 ? 'All Reviews' : `${rating} Stars`}
                            </button>
                        ))}
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
                                        className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Reviewer Info */}
                                            <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:w-32 text-center">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold text-lg">
                                                    {review.customerName ? review.customerName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="text-left md:text-center">
                                                    <p className="font-semibold text-foreground text-sm line-clamp-1">
                                                        {review.customerName || 'Anonymous'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Verified Buyer</p>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5" title={`${review.rating} Stars`}>
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground px-2 border-l border-border ml-2">
                                                            {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleMarkSpam(review._id)}
                                                        className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded-md hover:bg-muted"
                                                        title="Mark as Spam"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <p className="text-foreground/90 italic mb-4 leading-relaxed">
                                                    "{review.comment}"
                                                </p>

                                                {/* Order Context Tag */}
                                                {review.order && (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/20 border border-muted/30 text-xs font-medium text-muted-foreground mb-4">
                                                        <Check size={12} className="text-green-500" />
                                                        Order #{review.order.orderNumber}
                                                    </div>
                                                )}

                                                {/* Reply Section */}
                                                {review.ownerReply ? (
                                                    <div className="bg-muted/10 border-l-2 border-primary pl-4 py-3 pr-4 rounded-r-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                                <User size={12} className="text-primary-foreground" />
                                                            </div>
                                                            <span className="text-xs font-bold text-foreground">Response from Owner</span>
                                                            <span className="text-xs text-muted-foreground mx-1">•</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(review.ownerReply.repliedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground/90 pl-7">
                                                            {review.ownerReply.message}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2">
                                                        {replyingTo === review._id ? (
                                                            <div className="bg-muted/10 p-4 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-2">
                                                                <label className="text-xs font-semibold text-foreground mb-2 block">Your Response:</label>
                                                                <textarea
                                                                    value={replyMessage}
                                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                                    placeholder="Thank the customer or address their concern..."
                                                                    className="input w-full min-h-[80px] mb-3 text-sm"
                                                                    autoFocus
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setReplyingTo(null)}
                                                                        className="btn-ghost text-xs px-3 py-1.5"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReply(review._id)}
                                                                        className="btn-primary text-xs px-3 py-1.5"
                                                                        disabled={!replyMessage.trim()}
                                                                    >
                                                                        Post Reply
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingTo(review._id);
                                                                    setReplyMessage('');
                                                                }}
                                                                className="text-primary text-sm font-medium hover:underline flex items-center gap-1.5"
                                                            >
                                                                <MessageSquare size={16} /> Reply to review
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
        </div>
    );
};

export default Reviews;
