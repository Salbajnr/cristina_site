import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSearchParams } from "wouter/use-browser-location";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const params = useSearchParams();
  const contentId = params.get("contentId") || "1";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const handleStripeCheckout = async () => {
    try {
      setIsLoading(true);

      // Get Stripe public key
      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripePublicKey) {
        toast({
          title: "Configuration Error",
          description: "Stripe is not configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Create checkout session
      const response = await fetch(`${API_URL}/purchases/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: parseInt(contentId),
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/checkout`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const data = await response.json();

      // Redirect to Stripe Checkout using stripe.js
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Checkout failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-in zoom-in duration-500 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Welcome to the Club</h1>
          <p className="text-muted-foreground text-lg">
            Your purchase was successful. You now have exclusive access.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 w-full mt-8">
            <p className="text-sm text-foreground/80">Redirecting to your content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <Button
          variant="ghost"
          className="mb-8 text-muted-foreground hover:text-foreground"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_30px_rgba(153,27,84,0.3)]">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground">Private Access • Cristina Lucero</p>
        </div>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-xl">Content Access</CardTitle>
              <span className="font-serif text-xl text-primary font-bold">$19.99</span>
            </div>
            <CardDescription className="text-base">
              One-time purchase for full access to this exclusive content.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Content</span>
                  <span className="text-foreground font-medium">$19.99</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-primary text-lg">$19.99</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  What You'll Get
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-foreground/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Instant access to exclusive content
                  </li>
                  <li className="flex items-center gap-2 text-foreground/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Download & offline viewing
                  </li>
                  <li className="flex items-center gap-2 text-foreground/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Direct messaging access
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleStripeCheckout}
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-medium shadow-[0_0_20px_rgba(153,27,84,0.4)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Payments are secure and encrypted by Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

