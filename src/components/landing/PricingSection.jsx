import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";

const plans = [
    {
        name: "Starter",
        price: "49",
        description: "Perfect for small cafes and food trucks",
        features: [
            "Up to 5 tables",
            "Basic menu management",
            "QR code generation",
            "Order notifications",
            "Email support",
        ],
        highlighted: false,
    },
    {
        name: "Professional",
        price: "99",
        description: "Ideal for growing restaurants",
        features: [
            "Up to 25 tables",
            "Advanced menu with photos",
            "AI chatbot assistant",
            "Real-time analytics",
            "Staff management",
            "Table reservations",
            "Priority support",
        ],
        highlighted: true,
    },
    {
        name: "Enterprise",
        price: "249",
        description: "For restaurant chains and large venues",
        features: [
            "Unlimited tables",
            "Multi-location support",
            "Custom branding",
            "API access",
            "Advanced reporting",
            "Dedicated account manager",
            "24/7 phone support",
            "Custom integrations",
        ],
        highlighted: false,
    },
];

export const PricingSection = () => {
    return (
        <section id="pricing" className="section-padding relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-16">
                    <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
                        Pricing
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Simple, Transparent{" "}
                        <span className="text-gradient">Pricing</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose the plan that fits your restaurant. All plans include a 14-day free trial.
                    </p>
                </AnimatedSection>

                {/* Pricing Cards */}
                <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                className={`relative h-full rounded-3xl p-8 transition-all duration-300 ${plan.highlighted
                                    ? "bg-foreground text-background shadow-2xl scale-105"
                                    : "glass-card"
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                            <Sparkles className="w-4 h-4" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="font-display text-2xl font-semibold mb-2">{plan.name}</h3>
                                    <p className={`text-sm ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl md:text-5xl font-bold">£{plan.price}</span>
                                        <span className={`${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                                            /month
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? "bg-primary" : "bg-primary/10"
                                                }`}>
                                                <Check className={`w-3 h-3 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                                            </div>
                                            <span className={`text-sm ${plan.highlighted ? "text-background/80" : "text-muted-foreground"}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <button
                                        className={`w-full h-12 rounded-xl font-medium transition-all ${plan.highlighted
                                            ? "btn-primary"
                                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                            }`}
                                    >
                                        Get Started
                                    </button>
                                </motion.div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* FAQ Link */}
                <AnimatedSection delay={0.4} className="text-center mt-12">
                    <p className="text-muted-foreground">
                        Have questions?{" "}
                        <a href="#contact" className="text-primary hover:underline font-medium">
                            Contact our sales team
                        </a>
                    </p>
                </AnimatedSection>
            </div>
        </section>
    );
};
