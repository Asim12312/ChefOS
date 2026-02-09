import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Send, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const ReviewFeedback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const restaurantId = searchParams.get('restaurant');

    // In a real app, we might also get orderId to link the review to a specific order

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a star rating");
            return;
        }

        if (!restaurantId) {
            toast.error("Missing restaurant information");
            return;
        }

        setLoading(true);
        try {
            // Only use orderId if explicitly provided in URL query params
            // Don't auto-pull from localStorage as it may be stale
            const orderId = searchParams.get('order');

            const payload = {
                restaurantId: restaurantId,
                rating,
                comment,
                customerName: "Guest Customer"
            };

            // Only include orderId if it was explicitly provided
            if (orderId) {
                payload.orderId = orderId;
            }

            await api.post('/reviews', payload);

            toast.success("Thank you for your feedback!");
            navigate(-1); // Go back to previous page
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to submit review";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20 max-w-lg mx-auto px-4 pt-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-2">How was it?</h1>
                <p className="text-gray-400">Your feedback helps us improve.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="p-2 transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={40}
                                    className={`transition-colors ${(hoverRating || rating) >= star
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-600'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-primary font-bold text-lg h-6">
                        {rating === 1 && "Terrible"}
                        {rating === 2 && "Bad"}
                        {rating === 3 && "Okay"}
                        {rating === 4 && "Good"}
                        {rating === 5 && "Excellent!"}
                    </p>
                </div>

                {/* Comment */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 focus-within:border-primary/50 transition-colors">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what you liked or what we can do better..."
                        className="w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none min-h-[150px] resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Submit Review <Send size={18} /></>}
                </button>
            </form>
        </div>
    );
};

export default ReviewFeedback;
