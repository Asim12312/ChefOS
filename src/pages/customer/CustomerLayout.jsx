import { useState, useEffect } from 'react';
import { Outlet, useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Bell, ChevronLeft, Flag } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext'; // Assuming we will create/have this

const CustomerLayout = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const restaurantId = params.restaurantId;
    // Support both path param and query param for tableId
    const tableId = params.tableId || searchParams.get('table');
    const navigate = useNavigate();

    const { cartCount } = useCart();
    // Fetch Restaurant Details
    const { data: restaurant, isLoading } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const handleCallWaiter = async () => {
        if (!tableId) {
            toast.error("Please scan a table QR code to call a waiter.");
            return;
        }
        try {
            await api.post('/service-requests', {
                restaurant: restaurantId,
                table: tableId,
                type: 'CALL_WAITER'
            });
            toast.success("Waiter has been notified!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to call waiter.");
        }
    };

    if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    if (!restaurant) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Restaurant not found</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Back button logic could go here if needed, or simple branding */}
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">
                        {restaurant.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">{restaurant.name}</h1>
                        {tableId && <span className="text-secondary text-xs">Table Attached</span>}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 px-4">
                <Outlet context={{ restaurant, tableId }} />
            </main>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
                {/* Call Waiter */}
                {tableId && (
                    <button
                        onClick={handleCallWaiter}
                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        title="Call Waiter"
                    >
                        <Bell size={20} />
                    </button>
                )}

                {/* Cart FAB */}
                <Link
                    to={tableId ? `/cart?table=${tableId}` : "/cart"}
                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform relative"
                >
                    <ShoppingBag size={24} />
                    {/* Badge placeholder - cart count */}
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold border-2 border-black animate-bounce">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </div>
    );
};

export default CustomerLayout;
