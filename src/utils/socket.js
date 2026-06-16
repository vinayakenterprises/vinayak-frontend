import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const socket = io(API_BASE_URL, {
    autoConnect: true,
    withCredentials: true,
});

export const registerUser = (userId) => {
    if (!userId) return;

    if (socket.connected) {
        socket.emit('register', userId);
        console.log('✅ Registered immediately');
    } else {
        socket.once('connect', () => {
            socket.emit('register', userId);
            console.log('✅ Registered after connect');
        });
    }
};

export default socket;