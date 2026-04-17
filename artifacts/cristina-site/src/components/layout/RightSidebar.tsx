import { useGetProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Star, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export function RightSidebar() {
  const { data: profile } = useGetProfile();

  return (
    <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-screen overflow-y-auto py-6 pr-6 space-y-6 no-scrollbar">
      <Card className="bg-background/50 backdrop-blur-md border-border/50 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/80 z-0" />
        <CardContent className="p-6 relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="font-serif text-xl font-medium text-foreground">Subscribe to Unlock</h3>
          <p className="text-sm text-muted-foreground">
            Get full access to {profile?.totalPhotos || 0} photos and {profile?.totalVideos || 0} videos.
          </p>

          <div className="w-full space-y-3 mt-4">
            <Link href="/checkout" className="w-full block">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-lg font-medium shadow-[0_0_20px_rgba(153,27,84,0.3)] transition-all hover:shadow-[0_0_30px_rgba(153,27,84,0.5)]">
                Subscribe for $19.99/mo
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-widest pl-2">Perks</h4>
        <ul className="space-y-3">
          {[
            "Full access to exclusive content",
            "Direct 1-on-1 messaging",
            "Priority response to comments",
            "Behind the scenes access"
          ].map((perk, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 bg-white/5 rounded-xl p-3 border border-white/5">
              <Star className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-muted-foreground/50 text-center pt-8 pb-4">
        &copy; {new Date().getFullYear()} Cristina Lucero. All rights reserved.
      </div>
    </aside>
  );
}
