import { useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { getGetContentQueryKey, useGetContent } from "@workspace/api-client-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

const subscriptionPlans = {
  monthly: { name: "Monthly membership", price: "$19.99", billed: "per month" },
  quarterly: { name: "3-month membership", price: "$44.97", billed: "every 3 months" },
  annual: { name: "Annual membership", price: "$119.88", billed: "per year" },
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [params] = useSearchParams();
  const { getToken } = useUserAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planId = params.get("plan");
  const plan = planId && Object.hasOwn(subscriptionPlans, planId)
    ? subscriptionPlans[planId as keyof typeof subscriptionPlans]
    : undefined;
  const contentId = Number(params.get("contentId"));
  const validContentId = Number.isSafeInteger(contentId) && contentId > 0;
  const { data: content, isLoading: isLoadingContent, isError: isContentError } = useGetContent(
    contentId,
    { query: { queryKey: getGetContentQueryKey(contentId), enabled: !plan && validContentId } },
  );
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const price = plan?.price ?? (content ? `$${content.price.toFixed(2)}` : "—");

  const handleStripeCheckout = async () => {
    const token = getToken();
    if (!token) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      setLocation(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!plan && (!validContentId || !content)) {
      toast({
        title: "Unable to start checkout",
        description: "Choose a valid content item and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const endpoint = plan ? "subscriptions/checkout-session" : "purchases/checkout-session";
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          plan
            ? { plan: planId }
            : { contentId },
        ),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to create checkout session");
      }

      const result = await response.json();
      if (typeof result.url !== "string" || !result.url) {
        throw new Error("Checkout provider did not return a payment URL.");
      }

      window.location.href = result.url;
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to start checkout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const title = plan?.name ?? content?.title ?? "Content purchase";
  const canCheckout = plan !== undefined || (validContentId && Boolean(content));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <Button
          variant="ghost"
          className="mb-8 text-muted-foreground hover:text-foreground"
          onClick={() => setLocation(plan ? "/subscriptions" : "/")}
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
            <div className="flex justify-between items-center mb-2 gap-3">
              <CardTitle className="text-xl">{plan ? "Subscription" : "Content Access"}</CardTitle>
              <span className="font-serif text-xl text-primary font-bold">{price}</span>
            </div>
            <CardDescription className="text-base">
              {plan
                ? `Recurring ${plan.billed}; cancel through Stripe billing.`
                : content?.description || "One-time purchase for full access to this exclusive content."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-muted-foreground">{plan ? "Plan" : "Content"}</span>
                  <span className="text-foreground font-medium text-right">{title}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center font-semibold">
                  <span>Due {plan?.billed ?? "today"}</span>
                  <span className="text-primary text-lg">{price}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  What You&apos;ll Get
                </h3>
                <ul className="space-y-2 text-sm">
                  {(plan
                    ? ["Access to all exclusive content", "New content added weekly", "Manage or cancel through Stripe"]
                    : ["Instant access to purchased content", "Secure card payment", "Email purchase confirmation"]
                  ).map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-foreground/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {isContentError && !plan && (
                <p role="alert" className="text-sm text-destructive">
                  This content could not be loaded. Return to the site and choose an available item.
                </p>
              )}
              {!plan && !validContentId && (
                <p role="alert" className="text-sm text-destructive">
                  Select a content item before continuing to checkout.
                </p>
              )}

              <Button
                onClick={handleStripeCheckout}
                disabled={isLoading || isLoadingContent || !canCheckout}
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-medium shadow-[0_0_20px_rgba(153,27,84,0.4)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Payments are securely handled by Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
