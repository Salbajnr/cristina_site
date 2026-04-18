import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListPosts,
  useListComments,
  useCreateComment,
  useGetProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Heart, Play, Send, Rss } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

function CommentSection({ postId }: { postId: number }) {
  const { data: comments, isLoading } = useListComments(postId);
  const { mutate: addComment, isPending } = useCreateComment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    addComment(
      { id: postId, data: { authorName: name.trim(), body: body.trim() } },
      {
        onSuccess: () => {
          setBody("");
          queryClient.invalidateQueries({ queryKey: ["listComments", postId] });
          toast({ title: "Comment posted" });
        },
      }
    );
  };

  return (
    <div className="border-t border-border/30 pt-4 mt-4 space-y-4">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {c.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">Be the first to comment</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="bg-white/5 border-border/30 focus:border-primary/50 text-sm"
        />
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment..."
            rows={2}
            className="bg-white/5 border-border/30 focus:border-primary/50 text-sm resize-none flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !name.trim() || !body.trim()}
            className="bg-primary hover:bg-primary/90 text-white self-end h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const { data: profile } = useGetProfile();
  const { data: comments } = useListComments(post.id);

  const isPhoto = post.type === "photo";
  const isVideo = post.type === "video";

  return (
    <article className="bg-white/3 border border-border/40 rounded-2xl overflow-hidden hover:border-border/70 transition-colors">
      {/* Post header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="w-10 h-10 border-2 border-primary/20 shrink-0">
          <AvatarImage src={profile?.avatarUrl || "/avatar.jpg"} className="object-cover" />
          <AvatarFallback>CL</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground">{profile?.displayName || "Cristina Lucero"}</p>
          <p className="text-xs text-muted-foreground">@{profile?.username || "cristinalucero"} · {formatDate(post.createdAt)}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-white/10 text-muted-foreground px-2.5 py-1 rounded-full border border-white/10 capitalize">
            {post.type === "text" ? "Post" : post.type}
          </span>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <div className="px-4 pb-2">
          <h3 className="font-serif text-lg font-medium text-foreground">{post.title}</h3>
        </div>
      )}

      {/* Media */}
      {isPhoto && post.mediaUrl && (
        <div className="mx-0 mb-3 overflow-hidden">
          <img
            src={post.mediaUrl}
            alt={post.title || "Photo"}
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      )}

      {isVideo && post.mediaUrl && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-black aspect-video relative group">
          <video
            src={post.mediaUrl}
            controls
            className="w-full h-full object-cover"
            poster={undefined}
          />
        </div>
      )}

      {/* Body text */}
      <div className="px-4 pb-4">
        <p className="text-foreground/85 leading-relaxed whitespace-pre-line text-[15px]">{post.body}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-4 border-t border-border/20 pt-3">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm group">
          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments?.length ?? 0} {comments?.length === 1 ? "comment" : "comments"}</span>
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="px-4 pb-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </article>
  );
}

export default function Feed() {
  const { data: posts, isLoading } = useListPosts();

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-3xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                <Rss className="w-7 h-7 text-primary" />
                Free Feed
              </h1>
              <p className="text-muted-foreground text-sm">
                Cristina's public posts — free teasers, thoughts, and behind-the-scenes moments.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border/40 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Rss className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium text-foreground">No posts yet</p>
              <p className="text-sm mt-1">Check back soon — Cristina posts here regularly.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
