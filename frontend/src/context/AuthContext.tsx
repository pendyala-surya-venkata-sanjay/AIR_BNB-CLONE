"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { api, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (payload: Record<string, any>) => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const currentUser = await api.auth.getMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user profile on startup", err);
      // Remove invalid token if fetch fails due to expired credentials
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (payload: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await api.auth.login(payload);
      setUser(response.user);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: Record<string, any>) => {
    setLoading(true);
    try {
      await api.auth.register(payload);
      // Log in automatically after registration
      const response = await api.auth.login({
        email: payload.email,
        password: payload.password,
      });
      setUser(response.user);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
