const PlaceholderPage = ({ title, description }) => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)' }}>
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-secondary mb-8">{description}</p>
            <p className="text-sm text-secondary">This page is under construction</p>
        </div>
    </div>
);

// Owner Pages
export const RestaurantSettings = () => <PlaceholderPage title="Restaurant Settings" description="Manage your restaurant profile and settings" />;
export const TableManagement = () => <PlaceholderPage title="Table Management" description="Create and manage tables with QR codes" />;
export const MenuManagement = () => <PlaceholderPage title="Menu Management" description="Add and edit menu items" />;
export const OrderManagement = () => <PlaceholderPage title="Order Management" description="View and manage all orders" />;
export const Analytics = () => <PlaceholderPage title="Analytics" description="View reports and insights" />;
export const Reviews = () => <PlaceholderPage title="Reviews" description="Customer feedback and ratings" />;

// Customer Pages
export const Menu = () => <PlaceholderPage title="Menu" description="Browse our delicious menu" />;
export const Cart = () => <PlaceholderPage title="Cart" description="Your order items" />;
export const Checkout = () => <PlaceholderPage title="Checkout" description="Complete your order" />;
export const OrderTracking = () => <PlaceholderPage title="Order Tracking" description="Track your order status" />;
export const VoiceOrder = () => <PlaceholderPage title="Voice Ordering" description="Order using your voice" />;

// KDS
export const KitchenDisplay = () => <PlaceholderPage title="Kitchen Display System" description="Real-time kitchen orders" />;

export default PlaceholderPage;
