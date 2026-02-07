import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const emailFromState = location.state?.email || '';
    const otpInputRef = useRef(null);

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpStatus, setOtpStatus] = useState('idle'); // idle, verifying, valid, invalid
    const [showPassword, setShowPassword] = useState(false);

    // Auto-focus the OTP field on mount
    useEffect(() => {
        if (otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, []);

    // Real-time OTP verification
    useEffect(() => {
        const verifyOtp = async () => {
            if (formData.otp.length === 6) {
                setVerifyingOtp(true);
                setOtpStatus('verifying'); // triggers loading spinner
                try {
                    // Check if OTP is correct without resetting password yet
                    await api.post('/auth/verify-otp', { email: formData.email, otp: formData.otp });
                    setOtpStatus('valid');
                } catch (error) {
                    setOtpStatus('invalid');
                } finally {
                    setVerifyingOtp(false);
                }
            } else {
                setOtpStatus('idle');
            }
        };

        const timeoutId = setTimeout(verifyOtp, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [formData.otp, formData.email]);


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (otpStatus !== 'valid') {
            toast.error('Please enter a valid OTP code');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            toast.success('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side ... same as before ... */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                {/* ... (keeping existing visual code) ... */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <div className="relative z-10 max-w-lg text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
                            <KeyRound className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="font-display text-4xl font-bold text-background mb-4">
                            Secure Your Account
                        </h2>
                        <p className="text-background/70 text-lg leading-relaxed mb-8">
                            Create a strong password to keep your restaurant data safe.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-8">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                        <h2 className="font-display text-3xl font-bold mb-2">Set New Password</h2>
                        <p className="text-muted-foreground">Enter the code we sent to {formData.email || 'your email'}.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email - hidden or readonly */}

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium">Transformation Code (PIN)</label>
                            <div className="relative">
                                <input
                                    ref={otpInputRef}
                                    type="text"
                                    name="otp"
                                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none tracking-widest text-center font-mono text-3xl font-bold
                                        ${otpStatus === 'valid' ? 'border-green-500 bg-green-500/5 text-green-600' :
                                            otpStatus === 'invalid' ? 'border-destructive bg-destructive/5 text-destructive' :
                                                'border-border bg-muted/30 focus:border-primary/50'}`}
                                    placeholder="000000"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength={6}
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {otpStatus === 'verifying' && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                                    {otpStatus === 'valid' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                                    {otpStatus === 'invalid' && <XCircle className="w-6 h-6 text-destructive" />}
                                </div>
                            </div>
                            {otpStatus === 'invalid' && (
                                <p className="text-xs text-destructive text-center mt-1 font-medium">Incorrect PIN. Please try again.</p>
                            )}
                            {otpStatus === 'valid' && (
                                <p className="text-xs text-green-600 text-center mt-1 font-medium">PIN Verified!</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none pr-10"
                                    placeholder="Minimum 8 characters"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={otpStatus !== 'valid'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none pr-10"
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={otpStatus !== 'valid'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpStatus !== 'valid'}
                            className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Update Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
