import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const SubscriptionSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (sessionId) {
            // Trigger confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            // Countdown to redirect
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/subscription');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(interval);
                clearInterval(timer);
            };
        } else {
            navigate('/subscription');
        }
    }, [sessionId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-card border-4 border-emerald-500/20 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-emerald-500/5 -z-10" />

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-xl shadow-emerald-500/20"
                >
                    <CheckCircle size={48} strokeWidth={3} />
                </motion.div>

                <h1 className="text-3xl font-black uppercase italic tracking-tight mb-4">Payment Successful!</h1>
                <p className="text-muted-foreground font-medium mb-8">
                    Your subscription has been upgraded to <span className="text-primary font-bold">Premium</span>. You now have full access to all features.
                </p>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => navigate('/subscription')}
                        className="btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                    >
                        Go to Dashboard
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>

                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" />
                        Redirecting in {countdown} seconds...
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SubscriptionSuccess;
