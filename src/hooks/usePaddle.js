import { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';

export const usePaddle = () => {
    const [paddle, setPaddle] = useState(null);

    useEffect(() => {
        const init = async () => {
            const paddleInstance = await initializePaddle({
                environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox',
                token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
            });

            if (paddleInstance) {
                setPaddle(paddleInstance);
            }
        };

        init();
    }, []);

    const openCheckout = (priceId, customData = {}) => {
        if (!paddle) return;

        paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customData,
            settings: {
                displayMode: 'overlay',
                theme: 'dark',
                locale: 'en',
            },
        });
    };

    return { paddle, openCheckout };
};
