import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const MobileStickyCTA = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show only when scrolled past Hero (approx 600px)
            setIsVisible(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-6 right-6 z-[60] md:hidden"
                >
                    <Link
                        to="/register"
                        className="flex items-center justify-between w-full h-14 px-6 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/40 font-black uppercase tracking-widest text-sm"
                    >
                        <span>Start Free Trial</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] opacity-60">14 Days Free</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
