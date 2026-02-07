import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { restaurant, tableId } = useOutletContext();
    const navigate = useNavigate();

    // Group items by ID and special instructions? No, context already handles flat list nicely.

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-secondary mb-6">Looks like you haven't added anything yet.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all"
                >
                    <ArrowLeft size={18} /> Go Back to Menu
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <h1 className="text-2xl font-bold mb-6">Your Order</h1>

            <div className="space-y-4">
                <AnimatePresence>
                    {cart.map((item, index) => (
                        <motion.div
                            key={`${item._id}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white/5 rounded-xl p-4 flex gap-4 border border-white/5"
                        >
                            <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full" />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                <p className="text-sm text-secondary mb-2">${item.price} each</p>

                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item._id, item.specialInstructions, -1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="font-mono w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item._id, item.specialInstructions, 1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item._id, item.specialInstructions)}
                                        className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="mt-8 space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-secondary">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                    <span>Tax (10%)</span>
                    <span>${(cartTotal * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>${(cartTotal * 1.1).toFixed(2)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur border-t border-white/10">
                <Link
                    to={tableId ? `/checkout?table=${tableId}` : "/checkout"}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
                >
                    Proceed to Checkout <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};

export default Cart;
