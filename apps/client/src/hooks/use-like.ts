import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetContentQueryKey,
  getListContentQueryKey,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { USER_TOKEN_STORAGE_KEY } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export type LikeTargetType = "content" | "post";

interface LikeState {
  count: number;
  isLiked: boolean;
}

async function readLikeState(type: LikeTargetType, id: number): Promise<LikeState> {
  const token = localStorage.getItem(USER_TOKEN_STORAGE_KEY);
  const response = await fetch(`${API_URL}/likes/${type}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("Unable to load likes.");
  }

  return response.json();
}

export function useLike(type: LikeTargetType, id: number, fallbackCount = 0) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["likes", type, id];
  const likeQuery = useQuery({
    queryKey,
    queryFn: () => readLikeState(type, id),
    enabled: Number.isSafeInteger(id) && id > 0,
    refetchInterval: 30_000,
  });
  const likeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      const token = localStorage.getItem(USER_TOKEN_STORAGE_KEY);
      if (!token) {
        throw new Error("Sign in to like content.");
      }

      const response = await fetch(`${API_URL}/likes/${type}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liked }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Unable to update your like.");
      }

      return (await response.json()) as LikeState;
    },
    onSuccess: async (state) => {
      queryClient.setQueryData(queryKey, state);
      if (type === "content") {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListContentQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey(id) }),
        ]);
      } else {
        await queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      }
    },
    onError: (error) => {
      toast({
        title: "Unable to update like",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    count: likeQuery.data?.count ?? fallbackCount,
    isLiked: likeQuery.data?.isLiked ?? false,
    isLoading: likeQuery.isLoading,
    error: likeQuery.error,
    toggleLike: () => likeMutation.mutate(!likeQuery.data?.isLiked),
    isUpdating: likeMutation.isPending,
    mutationError: likeMutation.error,
    clearMutationError: likeMutation.reset,
  };
}
