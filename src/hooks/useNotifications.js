import { useState, useEffect } from 'react';
import socket, { registerUser } from '../utils/socket.js';
import { API_BASE_URL } from '../config';

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getToken = () => localStorage.getItem('token');
    const getUserId = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user?.id;
            }
        } catch (err) {
            console.error('Failed to parse user from localStorage', err);
        }
        return null;
    };

    useEffect(() => {
        const token = getToken();
        const userId = getUserId();

        if (!token || !userId) {
            setLoading(false);
            return;
        }


        registerUser(userId);

        // Fetch existing notifications from API
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data?.status === 'success' || data?.success) {
                    setNotifications(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Listen for real-time notifications
        socket.on('new_notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
        });

        return () => {
            socket.off('new_notification');
        };
    }, []);

    const markOneRead = async (id) => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllRead = async () => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return { notifications, unreadCount, loading, markOneRead, markAllRead };
}