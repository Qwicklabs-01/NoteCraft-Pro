/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../appwriteClient';
import type { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  setUser: React.Dispatch<React.SetStateAction<Models.User<Models.Preferences> | null>>;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await account.get();
        setUser(session);
        return; // Already logged in
      } catch (err) {
        setUser(null);
      }

      // Check for Telegram WebApp Auto-Login
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initData) {
        try {
          // Send the initData to our custom Vercel backend
          const response = await fetch('/api/telegram-webapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Create a session in Appwrite using the custom token secret
            await account.createSession(data.userId, data.secret);
            // Re-fetch the user session
            const newSession = await account.get();
            setUser(newSession);
          }
        } catch (tgError) {
          console.error("Telegram Auto-Login Failed", tgError);
        }
      }

      setLoading(false);
    };
    
    checkSession();
  }, []);

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

