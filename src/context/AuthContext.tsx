import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    organization?: string;
  }) => Promise<User>;
  logout: () => void;
  quickDemoLogin: (role: "volunteer" | "ngo" | "authority") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("rescuechain_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
        } catch {
          localStorage.removeItem("rescuechain_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem("rescuechain_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.auth.register(data);
    localStorage.setItem("rescuechain_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("rescuechain_token");
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (role: "volunteer" | "ngo" | "authority") => {
    const creds = {
      volunteer: { email: "volunteer@rescuechain.org", password: "password123" },
      ngo: { email: "ngo@redcross.org", password: "password123" },
      authority: { email: "authority@disaster.gov", password: "password123" }
    };
    const target = creds[role];
    await login(target.email, target.password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
