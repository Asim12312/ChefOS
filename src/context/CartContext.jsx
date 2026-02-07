import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Initialize cart from localStorage if available
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('tablefy_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (err) {
            return [];
        }
    });

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('tablefy_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, specialInstructions = '') => {
        setCart(prev => {
            const existingItemIndex = prev.findIndex(cartItem =>
                cartItem._id === item._id &&
                cartItem.specialInstructions === specialInstructions
            );

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += quantity;
                toast.success(`Updated quantity for ${item.name}`);
                return newCart;
            } else {
                // Add new item
                toast.success(`Added ${item.name} to cart`);
                return [...prev, { ...item, quantity, specialInstructions }];
            }
        });
    };

    const removeFromCart = (itemId, specialInstructions) => {
        setCart(prev => prev.filter(item =>
            !(item._id === itemId && item.specialInstructions === specialInstructions)
        ));
        toast.success("Item removed");
    };

    const updateQuantity = (itemId, specialInstructions, change) => {
        setCart(prev => prev.map(item => {
            if (item._id === itemId && item.specialInstructions === specialInstructions) {
                const newQty = item.quantity + change;
                if (newQty < 1) return item; // Don't remove, just stop at 1. User use remove button for 0.
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('tablefy_cart');
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
