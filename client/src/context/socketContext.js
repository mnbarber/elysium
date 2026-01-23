import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        const newSocket = io(API_URL, {
            auth: {
                token
            }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('user-online', (userId) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
        });

        newSocket.on('user-offline', (userId) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.delete(userId);
                return updated;
            });
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};