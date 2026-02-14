import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const SafepayCheckout = ({ tracker, checkoutUrl, onSuccess, onError }) => {
    const [status, setStatus] = useState('pending'); // pending, verifying, success, failed
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Check if user is returning from Safepay
        const urlParams = new URLSearchParams(window.location.search);
        const safepayTracker = urlParams.get('tracker');

        if (safepayTracker && safepayTracker === tracker) {
            verifyPayment();
        }
    }, [tracker]);

    const verifyPayment = async () => {
        setVerifying(true);
        setStatus('verifying');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${API_URL}/payments/verify`, {
                paymentId: tracker
            });

            if (response.data.success && response.data.data.status === 'COMPLETED') {
                setStatus('success');
                onSuccess?.(response.data.data);
            } else {
                setStatus('failed');
                onError?.({ message: 'Payment verification failed' });
            }
        } catch (error) {
            setStatus('failed');
            onError?.(error);
        } finally {
            setVerifying(false);
        }
    };

    const handleProceedToPayment = () => {
        window.location.href = checkoutUrl;
    };

    if (status === 'verifying') {
        return (
            <div className="text-center py-12">
                <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Verifying Payment
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we confirm your payment...
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
            >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Your payment has been confirmed successfully.
                </p>
            </motion.div>
        );
    }

    if (status === 'failed') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
            >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    There was an issue processing your payment. Please try again.
                </p>
                <button
                    onClick={handleProceedToPayment}
                    className="btn-primary"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Safepay Secure Checkout
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    You'll be redirected to Safepay's secure payment page to complete your transaction.
                </p>

                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        💳 All Cards
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        📱 JazzCash
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        💰 EasyPaisa
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        🏦 Bank Transfer
                    </span>
                </div>
            </div>

            <button
                onClick={handleProceedToPayment}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4"
            >
                <span>Proceed to Safepay</span>
                <ExternalLink size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Secured by Safepay • PCI-DSS Compliant</span>
            </div>
        </div>
    );
};

export default SafepayCheckout;
