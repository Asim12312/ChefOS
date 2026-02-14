import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    Receipt, Search, Filter, Download, Printer,
    Calendar, Table, DollarSign, ChevronRight,
    ArrowLeft, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import ReceiptTemplate from '../../components/common/ReceiptTemplate';
import toast from 'react-hot-toast';

const Billing = () => {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
    const [selectedBill, setSelectedBill] = useState(null);

    const restaurantId = useMemo(() => {
        if (!user?.restaurant) return null;
        return typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    }, [user]);

    // Fetch Completed/Paid Orders
    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['bills', restaurantId, dateFilter],
        queryFn: async () => {
            if (!restaurantId) return [];
            // We fetch all orders but filter for those that are paid or served
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            return res.data.data.filter(order =>
                order.paymentStatus === 'PAID' || order.status === 'SERVED'
            );
        },
        enabled: !!restaurantId
    });

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const matchesSearch =
                bill.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.table?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

            // Date filtering
            const billDate = new Date(bill.createdAt);
            const now = new Date();
            let matchesDate = true;

            if (dateFilter === 'today') {
                matchesDate = billDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = billDate >= weekAgo;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesDate = billDate >= monthAgo;
            }

            return matchesSearch && matchesDate;
        });
    }, [bills, searchTerm, dateFilter]);

    const handlePrint = (bill) => {
        setSelectedBill(bill);
        toast.success(`Preparing Receipt for Order #${bill.orderNumber.split('-')[2]}...`);

        // Short timeout to ensure state update and render before printing
        setTimeout(() => {
            window.print();
        }, 100);
    };

    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center text-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-3">Loading Bills...</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex bg-background min-h-screen text-foreground">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                    <Receipt className="text-primary w-8 h-8" />
                                    Billing Management
                                </h1>
                                <p className="text-muted-foreground mt-1">Manage, view and print customer receipts</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm">
                                    <Download size={18} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by Order #, Table, or Customer..."
                                    className="w-full bg-muted/50 border-none rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                <select
                                    className="flex-1 bg-muted/50 border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="today">Today</option>
                                    <option value="week">Past 7 Days</option>
                                    <option value="month">Past 30 Days</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4 px-2">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Showing <span className="text-foreground font-bold">{filteredBills.length}</span> bills
                                </div>
                                <Filter size={18} className="text-muted-foreground" />
                            </div>
                        </div>

                        {/* Bills List */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                            <th className="p-4">Order Details</th>
                                            <th className="p-4">Table</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        <AnimatePresence mode='popLayout'>
                                            {filteredBills.map((bill) => (
                                                <motion.tr
                                                    key={bill._id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="group hover:bg-muted/20 transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <div className="font-mono text-primary font-bold">
                                                            #{bill.orderNumber.split('-')[1]}
                                                            <span className="text-foreground/80">-{bill.orderNumber.split('-')[2]}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                            {new Date(bill.createdAt).toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                <Table size={14} />
                                                            </div>
                                                            <span className="font-medium">{bill.table?.name || 'Takeout'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-medium">
                                                            {bill.items[0]?.name} {bill.items.length > 1 && `+ ${bill.items.length - 1} more`}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {bill.items.reduce((acc, current) => acc + current.quantity, 0)} items total
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${bill.paymentStatus === 'PAID'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-primary/10 text-primary border-primary/20'
                                                            }`}>
                                                            {bill.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-black text-lg">
                                                            ${bill.total.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handlePrint(bill)}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                                title="Print Bill"
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                            <button className="p-2 hover:bg-muted text-muted-foreground rounded-lg transition-colors">
                                                                <MoreVertical size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {filteredBills.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <Receipt size={48} className="opacity-10" />
                                                        <div className="text-lg font-medium opacity-50">No bills found for this criteria</div>
                                                        <button
                                                            onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
                                                            className="text-primary hover:underline text-sm"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Hidden Receipt for Printing */}
                        <div className="hidden">
                            {selectedBill && <ReceiptTemplate order={selectedBill} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Billing;
