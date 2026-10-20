import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartqueue_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartqueue_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('smartqueue_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to load user profile', err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartqueue_token', res.data.token);
      localStorage.setItem('smartqueue_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartqueue_token', res.data.token);
      localStorage.setItem('smartqueue_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartqueue_token');
    localStorage.removeItem('smartqueue_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
