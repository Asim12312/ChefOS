import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NetworkStatus Component
 * Detects slow/offline network and shows toast notification
 */
const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSlow, setIsSlow] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
        };

        // Check connection speed using Network Information API
        const checkConnectionSpeed = () => {
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

                if (connection) {
                    // effectiveType: 'slow-2g', '2g', '3g', '4g'
                    const slowTypes = ['slow-2g', '2g'];
                    const isSlow = slowTypes.includes(connection.effectiveType);

                    setIsSlow(isSlow);
                    if (isSlow && isOnline) {
                        setShowNotification(true);
                        setTimeout(() => setShowNotification(false), 5000);
                    }

                    connection.addEventListener('change', checkConnectionSpeed);
                }
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        checkConnectionSpeed();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                connection?.removeEventListener('change', checkConnectionSpeed);
            }
        };
    }, [isOnline]);

    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-4 right-4 z-[9999] max-w-sm"
                >
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border ${isOnline
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                        {isOnline ? (
                            <Wifi className="w-5 h-5" />
                        ) : (
                            <WifiOff className="w-5 h-5" />
                        )}
                        <div>
                            <p className="font-semibold text-sm">
                                {isOnline ? 'Slow Connection' : 'No Internet Connection'}
                            </p>
                            <p className="text-xs opacity-80">
                                {isOnline
                                    ? 'You are on a slow network. Some features may load slowly.'
                                    : 'Please check your internet connection and try again.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NetworkStatus;
