import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  full_name: string;
  mobile_number: string;
  role: string;
  status: string;
  is_first_login: boolean;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  login: (mobile_number: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isLoadingConvex: boolean;
  isAuthenticatedConvex: boolean;
  fetchAccessToken: (args: { forceRefresh: boolean }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let activeRefreshPromise: Promise<string | null> | null = null;

const CONVEX_SITE_URL = (import.meta as any).env?.VITE_CONVEX_SITE_URL || "https://usable-stork-789.convex.site";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("dashboard_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("dashboard_refresh_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("dashboard_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial validation / loading complete
    setIsLoading(false);
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

      if (data.user.role !== "admin") {
        return { error: "Access denied. Admin access only." };
      }

      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      localStorage.setItem("dashboard_token", data.token);
      localStorage.setItem("dashboard_refresh_token", data.refreshToken);
      localStorage.setItem("dashboard_user", JSON.stringify(data.user));

      return {};
    } catch (e: any) {
      return { error: e.message || "Failed to connect to authentication server." };
    }
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("dashboard_token");
    localStorage.removeItem("dashboard_refresh_token");
    localStorage.removeItem("dashboard_user");
  };

  // Convex-compatible useAuth implementation
  const fetchAccessToken = async ({ forceRefresh }: { forceRefresh: boolean }): Promise<string | null> => {
    const currentRefreshToken = refreshToken || localStorage.getItem("dashboard_refresh_token");
    if (!currentRefreshToken) return null;

    const currentToken = token || localStorage.getItem("dashboard_token");

    // Decode current token to check expiration (in seconds)
    let isExpired = false;
    if (currentToken && currentToken.split(".").length === 3) {
      try {
        const payloadBase64 = currentToken.split(".")[1];
        // Apply proper base64 padding to prevent browser atob error
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
        // Refresh 1 minute before actual expiry
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
          const res = await fetch(`${CONVEX_SITE_URL}/api/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          const data = await res.json();
          if (res.ok && data.token && data.refreshToken) {
            setToken(data.token);
            setRefreshToken(data.refreshToken);
            localStorage.setItem("dashboard_token", data.token);
            localStorage.setItem("dashboard_refresh_token", data.refreshToken);
            return data.token;
          } else {
            // Refresh token expired or rotated, log out
            logout();
            return null;
          }
        } catch (e) {
          return currentToken; // fallback to existing token if network fails
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
        login,
        logout,
        isLoadingConvex: isLoading,
        isAuthenticatedConvex: !!token,
        fetchAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useDashboardAuth must be used within an AuthProvider");
  }
  return context;
}

export function useConvexAuth() {
  const { isLoadingConvex, isAuthenticatedConvex, fetchAccessToken } = useDashboardAuth();
  
  const fetchToken = React.useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return fetchAccessToken({ forceRefresh: forceRefreshToken });
    },
    [fetchAccessToken]
  );

  return React.useCallback(() => {
    return {
      isLoading: isLoadingConvex,
      isAuthenticated: isAuthenticatedConvex,
      fetchAccessToken: fetchToken,
    };
  }, [isLoadingConvex, isAuthenticatedConvex, fetchToken]);
}
