import { useParams, Link, useLocation } from "wouter";
import { useGetContent, useListContent } from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, Heart, MessageCircle, Share, Star } from "lucide-react";
import { ContentCard } from "@/components/content/ContentCard";
import { formatDate } from "@/lib/format";

export default function ContentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  
  const { data: content, isLoading, isError } = useGetContent(id);

  const { data: relatedContent } = useListContent(
    content?.categoryId ? { categoryId: content?.categoryId } : undefined
  );

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

  const isLocked = content?.isLocked;
  const getPreviewImage = (id: number) => {
    if (!isLocked && content?.previewUrl) return content.previewUrl;
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
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontalIcon className="w-5 h-5" />
          </Button>
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
                  
                  <Link href="/checkout">
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
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Heart className="w-6 h-6" /> <span className="font-medium">{content.likeCount}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <MessageCircle className="w-6 h-6" /> <span className="font-medium">{content.commentCount}</span>
                </button>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
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

function MoreHorizontalIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
