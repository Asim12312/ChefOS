import { motion } from "framer-motion";
import { QrCode, Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Facebook } from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";

const footerLinks = {
    product: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Demo", href: "#" },
        { name: "API", href: "#" },
    ],
    company: [
        { name: "About", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
    ],
    resources: [
        { name: "Documentation", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Guides", href: "#" },
        { name: "Case Studies", href: "#" },
    ],
    legal: [
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "Cookies", href: "#" },
    ],
};

const socialLinks = [
    { icon: Twitter, href: "#" },
    { icon: Instagram, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Facebook, href: "#" },
];

export const Footer = ({ onOpenContactModal }) => {
    return (
        <footer id="contact" className="bg-foreground text-background relative overflow-hidden">
            {/* CTA Section */}
            <div className="border-b border-background/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
                    <AnimatedSection className="text-center">
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-background/60 text-lg max-w-xl mx-auto mb-8">
                            Transform your restaurant experience today. Start your free 14-day trial
                            with no credit card required.
                        </p>
                        <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link to="/register" className="btn-primary text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center whitespace-nowrap">
                                    Start Free Trial
                                </Link>
                            </motion.div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onOpenContactModal}
                                className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl border border-background/20 text-sm sm:text-base hover:bg-background/5 transition-colors inline-flex items-center justify-center whitespace-nowrap"
                            >
                                Contact Sales
                            </motion.button>
                        </div>
                    </AnimatedSection>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link to="/" className="mb-6 block group">
                            <Logo className="w-auto h-12" />
                        </Link>
                        <p className="text-background/60 mb-6 max-w-xs">
                            Transforming the way restaurants serve and engage with their customers.
                        </p>
                        <div className="space-y-3 text-sm text-background/60">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>chefosteam@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-semibold mb-4 capitalize">{category}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            className="text-background/60 hover:text-primary transition-colors text-sm"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-background/10">
                    <p className="text-background/40 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} ChefOS. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social, index) => (
                            <motion.a
                                key={index}
                                href={social.href}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                            >
                                <social.icon className="w-4 h-4" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
