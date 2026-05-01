import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetProfile, useGetSiteStats } from "@workspace/api-client-react";
import { ShieldCheck, Star, Check, Zap, Heart, Lock } from "lucide-react";
import { Link } from "wouter";

const plans = [
  {
    name: "Monthly",
    price: "$19.99",
    period: "per month",
    description: "Full access, billed monthly. Cancel anytime.",
    badge: null,
    highlight: false,
  },
  {
    name: "3 Months",
    price: "$14.99",
    period: "per month",
    description: "Save 25% — billed as $44.97 every 3 months.",
    badge: "Best Value",
    highlight: true,
  },
  {
    name: "Annual",
    price: "$9.99",
    period: "per month",
    description: "Save 50% — billed as $119.88 once a year.",
    badge: "50% Off",
    highlight: false,
  },
];

const perks = [
  { icon: Lock, text: "Unlimited access to all photos and videos" },
  { icon: Zap, text: "New content added weekly" },
  { icon: Heart, text: "Direct messaging with Cristina" },
  { icon: Star, text: "Priority replies and behind-the-scenes exclusives" },
];

export default function Subscriptions() {
  const { data: profile } = useGetProfile();
  const { data: stats } = useGetSiteStats();

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-2xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl font-bold text-foreground">Subscribe to Cristina</h1>
            <p className="text-muted-foreground">
              Unlock {stats?.totalPhotos ?? 0}+ photos and {stats?.totalVideos ?? 0}+ videos. More added weekly.
            </p>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`border relative overflow-hidden transition-all ${
                  plan.highlight
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_30px_rgba(153,27,84,0.2)]"
                    : "border-border/50 bg-white/5 hover:border-primary/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg text-foreground">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-3xl font-bold text-foreground">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">{plan.period}</p>
                  </div>
                </CardContent>
                <div className="px-6 pb-6">
                  <Link href="/checkout" className="block">
                    <Button
                      className={`w-full rounded-full py-5 text-base font-medium transition-all ${
                        plan.highlight
                          ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(153,27,84,0.3)] hover:shadow-[0_0_30px_rgba(153,27,84,0.5)]"
                          : "bg-white/10 hover:bg-white/15 text-foreground border border-white/10"
                      }`}
                    >
                      Subscribe — {plan.price}/mo
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">What's included</h2>
            {perks.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground/80">{text}</p>
                <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Secure checkout. Cancel anytime. No hidden fees.
          </p>
        </div>
      </main>
    </div>
  );
}
