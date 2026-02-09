import React, { useId } from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = "w-auto h-10", iconOnly = false }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative group shrink-0">
                <div className="relative w-10 h-10 bg-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                    <img
                        src="/logo-v2.png"
                        alt="ChefOS Logo"
                        className="w-full h-full object-contain p-1"
                    />
                </div>
            </div>

            {!iconOnly && (
                <span className="font-logo-stylish text-2xl tracking-tighter bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-primary transition-all duration-300">
                    ChefOS
                </span>
            )}
        </div>
    );
};

export default Logo;
