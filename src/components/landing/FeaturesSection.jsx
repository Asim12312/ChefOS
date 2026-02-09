import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import {
    QrCode,
    ShoppingBag,
    CreditCard,
    MessageSquare,
    Bell,
    Star,
    BarChart3,
    Clock,
    Package,
    Users
} from "lucide-react";

const customerFeatures = [
    {
        icon: QrCode,
        title: "Scan & Go",
        description: "Simply scan the QR code at your table to instantly access the digital menu on your phone.",
    },
    {
        icon: ShoppingBag,
        title: "Easy Ordering",
        description: "Browse beautiful menu items with photos and videos, customize your order, and send to the kitchen.",
    },
    {
        icon: CreditCard,
        title: "Flexible Payment",
        description: "Pay online or request cash payment. Split bills easily with your dining companions.",
    },
    {
        icon: MessageSquare,
        title: "AI Assistant",
        description: "Get instant help with menu recommendations, dietary info, and allergen questions.",
    },
    {
        icon: Bell,
        title: "Request Service",
        description: "Need your bill? One tap alerts your server immediately with a sound notification.",
    },
    {
        icon: Star,
        title: "Rate & Review",
        description: "Share your experience and help restaurants improve with instant feedback.",
    },
];

const adminFeatures = [
    {
        icon: BarChart3,
        title: "Real-time Analytics",
        description: "Track best-sellers, peak hours, and revenue with beautiful visual dashboards.",
    },
    {
        icon: Clock,
        title: "Table Management",
        description: "Monitor table occupancy with live timers. Know exactly when tables are ready.",
    },
    {
        icon: Package,
        title: "Inventory Control",
        description: "Manage stock levels, get low inventory alerts, and never oversell items.",
    },
    {
        icon: Users,
        title: "Staff Coordination",
        description: "Assign tables, manage shifts, and coordinate kitchen orders with ease.",
    },
];

export const FeaturesSection = () => {
    return (
        <section id="features" className="section-padding relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3 sm:mb-4">
                        Features
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                        Everything You Need to{" "}
                        <span className="text-gradient">Elevate Dining</span>
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                        A complete solution for modern restaurants. From customer ordering to backend management,
                        we've got every aspect covered.
                    </p>
                </AnimatedSection>

                {/* Customer Features */}
                <div className="mb-20 sm:mb-28 lg:mb-32">
                    <AnimatedSection delay={0.1} className="mb-10 sm:mb-14 lg:mb-16 text-center">
                        <h3 className="font-display text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 leading-tight">
                            For Your Guests
                        </h3>
                        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                            Empower your customers with a seamless self-service experience that drives satisfaction.
                        </p>
                    </AnimatedSection>

                    {/* Mobile/Tablet: Carousel | Desktop: Grid */}
                    <div className="lg:hidden relative -mx-4 sm:-mx-6">
                        <div
                            className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory
                                     flex gap-4 sm:gap-6 px-4 sm:px-6 pb-4
                                     scroll-smooth"
                        >
                            {customerFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                                    className="snap-center snap-always flex-none
                                             w-[80vw] sm:w-[42vw]
                                             min-w-0 group relative p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:bg-white/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                            <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                                        </div>
                                        <h4 className="font-display text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-foreground leading-snug">{feature.title}</h4>
                                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop: Grid */}
                    <StaggerContainer className="hidden lg:grid grid-cols-3 gap-8">
                        {customerFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <motion.div
                                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                                    className="group relative p-8 h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:bg-white/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                            <feature.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <h4 className="font-display text-xl font-bold mb-3 text-foreground leading-snug">{feature.title}</h4>
                                        <p className="text-muted-foreground leading-relaxed text-base">{feature.description}</p>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>

                {/* Admin Features */}
                <div>
                    <AnimatedSection delay={0.1} className="mb-10 sm:mb-14 lg:mb-16 text-center">
                        <h3 className="font-display text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 leading-tight">
                            For Your Team
                        </h3>
                        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                            Powerful tools to streamline operations, reduce errors, and boost efficiency.
                        </p>
                    </AnimatedSection>

                    {/* Mobile/Tablet: Carousel | Desktop: Grid */}
                    <div className="lg:hidden relative -mx-4 sm:-mx-6">
                        <div
                            className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory
                                     flex gap-4 sm:gap-6 px-4 sm:px-6 pb-4
                                     scroll-smooth"
                        >
                            {adminFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5, transition: { duration: 0.3 } }}
                                    className="snap-center snap-always flex-none
                                             w-[80vw] sm:w-[42vw]
                                             min-w-0 p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-accent/20 transition-all text-center group"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:bg-accent/20 transition-colors">
                                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                                    </div>
                                    <h4 className="font-display text-base sm:text-lg font-bold mb-2 text-foreground leading-snug">{feature.title}</h4>
                                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop: Grid */}
                    <StaggerContainer className="hidden lg:grid grid-cols-4 gap-6">
                        {adminFeatures.map((feature, index) => (
                            <StaggerItem key={index}>
                                <motion.div
                                    whileHover={{ y: -5, transition: { duration: 0.3 } }}
                                    className="p-6 h-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-accent/20 transition-all text-center group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent/20 transition-colors">
                                        <feature.icon className="w-6 h-6 text-accent" />
                                    </div>
                                    <h4 className="font-display text-lg font-bold mb-2 text-foreground leading-snug">{feature.title}</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </div>


        </section>
    );
};
