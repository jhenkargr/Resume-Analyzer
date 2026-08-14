import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ra_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.users.me()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('ra_user', JSON.stringify(res.user));
          }
        })
        .catch((err) => {
          console.warn('Session expired or invalid:', err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res?.token && res?.user) {
      setAuthToken(res.token);
      setUser(res.user);
      localStorage.setItem('ra_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (fullName, email, password) => {
    const res = await api.auth.register(fullName, email, password);
    // After register, automatically log them in
    if (res) {
      await login(email, password);
    }
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('ra_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
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
