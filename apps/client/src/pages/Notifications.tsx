import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { Camera, Check, MessageCircle, Rss, Sparkles } from "lucide-react";

interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}

const iconByType = {
  content: Camera,
  post: Rss,
  message: MessageCircle,
  comment: Sparkles,
  like: Sparkles,
  inquiry: MessageCircle,
  purchase: Check,
  subscription: Check,
  system: Sparkles,
};

export default function Notifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id ?? null);
    });

    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setUserId(sessionData.session?.user.id ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadNotifications = async () => {
      const { data, error: queryError } = await supabase
        .from("notifications")
        .select("id, type, title, body, resource_id, read_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
      } else {
        setNotifications(data ?? []);
        setError(null);
      }
      setIsLoading(false);
    };

    void loadNotifications();
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe((status) => {
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          setError("Live notifications are unavailable. Reload the page to retry.");
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  const markAllAsRead = async () => {
    if (!userId || isMarkingRead || unreadCount === 0) return;
    setIsMarkingRead(true);
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (updateError) {
      setError(updateError.message);
    }
    setIsMarkingRead(false);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 max-w-2xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Notifications</h1>
              <p className="text-muted-foreground text-sm">Private updates for your account.</p>
            </div>
            {userId && unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isMarkingRead}>
                <Check className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !userId ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                <p className="font-medium">Sign in to see your notifications.</p>
                <Link href="/login">
                  <Button>Sign in</Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3" aria-label="Loading notifications">
              <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                You're all caught up. New updates will appear here.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = iconByType[notification.type as keyof typeof iconByType] ?? Sparkles;
                return (
                  <Card key={notification.id} className={notification.read_at ? "opacity-70" : "border-primary/30"}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="rounded-full bg-primary/15 p-2 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{notification.title}</p>
                        {notification.body && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        )}
                        <time className="mt-2 block text-xs text-muted-foreground" dateTime={notification.created_at}>
                          {new Date(notification.created_at).toLocaleString()}
                        </time>
                      </div>
                      {!notification.read_at && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
