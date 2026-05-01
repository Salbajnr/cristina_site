import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      setLocation("/");
    }

    return () => clearInterval(timer);
  }, [countdown, setLocation]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="animate-in zoom-in duration-500 flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Payment Successful!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for your purchase. You now have exclusive access to all the content.
        </p>
        <p className="text-sm text-muted-foreground">
          Check your email for a confirmation and access link.
        </p>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 w-full mt-8">
          <p className="text-sm text-foreground/80">
            Redirecting in {countdown} seconds...
          </p>
        </div>
        <Button onClick={() => setLocation("/")} className="mt-4">
          Return to Home
        </Button>
      </div>
    </div>
  );
}
