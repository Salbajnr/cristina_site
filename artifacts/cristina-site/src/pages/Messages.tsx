import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, MessageCircle, ShieldCheck, Zap, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Messages() {
  const { data: profile } = useGetProfile();

  const perks = [
    { icon: Zap, text: "She replies fast — usually within a few hours" },
    { icon: MessageCircle, text: "Flirt in English or Spanish — she's bilingual" },
    { icon: Clock, text: "Late night chats available — she gets playful after dark" },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <Avatar className="w-24 h-24 border-4 border-primary/30 mx-auto shadow-[0_0_30px_rgba(153,27,84,0.3)]">
              <AvatarImage src={profile?.avatarUrl || "/avatar.jpg"} className="object-cover" />
              <AvatarFallback>CL</AvatarFallback>
            </Avatar>
            <h1 className="font-serif text-2xl font-bold text-foreground mt-3">Message Cristina</h1>
            <p className="text-muted-foreground text-sm">
              Direct access to {profile?.displayName || "Cristina"} — subscribe to unlock private messaging.
            </p>
          </div>

          <Card className="bg-white/5 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent z-0" />
            <CardContent className="p-6 relative z-10 space-y-5">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(153,27,84,0.3)]">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Messages are unlocked for subscribers</p>
                  <p className="text-sm text-muted-foreground mt-1">Get a monthly subscription and slide into her DMs.</p>
                </div>

                <div className="w-full space-y-3 pt-2">
                  <Link href="/checkout" className="w-full block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-base font-medium shadow-[0_0_20px_rgba(153,27,84,0.3)] hover:shadow-[0_0_30px_rgba(153,27,84,0.5)] transition-all">
                      Subscribe for $19.99/mo
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Cancel anytime
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {perks.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
