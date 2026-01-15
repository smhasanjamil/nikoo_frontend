// src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getCookie, setCookie, deleteCookie } from "./cookie-utils";

export type User = {
  id: string;
  name: string;
  email: string;
} | null;

interface AuthContextType {
  user: User;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = getCookie("auth_token");
    const savedUser = getCookie("user_data");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved auth data", error);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setCookie("auth_token", authToken, 30);
    setCookie("user_data", JSON.stringify(userData), 30);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    deleteCookie("auth_token");
    deleteCookie("user_data");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};