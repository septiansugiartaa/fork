import React, { createContext, useState, useEffect } from "react";
import api from "../config/api";
import { AUTH_STORAGE_EVENT, getAuthToken } from "../utils/authStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const syncUserFromSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoadingAuth(false);
        return;
      }
      try {
        const res = await api.get("/auth/me"); 
        setUser(res.data.data); 
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    const handleAuthChange = () => {
      setLoadingAuth(true);
      syncUserFromSession();
    };

    syncUserFromSession();
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(AUTH_STORAGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(AUTH_STORAGE_EVENT, handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
