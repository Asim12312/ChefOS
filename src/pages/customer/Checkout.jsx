import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { restaurant, tableId } = useOutletContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        paymentMethod: 'CASH',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tableId) {
            toast.error("Table ID is missing. Please scan the QR code again.");
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                restaurant: restaurant._id,
                table: tableId,
                items: cart.map(item => ({
                    menuItem: item._id,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions
                })),
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                paymentMethod: formData.paymentMethod,
                totalAmount: cartTotal * 1.1 // Including tax
            };

            const res = await api.post('/orders', orderData);

            if (res.data.success) {
                clearCart();
                toast.success("Order placed successfully!");
                navigate(`/order/${res.data.data._id}`);
            }
        } catch (error) {
            console.error('Order error:', error);
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="pb-24 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                    <h2 className="font-semibold text-lg border-b border-white/10 pb-2">Your Details</h2>
                    <div>
                        <label className="block text-sm text-secondary mb-1">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                            placeholder="John Doe"
                            value={formData.customerName}
                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-secondary mb-1">Phone Number</label>
                        <input
                            type="tel"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                            placeholder="+1 234 567 8900"
                            value={formData.customerPhone}
                            onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                    <h2 className="font-semibold text-lg border-b border-white/10 pb-2">Payment Method</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.paymentMethod === 'CASH'
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-black/20 border-white/10 text-secondary hover:bg-white/5'
                                }`}
                        >
                            <Banknote size={24} />
                            <span className="font-medium">Cash / Pay Waiter</span>
                        </div>

                        <div
                            onClick={() => setFormData({ ...formData, paymentMethod: 'CARD' })}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.paymentMethod === 'CARD'
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-black/20 border-white/10 text-secondary hover:bg-white/5'
                                }`}
                        >
                            <CreditCard size={24} />
                            <span className="font-medium">Pay Online</span>
                        </div>
                    </div>

                    {formData.paymentMethod === 'CARD' && (
                        <div className="p-3 bg-blue-500/10 text-blue-300 text-sm rounded-lg text-center">
                            Redirects to secure payment gateway
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total to Pay</span>
                        <span>${(cartTotal * 1.1).toFixed(2)}</span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Place Order <ArrowRight size={20} /></>}
                </button>
            </form>
        </div>
    );
};

export default Checkout;
