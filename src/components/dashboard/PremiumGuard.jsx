import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PremiumGuard = ({ children, featureName, description, isLocked, compact }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use explicit isLocked prop if provided, otherwise fallback to subscription check
    const locked = isLocked !== undefined ? isLocked : user?.restaurant?.subscription?.plan !== 'PREMIUM';

    if (!locked) {
        return children;
    }

    if (compact) {
        return (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-0" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 bg-card/90 border border-border shadow-2xl p-6 rounded-2xl text-center max-w-[280px]"
                >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-3">
                        <Lock size={20} />
                    </div>
                    <h4 className="text-sm font-bold mb-1">{featureName || 'Premium Feature'}</h4>
                    <p className="text-[10px] text-muted-foreground mb-4">Upgrade to unlock this insight</p>
                    <button
                        onClick={() => navigate('/subscription')}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Sparkles size={12} />
                        Upgrade
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative group overflow-hidden rounded-3xl border border-border/50 bg-card p-8 md:p-12 text-center min-h-[450px] flex flex-col items-center justify-center shadow-sm">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-md"
            >
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
                    <Lock size={36} />
                </div>

                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 flex items-center justify-center gap-3">
                    <Sparkles size={24} className="text-primary animate-pulse" />
                    {featureName || 'Premium Feature'}
                </h2>

                <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                    {description || `Unlock advanced capabilities and professional tools with our Premium Kitchen Operating System.`}
                </p>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => navigate('/subscription')}
                        className="btn-primary w-full max-w-sm py-4 h-auto gap-3 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                        Upgrade to Premium
                        <ArrowRight size={20} />
                    </button>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 border-r border-border pr-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            14-day free trial
                        </span>
                        <span>Cancel anytime</span>
                    </div>
                </div>
            </motion.div>

            {/* Subtle background icons/preview elements */}
            <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                <Sparkles size={120} />
            </div>
        </div>
    );
};

export default PremiumGuard;
