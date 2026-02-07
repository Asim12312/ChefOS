import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/ui/animated-section";
import { QrCode, Smartphone, Utensils, CreditCard, CheckCircle } from "lucide-react";

const steps = [
    {
        icon: QrCode,
        step: "01",
        title: "Scan QR Code",
        description: "Customers scan the unique QR code at their table using their smartphone camera.",
    },
    {
        icon: Smartphone,
        step: "02",
        title: "Browse & Order",
        description: "View the full menu with photos, select items, customize, and send order to kitchen.",
    },
    {
        icon: Utensils,
        step: "03",
        title: "Enjoy Your Meal",
        description: "Kitchen receives the order instantly. Staff is notified and prepares your food.",
    },
    {
        icon: CreditCard,
        step: "04",
        title: "Simple Payment",
        description: "Request bill, pay online or cash, leave a review, and you're done!",
    },
];

export const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="section-padding bg-foreground text-background relative overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-20">
                    <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
                        How It Works
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Simple Steps to{" "}
                        <span className="text-primary">Better Service</span>
                    </h2>
                    <p className="text-background/70 text-lg max-w-2xl mx-auto">
                        From the moment your guests sit down to when they leave satisfied,
                        Tablefy handles everything smoothly.
                    </p>
                </AnimatedSection>

                {/* Steps */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                        {steps.map((step, index) => (
                            <AnimatedSection key={index} delay={index * 0.15}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="relative group"
                                >
                                    {/* Step Number */}
                                    <div className="absolute -top-4 left-0 font-display text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                                        {step.step}
                                    </div>

                                    <div className="relative pt-8">
                                        {/* Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                                            <step.icon className="w-8 h-8 text-primary-foreground" />
                                        </div>

                                        <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                                        <p className="text-background/60 leading-relaxed">{step.description}</p>
                                    </div>
                                </motion.div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>

                {/* Bottom Visual */}
                <AnimatedSection delay={0.5} className="mt-20">
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-background/5 backdrop-blur-sm border border-background/10 rounded-3xl p-8 md:p-12"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-display text-2xl md:text-3xl font-semibold mb-4">
                                    Ready to Transform Your Restaurant?
                                </h3>
                                <p className="text-background/60 mb-6">
                                    Join 89+ restaurants already using Tablefy to delight their customers
                                    and streamline operations.
                                </p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                    {[
                                        "No hardware needed",
                                        "Setup in 10 minutes",
                                        "Free 14-day trial",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                            <span className="text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary text-lg px-10 py-4"
                            >
                                Start Free Trial
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatedSection>
            </div>
        </section>
    );
};
