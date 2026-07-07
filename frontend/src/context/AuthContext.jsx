import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Point axios at the deployed backend in production, fall back to local dev server.
// VITE_API_URL must be set in Vercel's Environment Variables (build-time), e.g.
// VITE_API_URL=https://codealphaminisocialmedia-production.up.railway.app
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set default auth header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user data on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        // Clear invalid session
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Register action
  const register = async (username, password, displayName) => {
    try {
      const res = await axios.post('/api/auth/register', { username, password, displayName });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed. Please try again.'
      };
    }
  };

  // Login action
  const login = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid username or password.'
      };
    }
  };

  // Logout action
  const logout = () => {
    setToken('');
    setUser(null);
  };

  // Update profile in state
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};