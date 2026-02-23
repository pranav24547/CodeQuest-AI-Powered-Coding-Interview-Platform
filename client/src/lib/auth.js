'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('codequest_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await api.getMe();
            setUser(data.user);
        } catch (error) {
            localStorage.removeItem('codequest_token');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        localStorage.setItem('codequest_token', data.token);
        setUser(data.user);
        return data;
    };

    const register = async (username, email, password) => {
        const data = await api.register(username, email, password);
        localStorage.setItem('codequest_token', data.token);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('codequest_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
