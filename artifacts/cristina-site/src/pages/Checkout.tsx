import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePurchase } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPurchase = useCreatePurchase();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    paymentMethod: "card"
  });
  
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }

    createPurchase.mutate({
      data: {
        contentId: 1, // hardcoded for demo
        customerEmail: formData.email,
        customerName: formData.name,
        paymentMethod: formData.paymentMethod
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        setTimeout(() => setLocation("/"), 3000);
      },
      onError: () => {
        toast({
          title: "Payment failed",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive"
        });
      }
    });
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
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_30px_rgba(153,27,84,0.3)]">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground">Private Access • Cristina Lucero</p>
        </div>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-xl">Subscription</CardTitle>
              <span className="font-serif text-xl text-primary font-bold">$19.99<span className="text-sm text-muted-foreground font-sans font-normal">/mo</span></span>
            </div>
            <CardDescription className="text-base">Full access to all photos, videos, and direct messaging.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="bg-black/40 border-white/10 focus-visible:ring-primary h-12 text-lg"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    className="bg-black/40 border-white/10 focus-visible:ring-primary h-12 text-lg"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-muted-foreground">Payment Method</Label>
                <RadioGroup 
                  defaultValue="card" 
                  onValueChange={(val) => setFormData(prev => ({...prev, paymentMethod: val}))}
                  className="gap-3"
                >
                  <div className="flex items-center space-x-3 bg-black/40 border border-primary/50 rounded-xl p-4 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <RadioGroupItem value="card" id="card" className="text-primary" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1 text-base">
                      <CreditCard className="w-5 h-5 text-primary" /> Credit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 bg-black/20 border border-white/10 rounded-xl p-4 cursor-pointer opacity-70">
                    <RadioGroupItem value="crypto" id="crypto" disabled />
                    <Label htmlFor="crypto" className="flex items-center gap-3 cursor-pointer flex-1 text-base">
                      <CryptoIcon className="w-5 h-5" /> Crypto (Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dummy Card Input */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Card Number</Label>
                  <div className="h-10 border-b border-white/10 flex items-center text-muted-foreground/50">
                    •••• •••• •••• ••••
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Expiry</Label>
                    <div className="h-10 border-b border-white/10 flex items-center text-muted-foreground/50">
                      MM / YY
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">CVC</Label>
                    <div className="h-10 border-b border-white/10 flex items-center text-muted-foreground/50">
                      •••
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-medium shadow-[0_0_20px_rgba(153,27,84,0.4)]"
                  disabled={createPurchase.isPending}
                >
                  {createPurchase.isPending ? "Processing..." : "Complete Purchase"}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Payments are secure and encrypted
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CryptoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
