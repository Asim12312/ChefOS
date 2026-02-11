import { useState } from 'react';

/**
 * LazyImage Component
 * Optimized image loading with blur placeholder and lazy loading
 */
const LazyImage = ({ src, alt, className = '', width, height, priority = false }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setError(true);
    };

    // Fallback placeholder
    const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 400}' height='${height || 300}'%3E%3Crect fill='%23f3f4f6' width='${width || 400}' height='${height || 300}'/%3E%3C/svg%3E`;

    if (error) {
        return (
            <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ width, height }}>
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden">
            {/* Blur placeholder */}
            {!isLoaded && (
                <img
                    src={placeholderSvg}
                    alt=""
                    className={`absolute inset-0 ${className}`}
                    aria-hidden="true"
                />
            )}

            {/* Actual image */}
            <img
                src={src}
                alt={alt}
                className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                loading={priority ? 'eager' : 'lazy'}
                width={width}
                height={height}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
};

export default LazyImage;
