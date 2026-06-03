import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  full_name: string;
  mobile_number: string;
  role: string;
  status: string;
  is_first_login: boolean;
  onboardingComplete?: boolean;
  screeningComplete?: boolean;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  login: (mobile_number: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  fetchAccessToken: (args: { forceRefresh: boolean }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let activeRefreshPromise: Promise<string | null> | null = null;

const CONVEX_SITE_URL = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || "https://usable-stork-789.convex.site";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refs always hold the latest values — avoids stale-closure in async fetchAccessToken
  const tokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const isLoggingOutRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);

  useEffect(() => {
    async function loadStorage() {
      try {
        const savedToken = await SecureStore.getItemAsync("mobile_token");
        const savedRefreshToken = await SecureStore.getItemAsync("mobile_refresh_token");
        const savedUserStr = await SecureStore.getItemAsync("mobile_user");

        if (savedToken && savedUserStr) {
          setToken(savedToken);
          tokenRef.current = savedToken;
          if (savedRefreshToken) {
            setRefreshToken(savedRefreshToken);
            refreshTokenRef.current = savedRefreshToken;
          }
          setUser(JSON.parse(savedUserStr));
        } else {
          // Clean up inconsistent storage state
          if (savedToken || savedRefreshToken || savedUserStr) {
            await SecureStore.deleteItemAsync("mobile_token").catch(() => { });
            await SecureStore.deleteItemAsync("mobile_refresh_token").catch(() => { });
            await SecureStore.deleteItemAsync("mobile_user").catch(() => { });
          }
        }
      } catch (e) {
        console.error("Failed to load secure store", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorage();
  }, []);

  const login = async (mobile_number: string, password: string) => {
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return { error: data.error || "Login failed" };
      }

      tokenRef.current = data.token;
      refreshTokenRef.current = data.refreshToken;
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      await SecureStore.setItemAsync("mobile_token", data.token);
      await SecureStore.setItemAsync("mobile_refresh_token", data.refreshToken);
      await SecureStore.setItemAsync("mobile_user", JSON.stringify(data.user));

      return {};
    } catch (e: any) {
      return { error: e.message || "Network request failed" };
    }
  };

  const logout = async () => {
    // Mark logging out FIRST so any concurrent fetchAccessToken returns null
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    // Cancel any in-flight refresh
    activeRefreshPromise = null;
    // Immediately clear refs so stale closures can't read old tokens
    tokenRef.current = null;
    refreshTokenRef.current = null;
    // Clear state
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    // Clear storage
    try {
      await SecureStore.deleteItemAsync("mobile_token");
      await SecureStore.deleteItemAsync("mobile_refresh_token");
      await SecureStore.deleteItemAsync("mobile_user");
    } finally {
      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await SecureStore.setItemAsync("mobile_user", JSON.stringify(updatedUser));
  };

  const fetchAccessToken = async ({ forceRefresh }: { forceRefresh: boolean }): Promise<string | null> => {
    // If logging out, refuse all token requests immediately
    if (isLoggingOutRef.current) return null;

    // Read from refs (always current, not stale closures)
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentRefreshToken) return null;

    const currentToken = tokenRef.current;

    let isExpired = false;
    if (currentToken) {
      try {
        const payloadBase64 = currentToken.split(".")[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
        const decoded = JSON.parse(
          decodeURIComponent(
            atob(paddedBase64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        );
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp - 60 < now) {
          isExpired = true;
        }
      } catch (e) {
        isExpired = true;
      }
    } else {
      isExpired = true;
    }

    if (isExpired || forceRefresh) {
      if (activeRefreshPromise) {
        return activeRefreshPromise;
      }

      activeRefreshPromise = (async () => {
        try {
          // Double-check we're not logging out before making the network call
          if (isLoggingOutRef.current) return null;

          const res = await fetch(`${CONVEX_SITE_URL}/api/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          const data = await res.json();

          // If we started logging out while the request was in flight, discard result
          if (isLoggingOutRef.current) return null;

          if (res.ok && data.token && data.refreshToken) {
            tokenRef.current = data.token;
            refreshTokenRef.current = data.refreshToken;
            setToken(data.token);
            setRefreshToken(data.refreshToken);
            await SecureStore.setItemAsync("mobile_token", data.token);
            await SecureStore.setItemAsync("mobile_refresh_token", data.refreshToken);
            return data.token;
          } else {
            await logout();
            return null;
          }
        } catch (e) {
          return currentToken; // return stale token on connection error
        } finally {
          activeRefreshPromise = null;
        }
      })();

      return activeRefreshPromise;
    }

    return currentToken;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        user,
        isLoading,
        isLoggingOut,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        fetchAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
}
