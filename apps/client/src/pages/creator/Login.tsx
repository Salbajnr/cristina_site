import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { setCreatorToken, isAuthenticated } from "@/lib/auth";
import { useVerifyCreator } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export default function CreatorLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const verifyCreator = useVerifyCreator();

  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/creator/dashboard");
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    verifyCreator.mutate({ data: { password } }, {
      onSuccess: (result) => {
        if (result.success && result.token) {
          setCreatorToken(result.token);
          setLocation("/creator/dashboard");
        } else {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Invalid password.",
          });
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your password.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif">Creator Access</CardTitle>
            <CardDescription>Enter your password to access the dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg py-6"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-lg" 
              disabled={verifyCreator.isPending || !password}
            >
              {verifyCreator.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
