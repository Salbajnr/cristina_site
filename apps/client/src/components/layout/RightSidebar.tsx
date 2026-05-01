import { useGetProfile, useGetSiteStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Star, ShieldCheck, Flame, Eye, Crown } from "lucide-react";
import { Link } from "wouter";

export function RightSidebar() {
  const { data: profile } = useGetProfile();
  const { data: stats } = useGetSiteStats();

  return (
    <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-screen overflow-y-auto py-6 pr-6 space-y-5 no-scrollbar">
      {/* Main CTA card */}
      <Card className="border-primary/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-0" />
        <CardContent className="p-6 relative z-10 space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(153,27,84,0.4)]">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Private Access</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats?.totalPhotos ?? 0) + (stats?.totalVideos ?? 0)}+ exclusive pieces — none of it free
              </p>
            </div>
          </div>

          {/* Scarcity signal */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1.5">
            <Flame className="w-3 h-3" />
            <span>Limited subscriber spots available</span>
          </div>

          <div className="space-y-2.5">
            <Link href="/subscriptions" className="block">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-base font-semibold shadow-[0_0_25px_rgba(153,27,84,0.4)] hover:shadow-[0_0_40px_rgba(153,27,84,0.6)] transition-all">
                Join the Inner Circle
              </Button>
            </Link>
            <Link href="/subscriptions" className="block">
              <Button variant="outline" className="w-full rounded-full py-5 text-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all">
                View Pricing Plans
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Cancel anytime · Secure checkout
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What's inside */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] pl-1">What's inside</h4>
        <ul className="space-y-2">
          {[
            { icon: Eye, text: "Uncensored photos & videos — nothing held back" },
            { icon: Flame, text: "New exclusive drops every week" },
            { icon: Star, text: "Private DMs — she replies personally" },
            { icon: Crown, text: "VIP access — only for serious fans" },
          ].map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 bg-white/4 rounded-xl p-3 border border-white/6 hover:border-primary/20 transition-colors">
              <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <Card className="bg-white/3 border-white/8">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalPhotos ?? 0}+</p>
              <p className="text-xs text-muted-foreground mt-0.5">Photos</p>
            </div>
            <div className="border-x border-white/10">
              <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalVideos ?? 0}+</p>
              <p className="text-xs text-muted-foreground mt-0.5">Videos</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-foreground">2.8K</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground/40 text-center pb-4">
        &copy; {new Date().getFullYear()} Cristina Lucero. All rights reserved.
      </div>
    </aside>
  );
}
