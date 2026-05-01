import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Bell, Shield, CreditCard, ChevronRight, Moon } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const settingGroups = [
  {
    title: "Preferences",
    items: [
      { icon: Moon, label: "Appearance", description: "Dark mode is always on", action: "Dark mode" },
      { icon: Globe, label: "Language", description: "English / Español", action: "English" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { icon: Bell, label: "Push notifications", description: "New content, messages, and updates", action: "Manage" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: CreditCard, label: "Billing & Subscriptions", description: "Manage your active plan", action: "View", href: "/subscriptions" },
      { icon: Shield, label: "Privacy", description: "Control who sees your activity", action: "Manage" },
    ],
  },
];

export default function Settings() {
  const { data: profile } = useGetProfile();
  const { toast } = useToast();

  const handleAction = (label: string) => {
    toast({ title: "Coming soon", description: `${label} settings will be available soon.` });
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

          {settingGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">{group.title}</h2>
              <Card className="bg-white/5 border-border/50 divide-y divide-border/30">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{item.action}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  );

                  return item.href ? (
                    <Link key={item.label} href={item.href}>{inner}</Link>
                  ) : (
                    <div key={item.label} onClick={() => handleAction(item.label)}>
                      {inner}
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}

          <div className="pt-4">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground border border-border/50 rounded-xl py-5"
              onClick={() => {
                toast({ title: "Coming soon", description: "Account management will be available soon." });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
