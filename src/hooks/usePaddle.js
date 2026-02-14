// Deprecated: Paddle integration removed.
export const usePaddle = () => {
    return {
        paddle: null,
        openCheckout: () => console.warn('Paddle checkout is disabled. Using manual billing.')
    };
};
