import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, ShoppingCart, DollarSign, Users,
    ArrowUpRight, Clock, MoreHorizontal, Calendar,
    Menu, BarChart3, RefreshCw, AlertTriangle, Package
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('Today'); // 'Today', 'Week', 'Month'
    const [showItemsMenu, setShowItemsMenu] = useState(false);
    const itemsMenuRef = useRef(null);

    // Placeholder Data for Charts
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Chart Data State
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemsMenuRef.current && !itemsMenuRef.current.contains(event.target)) {
                setShowItemsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const restaurantId = user?.restaurant?._id || user?.restaurant;
            if (!restaurantId) return;

            try {
                setLoading(true);
                const [
                    summaryRes,
                    peakHoursRes,
                    inventoryRes,
                    notificationsRes,
                    topItemsRes
                ] = await Promise.all([
                    api.get(`/analytics/dashboard/${restaurantId}`),
                    api.get(`/analytics/peak-hours/${restaurantId}`),
                    api.get(`/inventory/${restaurantId}`),
                    api.get(`/analytics/notifications/${restaurantId}`),
                    api.get(`/analytics/top-items/${restaurantId}?limit=5`)
                ]);

                // 1. Summary & Trends
                if (summaryRes.data.success) {
                    setAnalytics({
                        ...summaryRes.data.data,
                        topItems: topItemsRes.data.success ? topItemsRes.data.data : []
                    });
                }

                // 2. Peak Hours Chart
                let formattedPeakHours = [];
                const hourly = peakHoursRes.data.success ? (peakHoursRes.data.data.hourlyBreakdown || []) : [];

                if (hourly.length > 0) {
                    formattedPeakHours = hourly.map(h => ({
                        name: h._id > 12 ? `${h._id - 12}pm` : h._id === 12 ? '12pm' : h._id === 0 ? '12am' : `${h._id}am`,
                        orders: h.orderCount,
                        revenue: h.totalRevenue
                    })).sort((a, b) => 0);
                } else {
                    // Default Skeleton Data (11am - 10pm)
                    formattedPeakHours = Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 11;
                        return {
                            name: hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : hour === 24 ? '12am' : `${hour}am`,
                            orders: 0,
                            revenue: 0
                        };
                    });
                }
                setPeakHoursData(formattedPeakHours);

                // Set initial chart data (Today)
                if (timeRange === 'Today') {
                    setChartData(formattedPeakHours.map(d => ({ name: d.name, sales: d.revenue })));
                }

                // 3. Low Stock Items
                if (inventoryRes.data.success) {
                    const lowStock = inventoryRes.data.data
                        .filter(item => item.isLowStock || item.stockQuantity <= 5)
                        .slice(0, 3)
                        .map(item => ({
                            name: item.name,
                            stock: item.stockQuantity,
                            unit: 'units', // Defaulting as unit comes from schema?
                            status: item.stockQuantity === 0 ? 'critical' : 'low'
                        }));
                    setLowStockItems(lowStock);
                }

                // 4. Notifications
                if (notificationsRes.data.success) {
                    setNotifications(notificationsRes.data.data);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load some dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    // Chart Data Effect
    useEffect(() => {
        const fetchChartData = async () => {
            const restaurantId = user?.restaurant?._id || user?.restaurant;
            if (!restaurantId || timeRange === 'Today') {
                // Re-apply peak hours data to chartData if switching back to Today
                // This ensures the chart updates when switching from Week -> Today
                if (timeRange === 'Today' && peakHoursData.length > 0) {
                    setChartData(peakHoursData.map(d => ({ name: d.name, sales: d.revenue })));
                }
                return;
            }

            try {
                // Fetch historical data
                const startDate = new Date();
                let daysToGenerate = 7;

                if (timeRange === 'Week') {
                    startDate.setDate(startDate.getDate() - 7);
                    daysToGenerate = 7;
                }
                if (timeRange === 'Month') {
                    startDate.setMonth(startDate.getMonth() - 1);
                    daysToGenerate = 14;
                }

                const res = await api.get(`/analytics/orders/${restaurantId}?startDate=${startDate.toISOString()}&groupBy=day`);

                let formatted = [];
                if (res.data.success && res.data.data.length > 0) {
                    formatted = res.data.data.map(item => ({
                        name: new Date(item._id).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                        sales: item.totalRevenue
                    }));
                } else {
                    // Generate empty data for graph skeleton
                    formatted = Array.from({ length: daysToGenerate }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (daysToGenerate - 1 - i));
                        return {
                            name: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                            sales: 0
                        };
                    });
                }
                setChartData(formatted);
            } catch (error) {
                console.error("Error fetching chart data", error);
            }
        };

        fetchChartData();
    }, [timeRange, user, peakHoursData]);

    const handleRefresh = async () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Refreshing data...',
                success: 'Dashboard updated',
                error: 'Could not refresh',
            }
        );
    };

    const stats = [
        {
            title: "Total Revenue",
            value: loading ? "..." : (analytics ? `$${analytics.today.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"),
            trend: loading ? "..." : (analytics?.trends?.revenue || "0%"),
            positive: parseFloat(analytics?.trends?.revenue || 0) >= 0,
            icon: DollarSign,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Total Orders",
            value: loading ? "..." : (analytics ? analytics.today.orders : "0"),
            trend: loading ? "..." : (analytics?.trends?.orders || "0%"),
            positive: parseFloat(analytics?.trends?.orders || 0) >= 0,
            icon: ShoppingCart,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Live Guests",
            value: loading ? "..." : (analytics?.active?.guests || "0"),
            trend: loading ? "..." : (analytics?.trends?.guests || "0%"), // Guests trend
            positive: parseFloat(analytics?.trends?.guests || 0) >= 0,
            icon: Users,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            title: "Avg. Prep Time",
            value: loading ? "..." : (analytics?.performance?.avgPrepTime ? `${analytics.performance.avgPrepTime}m` : "0m"),
            trend: loading ? "..." : (analytics?.trends?.prepTime || "0%"),
            positive: parseFloat(analytics?.trends?.prepTime || 0) <= 0, // Lower prep time is better (positive result)
            icon: Clock,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ];

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
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Dashboard
                            </h1>
                            <p className="text-muted-foreground">
                                Overview for <span className="text-foreground font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                        </motion.div>

                        <div className="flex gap-2">
                            <button onClick={handleRefresh} className="btn-outline gap-2">
                                <RefreshCw size={14} /> Refresh
                            </button>
                            <button className="btn-primary gap-2">
                                <TrendingUp size={14} /> Reports
                            </button>
                        </div>
                    </div>

                    {/* KPI Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <stat.icon size={64} className={stat.color} />
                                </div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {stat.positive ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-1 tracking-tight relative z-10">{stat.value}</h3>
                                <p className="text-sm text-muted-foreground font-medium relative z-10">{stat.title}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Main Sales Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Revenue Flow</h3>
                                    <p className="text-sm text-muted-foreground">Live sales tracking</p>
                                </div>
                                <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
                                    {['Today', 'Week', 'Month'].map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setTimeRange(period)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === period ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[300px] w-full flex-1 min-h-0">
                                {loading ? (
                                    <div className="w-full h-full animate-pulse bg-muted/20 rounded-xl" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.8} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        if (data.isSkeleton) return null;
                                                        return (
                                                            <div className="bg-popover border border-border p-2 rounded-lg shadow-md">
                                                                <p className="text-sm font-semibold text-foreground">{data.name}</p>
                                                                <p className="text-sm text-primary">Sales: ${data.sales}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="sales"
                                                stroke={chartData[0]?.isSkeleton ? "hsl(var(--muted-foreground)/0.5)" : "hsl(var(--primary))"}
                                                strokeOpacity={1}
                                                fillOpacity={1}
                                                fill={chartData[0]?.isSkeleton ? "hsl(var(--muted)/0.3)" : "url(#colorSales)"}
                                                strokeWidth={3}
                                                strokeDasharray={chartData[0]?.isSkeleton ? "5 5" : "0"}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </motion.div>

                        {/* Side Widgets Column */}
                        <div className="space-y-6">

                            {/* Peak Hours Widget */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-foreground">Peak Hours</h3>
                                    <p className="text-xs text-muted-foreground">Traffic intensity by hour</p>
                                </div>
                                <div className="h-[200px] w-full">
                                    {loading ? (
                                        <div className="flex gap-2 h-full items-end pb-2">
                                            {[...Array(7)].map((_, i) => (
                                                <div key={i} className="flex-1 bg-muted/20 animate-pulse rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                            ))}
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={peakHoursData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.8} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                                                    dy={5}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                                                    width={25}
                                                />
                                                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                                    {peakHoursData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.isSkeleton ? 'hsl(var(--muted))' : (entry.orders > 60 ? 'hsl(var(--primary))' : 'hsl(var(--muted))')}
                                                        />
                                                    ))}
                                                </Bar>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            if (data.isSkeleton) return null;
                                                            return (
                                                                <div className="bg-popover border border-border p-2 rounded-lg shadow-md">
                                                                    <p className="text-sm font-semibold text-foreground">{data.name}</p>
                                                                    <p className="text-sm text-primary">Orders: {data.orders}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>

                            {/* Low Stock Alerts */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-foreground">Low Stock Alerts</h3>
                                    {!loading && lowStockItems.length > 0 && (
                                        <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                            {lowStockItems.length} Alert{lowStockItems.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg animate-pulse">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 bg-muted/40 rounded-lg" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-3 w-24 bg-muted/40 rounded" />
                                                        <div className="h-2 w-16 bg-muted/40 rounded" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        lowStockItems.length > 0 ? (
                                            lowStockItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                                            <AlertTriangle size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.stock} {item.unit} remaining</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-xs font-bold text-primary hover:underline">Restock</button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-sm text-muted-foreground">
                                                All items well stocked
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>

                        </div>
                    </div>

                    {/* Bottom Section: Top Items & Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Popular Items */}
                        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-foreground">Top Selling Items</h3>
                                <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                    View Menu <ArrowUpRight size={14} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {analytics?.topItems?.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-foreground truncate">{item.itemName}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{item.totalOrdered} orders</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-foreground">${item.totalRevenue}</span>
                                    </div>
                                ))}
                                {(!analytics?.topItems || analytics.topItems.length === 0) && (
                                    <div className="text-center py-6 text-muted-foreground italic">No sales data today</div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'New Reservation', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Manage Inventory', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                { label: 'Financial Report', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10' }, // Changed color to green for finance
                                { label: 'Staff Schedule', icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                            ].map((action, i) => (
                                <button key={i} className="flex flex-col items-center justify-center p-6 bg-card border border-border/50 rounded-2xl hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <div className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center mb-3`}>
                                        <action.icon size={24} className={action.color} />
                                    </div>
                                    <span className="font-semibold text-foreground text-sm">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Dashboard;
