import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export default function CreatorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active || error || !data.session) return;
      const { data: creatorRole, error: roleError } = await supabase
        .from("creator_roles")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!active) return;
      if (roleError) {
        toast({
          variant: "destructive",
          title: "Unable to verify creator access",
          description: roleError.message,
        });
      } else if (creatorRole) {
        setLocation("/creator/dashboard");
      }
    });
    return () => {
      active = false;
    };
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isPending) return;

    setIsPending(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: error?.message ?? "Supabase did not create an authenticated session.",
        });
        return;
      }

      const { data: creatorRole, error: roleError } = await supabase
        .from("creator_roles")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError || !creatorRole) {
        toast({
          variant: "destructive",
          title: "Creator access required",
          description: roleError?.message ?? "This account is not authorized as the creator.",
        });
        return;
      }

      setLocation("/creator/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign-in failed",
        description: error instanceof Error ? error.message : "Unable to authenticate this account.",
      });
    } finally {
      setIsPending(false);
    }
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
            <CardDescription>Sign in with your creator account to access the dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center text-lg py-6"
                autoComplete="username"
                autoFocus
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg py-6"
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-lg" 
              disabled={isPending || !email || !password}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
