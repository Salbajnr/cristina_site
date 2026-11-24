import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase";

const AUTH_QUERY_KEY = ["auth/me"];
export const USER_TOKEN_STORAGE_KEY = "user_token";

interface User {
  id: string;
  email: string;
  name: string;
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(USER_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(USER_TOKEN_STORAGE_KEY);
  }
}

export function useUserAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setStoredToken(session?.access_token ?? null);
      if (event !== "INITIAL_SESSION") {
        void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      }
    });

    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const { data: user = null, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      const token = data.session?.access_token;
      setStoredToken(token ?? null);
      if (!token) {
        return null;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError) {
        await supabase.auth.signOut();
        setStoredToken(null);
        return null;
      }

      const authUser = userData.user;
      if (!authUser?.email) return null;

      return {
        id: authUser.id,
        email: authUser.email,
        name:
          typeof authUser.user_metadata.name === "string" && authUser.user_metadata.name.trim()
            ? authUser.user_metadata.name.trim()
            : authUser.email.split("@")[0],
      };
    },
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      if (!result.user) {
        throw new Error("Supabase did not return a user after registration.");
      }

      return { hasSession: Boolean(result.session) };
    },
    onSuccess: async ({ hasSession }) => {
      if (hasSession) {
        await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        toast({ title: "Success", description: "Account created successfully!" });
      } else {
        setStoredToken(null);
        toast({
          title: "Check your email",
          description: "Confirm your email address before signing in.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      if (!result.session) {
        throw new Error("Supabase did not create a session after signing in.");
      }

      setStoredToken(result.session.access_token);
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast({ title: "Success", description: "Logged in successfully!" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setStoredToken(null);
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      toast({ title: "Signed out", description: "You have been signed out." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getToken = () => localStorage.getItem(USER_TOKEN_STORAGE_KEY);

  return {
    user,
    isLoadingUser,
    isAuthenticated: !!user,
    getToken,
    register: registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isPending,
  };
}
