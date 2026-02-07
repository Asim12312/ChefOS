import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Utensils, ChefHat, RefreshCw } from 'lucide-react';
import api from '../../config/api';

const OrderTracking = () => {
    const { orderId } = useParams();

    // Poll every 5 seconds
    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        refetchInterval: 5000
    });

    if (isLoading) return <div className="text-center py-20">Loading order status...</div>;
    if (!order) return <div className="text-center py-20">Order not found</div>;

    const steps = [
        { status: 'PENDING', label: 'Order Sent', icon: Clock },
        { status: 'ACCEPTED', label: 'Confirmed', icon: CheckCircle },
        { status: 'PREPARING', label: 'Cooking', icon: ChefHat },
        { status: 'READY', label: 'Ready', icon: Utensils },
        { status: 'SERVED', label: 'Served', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);

    const handleRequestBill = async () => {
        try {
            await api.post('/service', {
                restaurant: order.restaurant?._id || order.restaurant,
                table: order.table?._id || order.table,
                type: 'REQUEST_BILL',
                comment: `Bill requested for order #${orderId.slice(-6)}`
            });
            toast.success("Bill request sent to waiter!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to request bill.");
        }
    };

    return (
        <div className="pb-10 max-w-lg mx-auto px-4">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-1">Order Status</h1>
                <p className="text-secondary text-sm">Order #{orderId.slice(-6)}</p>
            </div>

            {/* Timeline */}
            <div className="relative space-y-8 px-4">
                <div className="absolute left-[34px] top-2 bottom-2 w-0.5 bg-white/10" />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.status} className={`relative flex items-center gap-6 ${isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                            <div className={`
                                 relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 
                                 ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-black border-white/20 text-white'}
                                 ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                             `}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold transition-all ${isCurrent ? 'text-lg text-primary' : 'text-md'}`}>{step.label}</h3>
                                {isCurrent && <p className="text-xs text-primary animate-pulse">In Progress...</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="mt-10 space-y-4">
                {(order.status === 'READY' || order.status === 'SERVED') && (
                    <button
                        onClick={handleRequestBill}
                        className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
                    >
                        Take My Bill
                    </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Link
                        to={`/reviews?restaurant=${order.restaurant?._id || order.restaurant}`}
                        className="btn-secondary py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                    >
                        Leave a Review
                    </Link>
                    <Link
                        to={`/complaints?restaurant=${order.restaurant?._id || order.restaurant}`}
                        className="btn-secondary py-3 rounded-xl flex items-center justify-center gap-2 text-sm text-red-400"
                    >
                        Report Issue
                    </Link>
                </div>
            </div>

            {/* Order Details */}
            <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/5">
                <h3 className="font-bold mb-4">Items Ordered</h3>
                <div className="space-y-4">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-primary">{item.quantity}x</span>
                                <span className="font-medium">{item.name || item.menuItem?.name || 'Item'}</span>
                            </div>
                            <span className="text-secondary">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-white/10 mt-6 pt-4 flex justify-between items-center">
                    <span className="text-secondary font-medium">Total Amount</span>
                    <span className="text-xl font-bold text-primary">${order.total?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => refetch()}
                    className="flex items-center justify-center gap-2 mx-auto text-sm text-secondary hover:text-white bg-white/5 px-4 py-2 rounded-full transition-colors"
                >
                    <RefreshCw size={14} /> Refresh Status
                </button>
            </div>
        </div>
    );
};

export default OrderTracking;
