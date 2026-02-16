import { forwardRef } from 'react';

const ReceiptTemplate = forwardRef(({ order }, ref) => {
    if (!order) return null;

    return (
        <div
            ref={ref}
            id="thermal-receipt"
            className="hidden print:block bg-white text-black p-8 font-mono text-sm max-w-[400px] mx-auto"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 20px; background: white !important; }
                    .no-print { display: none !important; }
                    #thermal-receipt { 
                        display: block !important; 
                        width: 300px !important; 
                        margin: 0 auto !important;
                        padding: 20px !important;
                        color: black !important;
                        background: white !important;
                        box-shadow: none !important;
                    }
                }
            `}} />


            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold uppercase mb-2">{order.restaurant?.name || 'Restaurant Name'}</h2>
                {order.restaurant?.address && (
                    <p className="text-xs opacity-70 mb-1">{order.restaurant.address}</p>
                )}
                <div className="text-xs opacity-70 mb-2">
                    {order.restaurant?.phone && <span>Tel: {order.restaurant.phone}</span>}
                    {order.restaurant?.phone && order.restaurant?.email && <span> | </span>}
                    {order.restaurant?.email && <span>{order.restaurant.email}</span>}
                </div>
                <div className="border-t border-black/20 my-2" />
                <p className="font-bold text-base mt-2">RECEIPT</p>
                <p className="text-xs opacity-70 mt-1">Order #{order.orderNumber?.split('-')[2] || order._id?.slice(-6).toUpperCase()}</p>
                <p className="text-xs opacity-70">{new Date(order.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                })}</p>
            </div>


            <div className="border-b-2 border-dashed border-black/20 my-4" />

            <div className="flex justify-between mb-4 font-bold">
                <span>TABLE: {order.table?.name || 'TAKEOUT'}</span>
                <span>{order.orderSource || 'POS'}</span>
            </div>

            <div className="space-y-3 mb-6">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                        <div className="flex-1 pr-4">
                            <div className="flex gap-2">
                                <span className="font-bold">{item.quantity}x</span>
                                <span>{item.name}</span>
                            </div>
                        </div>
                        <span className="font-bold">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="border-b-2 border-dashed border-black/20 my-4" />

            <div className="space-y-1 text-right mb-4">
                <div className="flex justify-between text-xs opacity-70">
                    <span>Subtotal</span>
                    <span>${(order.total / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs opacity-70">
                    <span>Tax (10%)</span>
                    <span>${(order.total - (order.total / 1.1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-black pt-2 mt-2">
                    <span>TOTAL</span>
                    <span>${order.total?.toFixed(2)}</span>
                </div>
            </div>

            <div className="text-center mt-10 space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest">Thank You!</p>
                <p className="text-[10px] opacity-70 italic">Powered by ChefOS POS</p>
                {/* QR Code Placeholder/Area if needed */}
                <div className="pt-4 flex justify-center opacity-10">
                    <div className="w-16 h-16 border-2 border-black border-dashed rounded flex items-center justify-center text-[8px]">
                        QR CODE
                    </div>
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
