import { motion } from "framer-motion";
import { QrCode, ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
    return (
        <section className="relative min-h-[85vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden pt-8 md:pt-12">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
                />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight"
                        >
                            Easy Dining,{" "}
                            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">One Scan Away</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
                        >
                            Transform your restaurant with QR-powered ordering. Customers scan, browse,
                            order, and pay — all from their phone. Zero friction, maximum efficiency.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
                        >
                            <div className="flex flex-col items-center lg:items-start gap-2">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to="/register" className="btn-primary text-lg h-14 px-8 gap-3 group inline-flex items-center justify-center shadow-lg shadow-primary/25 rounded-2xl">
                                        Start Free Trial
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </motion.div>
                                <span className="text-xs text-muted-foreground font-medium">No credit card required</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-lg h-14 px-8 gap-3 inline-flex items-center justify-center border border-border/50 bg-background/50 hover:bg-muted/50 backdrop-blur-sm rounded-2xl transition-all hover:border-border"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Watch Demo
                            </motion.button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex items-center justify-center lg:justify-start gap-8 border-t border-border/30 pt-8"
                        >
                            {[
                                { value: "89+", label: "Restaurants" },
                                { value: "10K+", label: "Orders" },
                                { value: "99.9%", label: "Uptime" },
                            ].map((stat, index) => (
                                <div key={index} className="text-center px-4 first:pl-0 border-r last:border-0 border-border/30">
                                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Content - Phone Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="relative mx-auto max-w-[300px]">
                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-8 -left-8 glass-card p-4 shadow-lg z-10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                                        <span className="text-success text-lg">✓</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Order Received</p>
                                        <p className="text-xs text-muted-foreground">Table 5 • 3 items</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [10, -10, 10] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-4 -right-4 glass-card p-4 shadow-lg z-10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <QrCode className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Scan to Order</p>
                                        <p className="text-xs text-muted-foreground">Instant menu access</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phone Frame */}
                            <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-foreground rounded-b-2xl" />
                                <div className="bg-background rounded-[2.5rem] overflow-hidden">
                                    {/* Phone Screen Content */}
                                    <div className="aspect-[9/19] relative">
                                        {/* Status Bar */}
                                        <div className="flex items-center justify-between px-6 py-3 bg-muted/50">
                                            <span className="text-xs font-medium">9:41</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-2 bg-foreground/30 rounded-sm" />
                                                <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
                                                <div className="w-6 h-3 bg-foreground rounded-sm" />
                                            </div>
                                        </div>

                                        {/* App Content */}
                                        <div className="p-4 space-y-4">
                                            <div className="text-center py-4">
                                                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                                    <QrCode className="w-8 h-8 text-primary" />
                                                </div>
                                                <h3 className="font-display text-xl font-bold italic text-foreground">Table 12</h3>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">The Royal Tandoor</p>
                                            </div>

                                            {/* Menu Preview */}
                                            <div className="space-y-3">
                                                {[
                                                    {
                                                        name: "Chicken Tikka",
                                                        price: "£14.99",
                                                        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&auto=format&fit=crop",
                                                        color: "bg-red-100"
                                                    },
                                                    {
                                                        name: "Lamb Kebab",
                                                        price: "£16.50",
                                                        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&auto=format&fit=crop",
                                                        color: "bg-amber-100"
                                                    },
                                                    {
                                                        name: "Paneer Tikka",
                                                        price: "£12.99",
                                                        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&auto=format&fit=crop",
                                                        color: "bg-orange-100"
                                                    },
                                                ].map((item, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.8 + i * 0.1 }}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl overflow-hidden ${item.color}`}>
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.price}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                            <span className="text-primary-foreground text-lg leading-none">+</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
