import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import socket from "../socket";

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

// Initialize user from localStorage to avoid synchronously setting state inside effects
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Emit user online when user logs in
  useEffect(() => {
    if (user && user._id) {
      socket.emit("user_online", user._id);
    }
  }, [user]);

  // Function to refresh user data from server
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const freshUserData = await response.json();
        localStorage.setItem("user", JSON.stringify(freshUserData));
        setUser(freshUserData);
        return freshUserData;
      } else {
        // Token invalid or expired - clear stored auth and user
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
        return null;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
    return null;
  }, [navigate]);

  const login = useCallback(async (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    
    // Emit online status
    if (userData._id) {
      socket.emit("user_online", userData._id);
    }
    // Default role redirects using react-router navigate
    if (userData.role === 'admin') return navigate('/admin');
    if (userData.role === 'mentor') return navigate('/mentor-dashboard');
    if (userData.role === 'learner') return navigate('/learner-dashboard');
    return navigate('/dashboard');
  }, [navigate]);

  const register = useCallback(async (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    
    // Emit online status
    if (userData._id) {
      socket.emit("user_online", userData._id);
    }
    if (userData.role === 'admin') return navigate('/admin');
    if (userData.role === 'mentor') return navigate('/mentor-dashboard');
    if (userData.role === 'learner') return navigate('/learner-dashboard');
    return navigate('/dashboard');
  }, []);

  const logout = useCallback((navigate) => {
    // Emit offline status before logging out
    if (user && user._id) {
      socket.emit("user_offline", user._id);
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    
    if (navigate) {
      navigate("/");
    }
  }, [user]);

  // On mount, try to refresh user if token exists and then clear loading
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const fresh = await refreshUser();
        if (!fresh) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const value = useMemo(() => ({ user, setUser, login, register, logout, loading, refreshUser }), [user, loading, login, register, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
