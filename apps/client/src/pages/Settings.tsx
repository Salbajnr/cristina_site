import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronRight, CreditCard, Globe, Moon, Shield, Sun } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/use-user-auth";

const THEME_KEY = "cristina_theme";
const NOTIFICATIONS_ENABLED_KEY = "cristina_desktop_notifications";

function getInitialTheme(): "dark" | "light" {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export default function Settings() {
  const { data: profile } = useGetProfile();
  const { toast } = useToast();
  const { logout, logoutLoading } = useUserAuth();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true",
  );

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("light", nextTheme === "light");
    localStorage.setItem(THEME_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
      setNotificationsEnabled(false);
      return;
    }

    if (!("Notification" in window)) {
      toast({
        title: "Desktop notifications are unavailable",
        description: "This browser does not support desktop notifications.",
        variant: "destructive",
      });
      return;
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission !== "granted") {
      toast({
        title: "Notifications were not enabled",
        description: "Allow notifications in your browser to receive live update alerts.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "true");
    setNotificationsEnabled(true);
    toast({
      title: "Desktop notifications enabled",
      description: "New posts and content will alert you while this site is open.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-2xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
          </div>

          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary/30">
                <AvatarImage src={profile?.avatarUrl || "/avatar.jpg"} className="object-cover" />
                <AvatarFallback>CL</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{profile?.displayName || "Cristina Lucero"}</p>
                <p className="text-sm text-muted-foreground">@{profile?.username || "cristinalucero"}</p>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">
              Preferences
            </h2>
            <Card className="bg-white/5 border-border/50 divide-y divide-border/30">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">Appearance</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Choose a light or dark theme
                  </span>
                </span>
                <span className="text-xs capitalize text-muted-foreground">{theme}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Globe className="h-5 w-5 text-primary" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">Language</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    English is currently the available language
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">English</span>
              </div>
            </Card>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">
              Notifications
            </h2>
            <Card className="bg-white/5 border-border/50">
              <button
                type="button"
                onClick={toggleNotifications}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bell className="h-5 w-5 text-primary" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">Desktop notifications</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Alerts for new posts while this site is open
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {notificationsEnabled ? "Enabled" : "Off"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </Card>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">
              Account
            </h2>
            <Card className="bg-white/5 border-border/50 divide-y divide-border/30">
              <Link href="/subscriptions" className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <CreditCard className="h-5 w-5 text-primary" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">Billing & Subscriptions</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    View subscription options
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Shield className="h-5 w-5 text-primary" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">Privacy</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Privacy controls are not available yet
                  </span>
                </span>
              </div>
            </Card>
          </section>

          <div className="pt-4">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground border border-border/50 rounded-xl py-5"
              disabled={logoutLoading}
              onClick={() => logout(undefined, { onSuccess: () => setLocation("/login") })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
