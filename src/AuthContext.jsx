import React, { createContext, useContext, useState } from 'react';
import { api } from './services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { token, user } = await api.login(credentials);
      api.setToken(token);
      setUser(user);
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { token, user } = await api.register(userData);
      api.setToken(token);
      setUser(user);
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (data) => {
    setLoading(true);
    try {
      return await api.requestOtp(data);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      return await api.verifyOtp(email, otp);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (data) => {
    setLoading(true);
    try {
      const { token, user } = await api.completeSignup(data);
      api.setToken(token);
      setUser(user);
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem('nexus_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, requestOtp, verifyOtp, completeSignup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
