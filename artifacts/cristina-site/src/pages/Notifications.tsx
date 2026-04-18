import { Sidebar } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProfile } from "@workspace/api-client-react";
import { Heart, MessageCircle, Star, Camera } from "lucide-react";

const mockNotifications = [
  {
    id: 1,
    icon: Camera,
    color: "text-primary",
    bg: "bg-primary/15",
    message: "New photo set just dropped — Golden Hour Collection",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    icon: Heart,
    color: "text-rose-400",
    bg: "bg-rose-400/15",
    message: "Your post got 521 likes — Midnight Noir Series is trending",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    icon: Star,
    color: "text-secondary",
    bg: "bg-secondary/15",
    message: "New bundle available — Summer Heat Collection at a special price",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 4,
    icon: MessageCircle,
    color: "text-blue-400",
    bg: "bg-blue-400/15",
    message: "Subscribe to unlock direct messaging with Cristina",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 5,
    icon: Camera,
    color: "text-primary",
    bg: "bg-primary/15",
    message: "New video uploaded — check out the latest exclusive content",
    time: "3 days ago",
    unread: false,
  },
];

export default function Notifications() {
  const { data: profile } = useGetProfile();

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-2xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Notifications</h1>
              <p className="text-muted-foreground text-sm">Stay up to date with new content and activity</p>
            </div>
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
              2 new
            </span>
          </div>

          <div className="space-y-2">
            {mockNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                    n.unread
                      ? "bg-primary/5 border-primary/20"
                      : "bg-white/3 border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-relaxed ${n.unread ? "text-foreground font-medium" : "text-foreground/70"}`}>
                        {n.message}
                      </p>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
