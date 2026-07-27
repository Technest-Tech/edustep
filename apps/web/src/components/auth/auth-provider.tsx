"use client";

import { apiClient, ApiError, getCsrfCookie } from "@/lib/api/client";
import type { ApiItem, User } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

type LoginCredentials = {
  email: string;
  password: string;
  remember?: boolean;
};

type LoginResult =
  | { status: "authenticated"; user: User }
  | {
      status: "two_factor_required";
      challenge_expires_at: string;
    };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  completeTwoFactor: (code: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user = null, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await apiClient<ApiItem<User>>("/api/v1/auth/me");
        return response.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  async function login(credentials: LoginCredentials) {
    await getCsrfCookie();
    const response = await apiClient<
      ApiItem<User | { requires_two_factor: true; challenge_expires_at: string }>
    >("/api/v1/auth/login", {
      method: "POST",
      json: credentials,
    });

    if ("requires_two_factor" in response.data) {
      return {
        status: "two_factor_required" as const,
        challenge_expires_at: response.data.challenge_expires_at,
      };
    }

    queryClient.setQueryData(["auth", "user"], response.data);

    return { status: "authenticated" as const, user: response.data };
  }

  async function completeTwoFactor(code: string) {
    const response = await apiClient<ApiItem<User>>(
      "/api/v1/auth/two-factor-challenge",
      {
        method: "POST",
        json: { code },
      },
    );
    queryClient.setQueryData(["auth", "user"], response.data);

    return response.data;
  }

  async function logout() {
    await apiClient("/api/v1/auth/logout", { method: "POST" });
    queryClient.setQueryData(["auth", "user"], null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, completeTwoFactor, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
