import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Clock, Download, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { motion } from 'framer-motion';

const Analytics = () => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('week'); // today, week, month
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [data, setData] = useState({
        orders: [],
        revenue: null,
        peakHours: [],
        topItems: []
    });

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    useEffect(() => {
        if (restaurantId) {
            fetchAllData();
        }
    }, [restaurantId, dateRange]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Calculate start date based on range
            const now = new Date();
            let startDate = new Date();
            if (dateRange === 'today') startDate.setHours(0, 0, 0, 0);
            if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
            if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);

            const startStr = startDate.toISOString();
            const endStr = now.toISOString();

            // Parallel fetch
            const [ordersRes, revenueRes, peakHoursRes, topItemsRes] = await Promise.all([
                api.get(`/analytics/orders/${restaurantId}?startDate=${startStr}&endDate=${endStr}&groupBy=${dateRange === 'today' ? 'hour' : 'day'}`),
                api.get(`/analytics/revenue/${restaurantId}?startDate=${startStr}&endDate=${endStr}`),
                api.get(`/analytics/peak-hours/${restaurantId}?startDate=${startStr}&endDate=${endStr}`),
                api.get(`/analytics/top-items/${restaurantId}?startDate=${startStr}&endDate=${endStr}&limit=5`)
            ]);

            setData({
                orders: ordersRes.data.data,
                revenue: revenueRes.data.data,
                peakHours: peakHoursRes.data.data,
                topItems: topItemsRes.data.data
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        // Simple CSV export for top items
        if (!data.topItems || data.topItems.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Item Name', 'Category', 'Total Orders', 'Revenue'];
        const rows = data.topItems.map(item => [item.itemName, item.category, item.totalOrdered, item.totalRevenue]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_top_items_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Report downloaded');
    };

    const StatsCard = ({ title, value, subtext, icon: Icon, trend }) => (
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    );

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
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Analytics & Reports
                            </h1>
                            <p className="text-muted-foreground">
                                Performance insights for <span className="font-semibold text-primary">{dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                            </p>
                        </motion.div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex bg-card border border-border p-1 rounded-lg">
                                {['today', 'week', 'month'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${dateRange === range ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={downloadCSV}
                                className="btn-outline gap-2 bg-card"
                            >
                                <Download size={18} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatsCard
                                    title="Total Revenue"
                                    value={`$${data.revenue?.totalRevenue?.toFixed(2) || '0.00'}`}
                                    icon={DollarSign}
                                    trend={12.5} // Dummy trend for visual
                                />
                                <StatsCard
                                    title="Total Orders"
                                    value={data.revenue?.totalTransactions || 0}
                                    icon={ShoppingBag}
                                    trend={8.2}
                                />
                                <StatsCard
                                    title="Avg. Order Value"
                                    value={`$${data.revenue?.avgTransactionValue?.toFixed(2) || '0.00'}`}
                                    icon={TrendingUp}
                                    trend={-2.4}
                                />
                            </div>

                            {/* Main Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Revenue Trend Area Chart */}
                                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                                        <TrendingUp size={18} className="text-primary" /> Revenue Trend
                                    </h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.orders}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis dataKey="_id" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        color: 'hsl(var(--foreground))'
                                                    }}
                                                    formatter={(value) => [`$${value}`, 'Revenue']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="totalRevenue"
                                                    stroke="#d97706" // Using a primary-like color directly for visibility or use css variable integration if complex
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorRevenue)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Peak Hours Bar Chart */}
                                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                                        <Clock size={18} className="text-blue-500" /> Peak Hour Activity
                                    </h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.peakHours?.hourlyBreakdown?.sort((a, b) => a._id - b._id)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis dataKey="_id" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}:00`} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        color: 'hsl(var(--foreground))'
                                                    }}
                                                />
                                                <Bar dataKey="orderCount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Top Items Table */}
                            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500" /> Top Selling Items
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                                                <th className="py-3 px-2 font-medium">Rank</th>
                                                <th className="py-3 px-2 font-medium">Item Name</th>
                                                <th className="py-3 px-2 font-medium">Category</th>
                                                <th className="py-3 px-2 font-medium text-right">Orders</th>
                                                <th className="py-3 px-2 font-medium text-right">Revenue</th>
                                                <th className="py-3 px-2 font-medium text-right">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topItems?.map((item, index) => (
                                                <tr key={index} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                                                    <td className="py-4 px-2 font-bold text-muted-foreground">#{index + 1}</td>
                                                    <td className="py-4 px-2 font-medium text-foreground">{item.itemName}</td>
                                                    <td className="py-4 px-2">
                                                        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-2 text-right text-foreground">{item.totalOrdered}</td>
                                                    <td className="py-4 px-2 text-right font-mono font-medium text-primary">
                                                        ${item.totalRevenue.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <div className="w-24 ml-auto h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full"
                                                                style={{ width: `${(item.totalRevenue / (data.topItems[0]?.totalRevenue || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Analytics;
