import { useState } from "react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { useListPosts, useCreatePost, useDeletePost } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Plus, Trash2, Image, Video, FileText, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const postTypes = [
  { value: "text", label: "Text", icon: FileText },
  { value: "photo", label: "Photo", icon: Image },
  { value: "video", label: "Video", icon: Video },
];

export default function CreatorPosts() {
  const { data: posts, isLoading } = useListPosts();
  const { mutate: createPost, isPending: isCreating } = useCreatePost();
  const { mutate: deletePost } = useDeletePost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "text", title: "", body: "", mediaUrl: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim()) {
      toast({ title: "Post body is required", variant: "destructive" });
      return;
    }
    createPost(
      {
        data: {
          type: form.type as any,
          title: form.title || undefined,
          body: form.body,
          mediaUrl: form.mediaUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          setForm({ type: "text", title: "", body: "", mediaUrl: "" });
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ["listPosts"] });
          toast({ title: "Post published to feed" });
        },
        onError: () => toast({ title: "Failed to create post", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this post and all its comments?")) return;
    deletePost(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listPosts"] });
          toast({ title: "Post deleted" });
        },
      }
    );
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight">Free Feed Posts</h1>
            <p className="text-muted-foreground mt-1">Publish free content to tease and engage your audience.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Post"}
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Post Type</Label>
                  <div className="flex gap-2">
                    {postTypes.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: value }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                          form.type === value
                            ? "border-primary bg-primary/15 text-primary font-medium"
                            : "border-border/50 hover:border-primary/30 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">Title <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Give this post a title..."
                    className="border-border/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="body" className="text-xs">Text Content <span className="text-primary">*</span></Label>
                  <Textarea
                    id="body"
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder={
                      form.type === "text"
                        ? "What's on your mind? Say something to your fans..."
                        : form.type === "photo"
                        ? "Add a caption for this photo..."
                        : "Add a caption or description for this video..."
                    }
                    rows={4}
                    className="border-border/50 resize-none"
                  />
                </div>

                {(form.type === "photo" || form.type === "video") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="mediaUrl" className="text-xs">
                      {form.type === "photo" ? "Photo URL" : "Video URL"}
                      <span className="text-primary ml-1">*</span>
                    </Label>
                    <Input
                      id="mediaUrl"
                      value={form.mediaUrl}
                      onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                      placeholder={form.type === "photo" ? "https://..." : "https://..."}
                      className="border-border/50"
                    />
                  </div>
                )}

                <Button type="submit" disabled={isCreating} className="w-full bg-primary hover:bg-primary/90">
                  {isCreating ? "Publishing..." : "Publish to Feed"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Posts ({posts?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed border-border/50">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No posts yet</p>
                <p className="text-sm mt-1">Publish your first free post to start engaging fans.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-start gap-4 p-4 border border-border/40 rounded-xl bg-background hover:bg-white/3 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      post.type === "photo" ? "bg-blue-500/15" : post.type === "video" ? "bg-purple-500/15" : "bg-primary/15"
                    }`}>
                      {post.type === "photo" ? (
                        <Image className="w-4 h-4 text-blue-400" />
                      ) : post.type === "video" ? (
                        <Video className="w-4 h-4 text-purple-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.title && <span className="font-medium text-sm text-foreground">{post.title}</span>}
                        <Badge variant="outline" className="text-xs capitalize border-border/40">
                          {post.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(post.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{post.body}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
