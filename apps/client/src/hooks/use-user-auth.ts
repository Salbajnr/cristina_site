import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "./use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface User {
  id: number;
  email: string;
  name: string;
}

interface LoginResponse {
  id: number;
  email: string;
  name: string;
  token: string;
}

export function useUserAuth() {
  const { toast } = useToast();

  // Get token from localStorage
  const getToken = () => localStorage.getItem("user_token");
  const setToken = (token: string) => localStorage.setItem("user_token", token);
  const clearToken = () => localStorage.removeItem("user_token");

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["auth/me"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        clearToken();
        return null;
      }

      return res.json();
    },
    enabled: !!getToken(),
  });

  // Register
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Registration failed");
      }

      return res.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      setToken(data.token);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }

      return res.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      setToken(data.token);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    clearToken();
  };

  const isAuthenticated = !!getToken();

  return {
    user,
    isLoadingUser,
    isAuthenticated,
    getToken,
    register: registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    logout,
  };
}
