import React, { useState, useEffect } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = ({ className = "" }) => {
    const { theme, setTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);

    // Click Outside to Close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMenu && !event.target.closest('.theme-toggle-container')) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    return (
        <div className={`relative theme-toggle-container ${className}`}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 text-muted-foreground hover:text-foreground transition-colors relative rounded-full hover:bg-muted/50 border border-border/50 bg-background/50 backdrop-blur-sm"
                title="Toggle theme"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute top-2.5 left-2.5 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-36 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 p-1"
                    >
                        {[
                            { name: 'light', icon: Sun, label: 'Light' },
                            { name: 'dark', icon: Moon, label: 'Dark' },
                            { name: 'system', icon: Laptop, label: 'System' },
                        ].map((t) => (
                            <button
                                key={t.name}
                                onClick={() => { setTheme(t.name); setShowMenu(false); }}
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${theme === t.name ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                <t.icon size={14} />
                                {t.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeToggle;
