import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tm_token');
    const savedUser = localStorage.getItem('tm_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with /api/auth/me
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.data?.user) {
              setUser(res.data.data.user);
              localStorage.setItem('tm_user', JSON.stringify(res.data.data.user));
            }
          })
          .catch(() => {
            // Token expired
            logout();
          })
          .finally(() => setLoading(false));
      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (tenDangNhap, matKhau) => {
    const res = await api.post('/auth/login', { tenDangNhap, matKhau });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.vaiTro === 'Admin',
    isStaff: user?.vaiTro === 'Staff' || user?.vaiTro === 'Admin',
    isSupplier: user?.vaiTro === 'Supplier' || user?.vaiTro === 'Admin',
    isCustomer: user?.vaiTro === 'Customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
