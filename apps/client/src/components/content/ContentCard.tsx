import { ContentItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Heart, MessageCircle, Play } from "lucide-react";
import { Link } from "wouter";

export function ContentCard({ content }: { content: ContentItem }) {
  const isVideo = content.type === "video";
  const isLocked = content.isLocked;

  // Use generated placeholder images based on ID for visual variety
  const getPreviewImage = (id: number) => {
    if (!isLocked && content.previewUrl) return content.previewUrl;
    const index = (id % 6) + 1;
    return `/preview-${index}.png`;
  };

  return (
    <Link href={`/content/${content.id}`}>
      <Card className="bg-background overflow-hidden border-border/50 hover:border-primary/50 transition-colors group cursor-pointer relative">
        <div className="aspect-[4/5] relative bg-black/50 overflow-hidden">
          <img 
            src={getPreviewImage(content.id)} 
            alt={content.title}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLocked ? "blur-sm scale-110 brightness-50" : ""}`}
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

          {/* Type Badge */}
          {isVideo && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          )}

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="bg-background/80 backdrop-blur-xl p-4 rounded-full border border-primary/30 mb-3 shadow-[0_0_30px_rgba(153,27,84,0.4)]">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <span className="font-medium text-white shadow-black drop-shadow-md">Unlock Post</span>
              {content.price > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mt-2">
                  ${content.price.toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <h3 className="font-medium text-lg truncate mb-1">{content.title}</h3>
            <div className="flex items-center justify-between text-white/70 text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {content.likeCount}</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {content.commentCount}</span>
              </div>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                {new Date(content.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
