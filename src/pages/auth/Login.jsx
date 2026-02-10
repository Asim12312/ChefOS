import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ArrowRight, CheckCircle2, Star, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../../components/common/Logo';
import ThemeToggle from '../../components/common/ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, checkRestaurantStatus, user: authUser } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useState(() => {
        if (authUser) {
            if (authUser.role === 'OWNER') {
                navigate('/dashboard');
            } else {
                navigate('/orders');
            }
        }
    }, [authUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await login(email, password);
            if (user.role === 'OWNER') {
                const hasRestaurant = await checkRestaurantStatus();
                navigate(hasRestaurant ? '/dashboard' : '/onboarding');
            } else if (user.permissions?.includes('orders')) {
                navigate('/orders');
            } else if (user.permissions && user.permissions.length > 0) {
                // Redirect to first allowed permission
                const firstPerm = user.permissions[0];
                const routeMap = {
                    'dashboard': '/dashboard',
                    'tables': '/tables',
                    'menu': '/menu',
                    'inventory': '/inventory',
                    'staff': '/staff',
                    'analytics': '/analytics',
                    'reviews': '/reviews',
                    'service': '/service',
                    'complaints': '/complaints',
                    'settings': '/settings'
                };
                navigate(routeMap[firstPerm] || '/dashboard');
            } else if (user.role === 'CHEF') {
                navigate('/orders');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Visual & Social Proof (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />

                {/* Gradient Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
                />

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Link to="/" className="group mb-12 block">
                            <Logo className="w-auto h-12" />
                        </Link>

                        <h2 className="font-display text-4xl font-bold text-background mb-6 leading-tight">
                            Manage Your Restaurant <br />
                            <span className="text-primary italic">Like a Pro</span>
                        </h2>

                        <p className="text-background/70 text-lg leading-relaxed mb-8">
                            Join 89+ restaurants using ChefOS to <span className="text-primary font-semibold">streamline operations, cut costs, and delight customers</span> with easy ordering.
                        </p>

                        <div className="bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-background/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center text-background font-semibold">
                                    RK
                                </div>
                                <div>
                                    <p className="text-background font-semibold">Rajesh Kumar</p>
                                    <p className="text-background/60 text-sm">Owner, The Curry House</p>
                                </div>
                            </div>
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                ))}
                            </div>
                            <p className="text-background/80 italic">
                                "Honestly, I was not sure at first but ChefOS made our weekends so much smoother. The digital menu just works and customers actually enjoy using it!"
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md">
                    {/* Logo - Centered for Mobile */}
                    <div className="flex justify-center lg:hidden mb-10">
                        <Logo className="w-auto h-12" />
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <h2 className="font-display text-3xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-muted-foreground">Join 89+ restaurants growing with ChefOS.</p>
                        </div>
                        <ThemeToggle className="theme-toggle-container" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="name@restaurant.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Password</label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-foreground hover:text-primary transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
