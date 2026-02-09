import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, CreditCard, MessageCircle, X, BarChart3, Table, Store, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePaddle } from '../../hooks/usePaddle';
import { cn } from '../../lib/utils';
import Sidebar from '../../components/dashboard/Sidebar';

const BASE_PRICE = 25;
const PADDLE_PRICE_ID = import.meta.env.VITE_PADDLE_PREMIUM_PRICE_ID;
const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

const Subscription = () => {
    const { user } = useAuth();
    const { openCheckout } = usePaddle();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

    const subscription = user?.restaurant?.subscription;
    const isPremium = subscription?.plan === 'PREMIUM';
    const premiumUntil = subscription?.premiumUntil;

    // Calculate days remaining
    const daysRemaining = premiumUntil ? Math.max(0, Math.ceil((new Date(premiumUntil) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const formattedDate = premiumUntil ? new Date(premiumUntil).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : 'N/A';

    const handleUpgrade = () => {
        if (!PADDLE_TOKEN || !PADDLE_PRICE_ID) {
            setShowPendingModal(true);
            return;
        }

        openCheckout(PADDLE_PRICE_ID, {
            restaurantId: user?.restaurant?._id || user?.restaurant,
            email: user?.email
        });
    };

    const features = [
        { name: "Unlimited Tables & Menus", premium: true, icon: Table },
        { name: "Chef AI Assistant", premium: true, icon: Sparkles },
        { name: "Live Ordering System", premium: true, icon: Zap },
        { name: "Advanced Analytics", premium: true, icon: BarChart3 },
        { name: "Inventory Engine", premium: true, icon: Store },
        { name: "Service Request Hub", premium: true, icon: MessageSquare },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:pl-0 overflow-x-hidden">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl font-black tracking-tight mb-2 italic uppercase">Billing & Plan</h1>
                            <p className="text-muted-foreground font-medium">Powering your kitchen with professional-grade tools.</p>
                        </motion.div>

                        {isPremium && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border-2 border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-4"
                            >
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Subscription Life</div>
                                    <div className="text-xl font-black text-emerald-500">{daysRemaining} Days Left</div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                                    <ShieldCheck size={24} strokeWidth={2.5} />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Status Column */}
                        <div className="xl:col-span-4 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "relative overflow-hidden rounded-[2.5rem] border-4 p-8 shadow-2xl transition-all duration-500",
                                    isPremium
                                        ? "border-primary bg-card/50 backdrop-blur-xl"
                                        : "border-border bg-card"
                                )}
                            >
                                {isPremium && (
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Sparkles size={80} className="text-primary" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Current Tier</h3>

                                    <div className="flex items-center gap-5 mb-8">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300",
                                            isPremium ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isPremium ? <Sparkles size={32} strokeWidth={2.5} /> : <Zap size={32} />}
                                        </div>
                                        <div>
                                            <div className="text-3xl font-black tracking-tighter truncate">{isPremium ? 'PREMIUM' : 'FREE'}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full animate-pulse",
                                                    isPremium ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-orange-500"
                                                )} />
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                    {isPremium ? 'Active Plan' : 'Limited Access'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-border/50 mb-8">
                                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/30 group hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Renewal Date</span>
                                            <span className="text-sm font-bold text-foreground">{formattedDate}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/30 group hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Billed</span>
                                            <span className="text-sm font-bold text-foreground">{isPremium ? '$25.00' : '$0.00'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {isPremium ? (
                                            <button className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-3 group shadow-xl shadow-primary/20">
                                                <CreditCard size={18} />
                                                Manage Billing
                                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleUpgrade}
                                                className="btn-primary w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-3 group shadow-xl shadow-primary/20"
                                            >
                                                Unlock Everything
                                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                            </button>
                                        )}
                                        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Secured by Paddle Billing</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Business Insight Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:scale-[1.02]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 translate-x-4">
                                    <BarChart3 size={120} className="text-primary" strokeWidth={1} />
                                </div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-3">Kitchen Metric</h4>
                                    <p className="text-2xl font-black text-foreground mb-4 leading-tight italic">AI RESTAURANTS SEE 30% FASTER TURNOVER</p>
                                    <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed italic">"Premium users get priority access to our upcoming QR Payment update next month."</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Features Column */}
                        <div className="xl:col-span-8 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-card border-4 border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tighter mb-2 italic uppercase">Premium Perks Dashboard</h3>
                                            <p className="text-muted-foreground font-medium text-sm">Professional tools configured for your restaurant.</p>
                                        </div>
                                        {isPremium && (
                                            <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                                                <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active</div>
                                                <div className="px-4 py-2 text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest">History</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {features.map((feature, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5 }}
                                                className={cn(
                                                    "flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all group",
                                                    isPremium
                                                        ? "bg-muted/10 border-border/50 hover:border-primary/40 hover:bg-card shadow-sm"
                                                        : "bg-muted/5 border-dashed border-border/30 opacity-60"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                                                    isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <feature.icon size={26} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            isPremium ? "text-primary" : "text-muted-foreground underline decoration-1"
                                                        )}>
                                                            {feature.name}
                                                        </span>
                                                        {isPremium && <Check size={12} className="text-emerald-500" strokeWidth={3} />}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {isPremium ? 'FULLY CONFIGURED' : 'PRO VERSION REQUIRED'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {!isPremium && !PADDLE_TOKEN && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            className="mt-12 p-8 rounded-[2.5rem] bg-card border-4 border-dashed border-primary/20 text-center relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-primary/5 -z-10 animate-pulse" />
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
                                                <MessageCircle size={32} strokeWidth={2.5} />
                                            </div>
                                            <h4 className="text-2xl font-black italic uppercase mb-2">Manual Activation Available</h4>
                                            <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                                                Our payment gateway is currently under review by Paddle. We can enable premium features for your restaurant manually today!
                                            </p>
                                            <a
                                                href="mailto:support@chefos.com"
                                                className="btn-primary inline-flex items-center gap-3 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 group"
                                            >
                                                Contact Support
                                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                            </a>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Paddle Pending Modal */}
            <AnimatePresence>
                {showPendingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPendingModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-xl bg-card border-4 border-border rounded-[3rem] p-10 md:p-14 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles size={160} className="text-primary" />
                            </div>

                            <button
                                onClick={() => setShowPendingModal(false)}
                                className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground active:scale-95"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-10 shadow-inner group">
                                    <Sparkles size={48} className="animate-pulse" strokeWidth={2} />
                                </div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tight mb-4">Activation Pending</h2>
                                <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
                                    Our automated payment gateway is currently being reviewed by Paddle.
                                    We're working hard to get this live for your market!
                                </p>

                                <div className="w-full space-y-4">
                                    <div className="p-6 rounded-[2rem] bg-muted/20 border-2 border-border/50 text-left flex items-start gap-5 group transition-colors hover:border-primary/30">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                            <ShieldCheck size={24} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black uppercase tracking-widest mb-1.5">Business Verification Queue</div>
                                            <div className="text-sm text-muted-foreground font-medium leading-relaxed">Your restaurant profile is currently in the queue for final identity review by Paddle.</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                        <button
                                            onClick={() => setShowPendingModal(false)}
                                            className="h-16 rounded-2xl bg-muted/50 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-muted transition-all active:scale-95"
                                        >
                                            Dismiss Notice
                                        </button>
                                        <a
                                            href="mailto:support@chefos.com?subject=Premium%20Upgrade%20Request"
                                            className="h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                                        >
                                            <MessageCircle size={18} strokeWidth={3} />
                                            Request Fast-Track
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Subscription;
