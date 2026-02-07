import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Store, Table, Menu as MenuIcon, ShoppingCart,
    BarChart3, Star, LogOut, Bell, Calendar,
    MessageSquare, Settings, ChevronLeft, ChevronRight,
    UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const Sidebar = ({ className }) => {
    const { logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { label: 'Overview', icon: LayoutDashboard, link: '/dashboard' },
        { label: 'Live Orders', icon: ShoppingCart, link: '/orders' },
        { label: 'Menu Management', icon: MenuIcon, link: '/menu-management' },
        { label: 'Table Management', icon: Table, link: '/tables' },
        { label: 'Inventory', icon: Store, link: '/inventory' },
        { label: 'Reservations', icon: Calendar, link: '/reservations' },
        { label: 'Kitchen Display', icon: UtensilsCrossed, link: '/kds' },
        { label: 'Analytics', icon: BarChart3, link: '/analytics' },
        { label: 'Reviews', icon: Star, link: '/reviews' },
        { label: 'Complaints', icon: MessageSquare, link: '/complaints' },
        { label: 'Settings', icon: Settings, link: '/settings' },
    ];

    return (
        <motion.div
            initial={false}
            animate={{ width: collapsed ? 80 : 280 }}
            className={cn(
                "hidden lg:flex flex-col h-screen sticky top-0 border-r border-border/40 bg-background/80 backdrop-blur-xl z-50 transition-all duration-300 shadow-xl shadow-black/5",
                className
            )}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 relative">
                <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <span className="font-logo-stylish text-xl text-primary-foreground">T</span>
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-logo-stylish text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate"
                            >
                                Tablefy
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:scale-110 transition-transform"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-1">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.link;
                    return (
                        <Link to={item.link} key={index}>
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}

                                <item.icon
                                    size={20}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />

                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="truncate"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && !collapsed && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(250,144,0,0.8)]"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Logout Section */}
            <div className="p-4 border-t border-border/40">
                <button
                    onClick={logout}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group overflow-hidden",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut size={20} className="shrink-0 transition-transform group-hover:rotate-12" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-medium truncate"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
