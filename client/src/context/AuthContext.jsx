import React, { createContext, useState, useEffect } from "react";
import api from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me"); 
        setUser(res.data.data); 
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};