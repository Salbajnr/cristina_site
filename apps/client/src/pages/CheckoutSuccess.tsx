import { useLocation, useSearchParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserAuth } from "@/hooks/use-user-auth";
import { fetchSupabaseApi } from "@/lib/supabase-api";

interface CheckoutStatus {
  status: "processing" | "complete";
  type?: "content" | "subscription";
  contentId?: number;
  plan?: string;
}

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [params] = useSearchParams();
  const { getToken } = useUserAuth();
  const sessionId = params.get("session_id");
  const token = getToken();

  const { data: checkout, error, isLoading } = useQuery({
    queryKey: ["checkout-session", sessionId],
    enabled: Boolean(sessionId && token),
    retry: false,
    refetchInterval: (query) => {
      if (query.state.error || query.state.data?.status === "complete") return false;
      return 3_000;
    },
    queryFn: async () => {
      const response = await fetchSupabaseApi(
        `/purchases/checkout-session/${encodeURIComponent(sessionId!)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Unable to verify this payment.");
      }
      return (await response.json()) as CheckoutStatus;
    },
  });

  const isComplete = checkout?.status === "complete";
  const isMissingSession = !sessionId;
  const destination =
    checkout?.type === "content" && checkout.contentId
      ? `/content/${checkout.contentId}`
      : checkout?.type === "subscription"
        ? "/subscriptions"
        : "/";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            isComplete ? "bg-green-500/15 text-green-500" : "bg-primary/20 text-primary"
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="h-12 w-12" />
          ) : isLoading || checkout?.status === "processing" ? (
            <Loader2 className="h-12 w-12 animate-spin" />
          ) : error || isMissingSession || !token ? (
            <AlertCircle className="h-12 w-12" />
          ) : (
            <Clock className="h-12 w-12" />
          )}
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {isComplete
              ? "Payment verified"
              : error || isMissingSession || !token
                ? "Payment status unavailable"
                : "Confirming your payment"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isComplete
              ? checkout.type === "subscription"
                ? "Your membership is active and your exclusive access is ready."
                : "Your content purchase is confirmed and access is ready."
              : checkout?.status === "processing"
                ? "Stripe received your payment. Access will appear as soon as the receipt is recorded."
                : error instanceof Error
                  ? error.message
                  : isMissingSession
                    ? "This page needs a checkout session to confirm your purchase."
                    : !token
                      ? "Sign in to verify the payment for your account."
                      : "Waiting for Stripe to confirm the transaction."}
          </p>
        </div>

        {isComplete && (
          <Button onClick={() => setLocation(destination)}>
            {checkout.type === "subscription" ? "View membership" : "Open purchased content"}
          </Button>
        )}
        {!isComplete && (
          <Button
            variant="outline"
            onClick={() => setLocation(token ? "/" : `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
          >
            {token ? "Return to home" : "Sign in"}
          </Button>
        )}
      </div>
    </div>
  );
}
