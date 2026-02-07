import { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token, refreshToken } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            toast.success('Login successful!');
            return user;
        } catch (error) {
            throw error;
        }
    };

    const register = async (name, email, password, role = 'OWNER') => {
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                role,
            });
            const { user, token, refreshToken } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            toast.success('Registration successful!');
            return user;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    const checkRestaurantStatus = async () => {
        try {
            const response = await api.get('/restaurant/my-primary');
            return response.data.success && response.data.data !== null;
        } catch (error) {
            // 404 means no restaurant found
            if (error.response?.status === 404) {
                return false;
            }
            console.error('Error checking restaurant status:', error);
            return false;
        }
    };

    const refreshUser = () => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        checkRestaurantStatus,
        refreshUser,
        setUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
