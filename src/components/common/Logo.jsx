import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = "w-auto h-10", iconOnly = false }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative group shrink-0">
                {/* Main Logo Container with Glassmorphism and Depth */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-12 h-12 flex items-center justify-center"
                >
                    {/* Background Orbit Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-[1.5px] border-dashed border-primary/20 dark:border-white/10 rounded-full"
                    />

                    {/* Glowing Pulse Background */}
                    <motion.div
                        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-2 bg-primary/20 rounded-2xl blur-xl"
                    />

                    {/* Main Icon Surface - Enhanced for Dark Mode Visibility */}
                    <div className="relative w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl border-2 border-black/10 dark:border-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
                        {/* Dynamic SVG Icon */}
                        <svg
                            viewBox="0 0 40 40"
                            className="w-7 h-7"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Abstract 'C' for Chef & OS */}
                            <motion.path
                                d="M28 12C26.5 10.5 24.5 9.4 22 9.4C16.4 9.4 11.9 13.9 11.9 19.5C11.9 25.1 16.4 29.6 22 29.6C24.5 29.6 26.5 28.5 28 27"
                                className="stroke-primary dark:stroke-orange-400"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />

                            {/* Central Intelligence Core */}
                            <motion.circle
                                cx="22" cy="19.5" r="2.5"
                                className="fill-primary dark:fill-white"
                                animate={{
                                    opacity: [1, 0.4, 1],
                                    scale: [1, 1.3, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            {/* Digital Accents */}
                            <rect x="29" y="18.5" width="4" height="2" rx="1" className="fill-orange-500/40" />
                            <rect x="27" y="14" width="3" height="1.5" rx="0.75" className="fill-orange-500/20" />
                            <rect x="27" y="24" width="3" height="1.5" rx="0.75" className="fill-orange-500/20" />
                        </svg>
                    </div>

                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                </motion.div>
            </div>

            {!iconOnly && (
                <div className="flex flex-col -space-y-1">
                    <span className="font-logo-stylish text-3xl font-black tracking-tight bg-gradient-to-br from-gray-950 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-400 bg-clip-text text-transparent drop-shadow-sm font-logo-stylish">
                        Chef<span className="text-primary italic">OS</span>
                    </span>
                    <span className="text-[7.5px] font-black uppercase tracking-[0.35em] text-gray-500/80 dark:text-gray-400/80 pl-1">
                        Smart Restaurant OS
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
