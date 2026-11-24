import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetContent, useListContent } from "@workspace/api-client-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Lock, Heart, MessageCircle, Share, Star, Send } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";
import { formatDate } from "@/lib/format";
import { useLike } from "@/hooks/use-like";
import { useToast } from "@/hooks/use-toast";
import { fetchSupabaseApi } from "@/lib/supabase-api";

export default function ContentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { getToken } = useUserAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commenterName, setCommenterName] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const { data: content, isLoading, isError, queryKey: contentQueryKey } = useGetContent(id);
  const {
    data: comments,
    isLoading: isLoadingComments,
    isError: isCommentsError,
  } = useQuery<Array<{ id: number; authorName: string; body: string; createdAt: string }>>({
    queryKey: ["content-comments", id],
    queryFn: async () => {
      const response = await fetchSupabaseApi(`/content/${id}/comments`);
      if (!response.ok) throw new Error("Unable to load comments.");
      return response.json();
    },
    enabled: showComments && id > 0,
    refetchInterval: showComments ? 30_000 : false,
  });
  const addComment = useMutation({
    mutationFn: async () => {
      const response = await fetchSupabaseApi(`/content/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: commenterName.trim(), body: commentBody.trim() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Unable to post your comment.");
      }
      return response.json();
    },
    onSuccess: async () => {
      setCommentBody("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["content-comments", id] }),
        queryClient.invalidateQueries({ queryKey: contentQueryKey }),
      ]);
      toast({ title: "Comment posted" });
    },
    onError: (error) => toast({
      title: "Unable to post comment",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    }),
  });
  const {
    count: likeCount,
    isLiked,
    isLoading: isLoadingLikes,
    isUpdating: isUpdatingLike,
    toggleLike,
  } = useLike("content", id, content?.likeCount ?? 0);

  const { data: relatedContent } = useListContent(
    content?.categoryId ? { categoryId: content?.categoryId } : undefined
  );

  // Check if user has purchased this content
  const { data: userPurchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return [];

      const res = await fetchSupabaseApi("/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!getToken(),
  });

  const { data: activeSubscriptions = [] } = useQuery({
    queryKey: ["subscriptions/me"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return [];

      const response = await fetchSupabaseApi("/subscriptions/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Unable to verify your subscription.");
      }
      return response.json() as Promise<Array<{ status: string }>>;
    },
    enabled: !!getToken(),
    refetchInterval: 30_000,
  });

  const hasPurchased = userPurchases.some((p: any) => p.contentId === id && p.status === "completed");
  const hasActiveSubscription = activeSubscriptions.some((subscription) =>
    ["active", "trialing"].includes(subscription.status),
  );
  const isLocked = content?.isLocked && !hasPurchased && !hasActiveSubscription;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif">Content not found</h2>
          <Button onClick={() => setLocation("/")} variant="outline">Return Home</Button>
        </div>
      </div>
    );
  }

  const getPreviewImage = (id: number) => {
    if (content?.previewUrl) return content.previewUrl;
    const index = (id % 6) + 1;
    return `/preview-${index}.png`;
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <Sidebar />
      
      <main className="flex-1 max-w-3xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="font-serif font-medium truncate max-w-[200px] md:max-w-md">
            {content?.title || "Post"}
          </div>
          <span className="w-10" aria-hidden="true" />
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="aspect-[4/5] md:aspect-square w-full rounded-2xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : content ? (
          <article className="animate-in fade-in duration-500">
            {/* Main Media Area */}
            <div className="relative aspect-[4/5] md:aspect-square bg-black overflow-hidden w-full">
              <img 
                src={getPreviewImage(content.id)} 
                alt={content.title}
                className={`w-full h-full object-cover ${isLocked ? "blur-md brightness-50 scale-105" : ""}`}
              />
              
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40">
                  <div className="bg-background/80 backdrop-blur-xl p-6 rounded-full border border-primary/30 mb-6 shadow-[0_0_40px_rgba(153,27,84,0.4)]">
                    <Lock className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-white mb-2">Private Content</h2>
                  <p className="text-white/80 mb-8 max-w-sm">
                    This post is locked. Subscribe or purchase to reveal the full content.
                  </p>
                  
                  <Link to={`/checkout?contentId=${content.id}`}>
                    <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-lg px-12 shadow-[0_0_20px_rgba(153,27,84,0.5)]">
                      Unlock for ${content.price.toFixed(2)}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-4 text-foreground">
                <button
                  type="button"
                  onClick={toggleLike}
                  disabled={isLoadingLikes || isUpdatingLike}
                  aria-label={isLiked ? "Unlike content" : "Like content"}
                  aria-pressed={isLiked}
                  className={`flex items-center gap-2 transition-colors disabled:opacity-50 ${
                    isLiked ? "text-primary" : "hover:text-primary"
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
                  <span className="font-medium">{likeCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowComments((shown) => !shown)}
                  aria-expanded={showComments}
                  aria-label={showComments ? "Hide comments" : "Show comments"}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{Math.max(content.commentCount, comments?.length ?? 0)}</span>
                </button>
              </div>
              <button
                type="button"
                aria-label="Copy content link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied" });
                  } catch {
                    toast({
                      title: "Unable to copy link",
                      description: "Your browser did not allow access to the clipboard.",
                      variant: "destructive",
                    });
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground leading-snug">
                  {content.title}
                </h1>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(content.createdAt)}
                </span>
              </div>

              {content.description && (
                <p className="text-foreground/90 font-light text-lg leading-relaxed whitespace-pre-wrap">
                  {isLocked ? (
                    <span className="blur-sm select-none">
                      {content.description.padEnd(200, ' ').substring(0, 150)}...
                    </span>
                  ) : (
                    content.description
                  )}
                </p>
              )}

              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {content.tags.map(tag => (
                    <span key={tag} className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {showComments && (
              <section className="px-4 md:px-6 pb-6" aria-label="Comments">
                <h2 className="font-serif text-lg font-medium mb-4">Comments</h2>
                {isLoadingComments ? (
                  <Skeleton className="h-10 w-full" />
                ) : isCommentsError ? (
                  <p className="text-sm text-destructive">Comments could not be loaded. Please try again.</p>
                ) : comments?.length ? (
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <article key={comment.id} className="rounded-xl bg-white/5 px-3 py-2">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-sm font-semibold">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.body}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">Be the first to comment.</p>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (commenterName.trim() && commentBody.trim()) addComment.mutate();
                  }}
                  className="space-y-2"
                >
                  <Input
                    value={commenterName}
                    onChange={(event) => setCommenterName(event.target.value)}
                    maxLength={100}
                    placeholder="Your name"
                    aria-label="Your name"
                  />
                  <div className="flex gap-2">
                    <Textarea
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      maxLength={2000}
                      rows={2}
                      placeholder="Leave a comment..."
                      aria-label="Leave a comment"
                      className="resize-none flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={addComment.isPending || !commenterName.trim() || !commentBody.trim()}
                      aria-label="Post comment"
                      className="self-end shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </section>
            )}
          </article>
        ) : null}

        {/* Related Content */}
        {relatedContent && relatedContent.length > 1 && (
          <div className="px-4 md:px-6 py-8 border-t border-border/50 mt-8">
            <h3 className="font-serif text-xl font-medium text-foreground mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" /> More like this
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedContent
                .filter(item => item.id !== id)
                .slice(0, 3)
                .map(item => (
                  <ContentCard key={item.id} content={item} />
                ))
              }
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
