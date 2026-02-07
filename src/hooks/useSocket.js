import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const joinRestaurant = (restaurantId) => {
        if (socket) {
            socket.emit('join:restaurant', restaurantId);
        }
    };

    const joinKDS = (restaurantId) => {
        if (socket) {
            socket.emit('join:kds', restaurantId);
        }
    };

    const joinOrder = (orderId) => {
        if (socket) {
            socket.emit('join:order', orderId);
        }
    };

    return {
        socket,
        connected,
        joinRestaurant,
        joinKDS,
        joinOrder,
    };
};
