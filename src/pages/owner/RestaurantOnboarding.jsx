import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, ArrowRight, Loader, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RestaurantOnboarding = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
        },
        contact: {
            phone: '',
            email: '',
            whatsappNumber: ''
        },
        cuisine: '',
    });

    const handleChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/restaurant', formData);
            if (res.data.success) {
                const restaurantId = res.data.data._id;

                // Update user in localStorage with restaurant reference
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, restaurant: restaurantId };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Refresh user in context
                refreshUser();

                toast.success('Welcome to Tablefy! Your restaurant is ready.');
                // Navigate to dashboard after a brief delay
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error(error.response?.data?.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setUploadingLogo(true);
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        try {
            const res = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setFormData(prev => ({ ...prev, logo: res.data.data.url }));
                toast.success('Logo uploaded successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold mb-2 grad-text">Launch Your Digital Restaurant</h1>
                    <p className="text-dim">Just a few steps to set up your premium dining experience.</p>
                </div>

                <div className="card-premium relative">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div
                            className="h-full bg-grad-premium"
                            initial={{ width: '33.33%' }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Store className="text-primary" /> Basic Information
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="label-premium">Restaurant Name</label>
                                            <input
                                                required
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. The Grand Bistro"
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Restaurant Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                className="input min-h-[100px]"
                                                placeholder="Tell customers about your restaurant..."
                                                required
                                            />
                                        </div>

                                        {/* Logo Upload */}
                                        <div>
                                            <label className="label">Restaurant Logo (Optional)</label>
                                            <div className="flex flex-col gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        className="hidden"
                                                        id="logo-upload"
                                                        disabled={uploadingLogo}
                                                    />
                                                    <label
                                                        htmlFor="logo-upload"
                                                        className={`btn btn-outline w-full cursor-pointer ${uploadingLogo ? 'opacity-50' : ''}`}
                                                    >
                                                        {uploadingLogo ? (
                                                            <>
                                                                <Loader className="animate-spin" size={18} />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Store size={18} />
                                                                Choose Logo
                                                            </>
                                                        )}
                                                    </label>
                                                </div>

                                                {formData.logo && (
                                                    <div className="p-3 bg-white/5 rounded-lg flex items-center gap-3">
                                                        <img
                                                            src={formData.logo}
                                                            alt="Logo preview"
                                                            className="h-16 w-16 object-contain rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">Logo uploaded ✓</p>
                                                            <p className="text-xs text-dim">Click to change</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="btn-premium btn-premium-primary w-full"
                                    >
                                        Next Component <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <MapPin className="text-primary" /> Location Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="label-premium">Street Address</label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.address.street}
                                                onChange={(e) => handleChange(e, 'address')}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.address.city}
                                                onChange={(e) => handleChange(e, 'address')}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">Zip Code</label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={formData.address.zipCode}
                                                onChange={(e) => handleChange(e, 'address')}
                                                className="input-premium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="btn-premium btn-premium-secondary flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="btn-premium btn-premium-primary flex-1"
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Phone className="text-primary" /> Contact Channels
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="label-premium">Business Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.contact.phone}
                                                onChange={(e) => handleChange(e, 'contact')}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">Business Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.contact.email}
                                                onChange={(e) => handleChange(e, 'contact')}
                                                className="input-premium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="btn-premium btn-premium-secondary flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn-premium btn-premium-primary flex-1"
                                        >
                                            {loading ? <Loader className="animate-spin" /> : 'Launch Now'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </motion.div>

            <style jsx>{`
                .grad-text {
                    background: var(--grad-premium);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
};

export default RestaurantOnboarding;
