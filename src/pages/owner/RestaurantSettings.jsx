import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    Save, Loader, Store, Clock, Settings, Image as ImageIcon,
    Upload, MapPin, Phone, Globe, Shield, Bell, CheckCircle, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const RestaurantSettings = () => {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const queryClient = useQueryClient();

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    // Fetch Restaurant Data
    const { data: restaurantData, isLoading } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    useEffect(() => {
        if (restaurantData) {
            setRestaurant(restaurantData);
        }
    }, [restaurantData]);

    const updateMutation = useMutation({
        mutationFn: (data) => api.patch(`/restaurant/${restaurantId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurant', restaurantId]);
            toast.success('Settings updated successfully');
        },
        onError: () => {
            toast.error('Failed to update settings');
        }
    });

    const handleSave = () => {
        updateMutation.mutate(restaurant);
    };

    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;

        setRestaurant(prev => {
            if (section) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [name]: finalValue
                    }
                };
            }
            return {
                ...prev,
                [name]: finalValue
            };
        });
    };

    const handleFeatureChange = (feature) => {
        setRestaurant(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const toastId = toast.loading('Uploading...');
        try {
            const res = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setRestaurant(prev => ({ ...prev, [field]: res.data.data.url }));
                toast.success('Upload complete', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'location', label: 'Location & Contact', icon: MapPin },
        { id: 'operations', label: 'Operations', icon: Clock },
        { id: 'security', label: 'Security & Features', icon: Shield },
    ];

    if (isLoading || !restaurant) {
        return (
            <div className="flex bg-background min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Restaurant Settings
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your restaurant profile and configurations
                            </p>
                        </motion.div>

                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="btn-primary flex items-center gap-2"
                        >
                            {updateMutation.isPending ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border mb-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="max-w-4xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'general' && (
                                    <GeneralSettings
                                        restaurant={restaurant}
                                        handleChange={handleChange}
                                        handleFileUpload={handleFileUpload}
                                    />
                                )}
                                {activeTab === 'location' && (
                                    <LocationSettings
                                        restaurant={restaurant}
                                        handleChange={handleChange}
                                    />
                                )}
                                {activeTab === 'operations' && (
                                    <OperationsSettings
                                        restaurant={restaurant}
                                        setRestaurant={setRestaurant}
                                    />
                                )}
                                {activeTab === 'security' && (
                                    <SecuritySettings
                                        restaurant={restaurant}
                                        handleFeatureChange={handleFeatureChange}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const GeneralSettings = ({ restaurant, handleChange, handleFileUpload }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Store size={20} className="text-primary" /> Basic Info
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Restaurant Name</label>
                        <input
                            type="text"
                            name="name"
                            value={restaurant.name || ''}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="e.g. The Gourmet Kitchen"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                        <textarea
                            name="description"
                            value={restaurant.description || ''}
                            onChange={handleChange}
                            className="input w-full min-h-[120px] resize-none"
                            placeholder="Tell your story..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Cuisine Types</label>
                        <input
                            type="text"
                            name="cuisine"
                            value={restaurant.cuisine || ''} // Assuming cuisine field exists or add it
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="e.g. Italian, Mexican, Fusion"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-primary" /> Branding
                </h3>
                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-border overflow-hidden relative group">
                                {restaurant.logo ? (
                                    <img src={restaurant.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                                ) : (
                                    <ImageIcon className="text-muted-foreground/50" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload className="text-white" size={20} />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-2">Recommended size: 512x512px. PNG or JPG.</p>
                                <button className="btn-outline text-xs py-1 h-auto relative">
                                    Upload New Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cover Upload */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Cover Image</label>
                        <div className="h-32 w-full bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-border overflow-hidden relative group">
                            {restaurant.coverImage ? (
                                <img src={restaurant.coverImage} alt="Cover" className="h-full w-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="mx-auto text-muted-foreground/50 mb-1" />
                                    <span className="text-xs text-muted-foreground">No cover image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="text-white" size={24} />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileUpload(e, 'coverImage')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const LocationSettings = ({ restaurant, handleChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary" /> Address
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Street Address</label>
                    <input
                        type="text"
                        name="street"
                        value={restaurant.address?.street || ''}
                        onChange={(e) => handleChange(e, 'address')}
                        className="input w-full"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">City</label>
                        <input
                            type="text"
                            name="city"
                            value={restaurant.address?.city || ''}
                            onChange={(e) => handleChange(e, 'address')}
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">State/Zip</label>
                        <input
                            type="text"
                            name="state" // simplistic for now
                            value={restaurant.address?.state || ''}
                            onChange={(e) => handleChange(e, 'address')}
                            className="input w-full"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Map Link (Optional)</label>
                    <input
                        type="text"
                        name="mapLink"
                        value={restaurant.address?.mapLink || ''}
                        onChange={(e) => handleChange(e, 'address')}
                        className="input w-full"
                        placeholder="https://maps.google.com/..."
                    />
                </div>
            </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Phone size={20} className="text-primary" /> Contact & Social
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        value={restaurant.contact?.phone || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="input w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">WhatsApp (Order Alerts)</label>
                    <input
                        type="text"
                        name="whatsappNumber"
                        value={restaurant.contact?.whatsappNumber || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="input w-full"
                        placeholder="+1234567890"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={restaurant.contact?.email || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="input w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Website</label>
                    <div className="flex items-center gap-2">
                        <Globe size={18} className="text-muted-foreground" />
                        <input
                            type="text"
                            name="website"
                            value={restaurant.contact?.website || ''}
                            onChange={(e) => handleChange(e, 'contact')}
                            className="input w-full"
                            placeholder="www.restaurant.com"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const OperationsSettings = ({ restaurant, setRestaurant }) => {
    // Helper to update working hours
    const handleDayChange = (day, field, value) => {
        setRestaurant(prev => {
            const currentHours = prev.openingHours || {};
            const dayHours = currentHours[day] || { open: '09:00', close: '22:00', closed: false };

            return {
                ...prev,
                openingHours: {
                    ...currentHours,
                    [day]: { ...dayHours, [field]: value }
                }
            };
        });
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="grid grid-cols-1 gap-8">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-primary" /> Business Hours
                </h3>
                <div className="space-y-4">
                    {days.map(day => {
                        const hours = restaurant.openingHours?.[day] || { open: '09:00', close: '22:00', closed: false };
                        return (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                                <span className="font-medium w-32">{day}</span>

                                <div className="flex items-center gap-4 flex-1">
                                    {!hours.closed ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Open</span>
                                                <input
                                                    type="time"
                                                    value={hours.open}
                                                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                                                    className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <span className="text-muted-foreground">-</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Close</span>
                                                <input
                                                    type="time"
                                                    value={hours.close}
                                                    onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                                                    className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-red-500 font-medium text-sm flex-1 text-center sm:text-left">Closed</span>
                                    )}
                                </div>

                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hours.closed}
                                        onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                                        className="hidden"
                                    />
                                    <div className={`px-3 py-1 rounded text-xs font-bold transition-colors ${hours.closed ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                        {hours.closed ? 'Closed' : 'Open'}
                                    </div>
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SecuritySettings = ({ restaurant, handleFeatureChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-primary" /> Feature Management
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
                Enable or disable specific capabilities for your restaurant.
            </p>

            <div className="space-y-4">
                {[
                    { key: 'orderingEnabled', label: 'QR Code Ordering', desc: 'Allow customers to order via QR codes' },
                    { key: 'voiceOrderingEnabled', label: 'Voice AI Ordering', desc: 'Enable automated voice order taking' },
                    { key: 'onlinePaymentsEnabled', label: 'Accept Online Payments', desc: 'Process payments via Stripe/PayPal' },
                    { key: 'reviewsEnabled', label: 'Customer Reviews', desc: 'Show review section on public menu' },
                ].map((feature) => (
                    <div key={feature.key} className="flex items-start justify-between p-4 bg-muted/20 rounded-lg">
                        <div>
                            <p className="font-bold text-sm">{feature.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={restaurant.features?.[feature.key] || false}
                                onChange={() => handleFeatureChange(feature.key)}
                            />
                            <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield size={20} className="text-primary" /> Data & Privacy
            </h3>
            <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="text-sm font-bold text-yellow-600 mb-1">Make Restaurant Private</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        Hides your restaurant from public search results. Direct links will still work.
                    </p>
                    <button className="btn-outline text-xs w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10">
                        Toggle Privacy
                    </button>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h4 className="text-sm font-bold text-red-500 mb-1">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        Permanently delete your restaurant and all associated data.
                    </p>
                    <button className="btn-outline text-xs w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500">
                        Delete Restaurant
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default RestaurantSettings;
