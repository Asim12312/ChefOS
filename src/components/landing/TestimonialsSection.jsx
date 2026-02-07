import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { AnimatedSection } from "../ui/animated-section";

const testimonials = [
    {
        name: "Rajesh Kumar",
        role: "Owner, The Curry House (London)",
        content: "Honestly, I was not sure at first but Tablefy made our weekends so much smoother. The digital menu just works and customers actually enjoy using it!",
        rating: 5,
        image: "RK",
    },
    {
        name: "Aisha Ahmed",
        role: "Manager, Spice Village (Dubai)",
        content: "The analytics dashboard alone is worth it. We now know exactly what's selling and can optimize our menu accordingly.",
        rating: 5,
        image: "AA",
    },
    {
        name: "Vikram Singh",
        role: "Owner, Tandoori Nights (Berlin)",
        content: "Setup took 15 minutes. Our staff adapted instantly, and customers compliment us on how modern our ordering system is.",
        rating: 5,
        image: "VS",
    },
];

export const TestimonialsSection = () => {
    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-16">
                    <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">
                        Testimonials
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Loved by{" "}
                        <span className="text-gradient">Restaurant Owners</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our customers have to say.
                    </p>
                </AnimatedSection>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <AnimatedSection key={index} delay={index * 0.15}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                className="glass-card-hover p-8 h-full flex flex-col"
                            >
                                {/* Quote Icon */}
                                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                                {/* Content */}
                                <p className="text-foreground/80 leading-relaxed flex-1 mb-6">
                                    "{testimonial.content}"
                                </p>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                        {testimonial.image}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatedSection>
                    ))}
                </div>

                {/* Social Proof */}
                <AnimatedSection delay={0.5} className="mt-16">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-3">
                                {["JD", "AK", "MS", "LP"].map((initials, i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                                    >
                                        {initials}
                                    </div>
                                ))}
                            </div>
                            <span className="text-muted-foreground ml-2">89+ restaurants already onboard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                                ))}
                            </div>
                            <span className="font-semibold">4.9/5</span>
                            <span className="text-muted-foreground">from 200+ reviews</span>
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
};
