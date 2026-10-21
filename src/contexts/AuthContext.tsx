/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { client, account } from '../appwriteClient';
import { getTelegramWebApp, getTelegramUser, setupTelegramApp } from '../utils/telegram';

export interface UserProfile {
  $id: string;
  name: string;
  email?: string;
  isTelegram?: boolean;
  isGuest?: boolean;
  photoUrl?: string;
  username?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  isProjectPaused: boolean;
  logout: () => Promise<void>;
  loginAsGuest: (customName?: string) => void;
  loginWithTelegramUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_STORAGE_KEY = 'notecraft_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProjectPaused, setIsProjectPaused] = useState(false);

  useEffect(() => {
    // Initialise Telegram WebApp environment
    setupTelegramApp();

    const checkSession = async () => {
      try {
        // 1. Try Appwrite account session first
        try {
          const session = await account.get();
          if (session) {
            setUser({
              $id: session.$id,
              name: session.name || session.email || 'User',
              email: session.email,
              isTelegram: session.$id.startsWith('tg_'),
            });
            setLoading(false);
            return;
          }
        } catch (err: unknown) {
          const errObj = err as { code?: number; type?: string; message?: string };
          if (errObj?.code === 403 || errObj?.type === 'project_paused' || String(errObj?.message).toLowerCase().includes('paused')) {
            setIsProjectPaused(true);
          } else {
            // Also check client.ping() in case account.get threw 401 unauthenticated
            try {
              await client.ping();
            } catch (pingErr: unknown) {
              const pingObj = pingErr as { code?: number; type?: string; message?: string };
              if (pingObj?.code === 403 || pingObj?.type === 'project_paused' || String(pingObj?.message).toLowerCase().includes('paused')) {
                setIsProjectPaused(true);
              }
            }
          }
        }

        // 2. Check for Telegram WebApp environment
        const tg = getTelegramWebApp();
        const tgUser = getTelegramUser();

        if (tg && tgUser) {
          // In Telegram WebApp!
          if (tg.initData) {
            try {
              const res = await fetch('/api/telegram-webapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.userId && data.secret) {
                  await account.createSession(data.userId, data.secret);
                  const newSession = await account.get();
                  setUser({
                    $id: newSession.$id,
                    name: newSession.name || tgUser.first_name,
                    isTelegram: true,
                    username: tgUser.username,
                    photoUrl: tgUser.photo_url
                  });
                  setLoading(false);
                  return;
                }
              }
            } catch {
              // API endpoint might not be available (e.g. static dev)
            }
          }

          // Direct Telegram WebApp fallback session
          setUser({
            $id: `tg_${tgUser.id}`,
            name: `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
            isTelegram: true,
          });
          setLoading(false);
          return;
        }

        // 3. Check for saved guest user
        const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            setUser(parsed);
            setLoading(false);
            return;
          } catch {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          }
        }

        // No session found
        setUser(null);
      } catch (err) {
        console.error('Session check error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const loginAsGuest = (customName?: string) => {
    const guestUser: UserProfile = {
      $id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: customName || 'Creative Guest',
      isGuest: true,
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const loginWithTelegramUser = () => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      const userObj: UserProfile = {
        $id: `tg_${tgUser.id}`,
        name: `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`,
        username: tgUser.username,
        photoUrl: tgUser.photo_url,
        isTelegram: true,
      };
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(userObj));
      setUser(userObj);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore if no Appwrite session
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isProjectPaused, logout, loginAsGuest, loginWithTelegramUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
