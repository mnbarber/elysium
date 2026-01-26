import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    console.log('AuthContext initializing, token exists:', !!token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      console.log('No token found, setting loading to false');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && error.response?.data?.error === 'Token expired') {
          console.log('Token expired, logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const fetchUser = async () => {
    console.log('Fetching user data with token');
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      console.log('User data received:', response.data);
      setUser(response.data);
      localStorage.setItem('userId', response.data._id);
    } catch (error) {
      console.error('Error fetching user:', error.response?.status, error.response?.data);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      console.log('Registration response:', response.data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};