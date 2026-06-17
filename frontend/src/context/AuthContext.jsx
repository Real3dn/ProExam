import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          const res = await client.get('/auth/me/');
          setUser(res.data);
        } catch (error) {
          console.error("Auth initialization failed", error);
          localStorage.removeItem('tokens');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await client.post('/auth/login/', { username, password });
    localStorage.setItem('tokens', JSON.stringify(res.data));
    const userRes = await client.get('/auth/me/');
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (username, email, password) => {
    const res = await client.post('/auth/register/', { username, email, password });
    localStorage.setItem('tokens', JSON.stringify(res.data.tokens));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tokens');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
