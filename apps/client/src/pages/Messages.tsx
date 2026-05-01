import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGetProfile, useCreateInquiry } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "17372549874";
const TELEGRAM_HANDLE = "cris_luceroo";
const EMAIL = "dogtrainer_cristina@outlook.com";

export default function Messages() {
  const { data: profile } = useGetProfile();
  const { mutate: submitInquiry, isPending } = useCreateInquiry();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    submitInquiry(
      { data: { name: form.name, email: form.email, whatsapp: form.whatsapp || undefined, message: form.message } },
      {
        onSuccess: () => setSent(true),
        onError: () => toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <Avatar className="w-20 h-20 border-4 border-primary/30 mx-auto shadow-[0_0_30px_rgba(153,27,84,0.3)]">
              <AvatarImage src={profile?.avatarUrl || "/avatar.jpg"} className="object-cover" />
              <AvatarFallback>CL</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Get in Touch</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Send a message or reach Cristina directly — she replies fast.
              </p>
            </div>
          </div>

          {/* Direct contact buttons */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-2xl p-4 transition-all group"
            >
              <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs font-medium text-green-500">WhatsApp</span>
            </a>

            <a
              href={`https://t.me/${TELEGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-4 transition-all group"
            >
              <svg className="w-7 h-7 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-xs font-medium text-sky-400">Telegram</span>
            </a>

            <a
              href={`mailto:${EMAIL}`}
              className="flex flex-col items-center gap-2 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 hover:border-secondary/40 rounded-2xl p-4 transition-all group"
            >
              <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span className="text-xs font-medium text-secondary">Email</span>
            </a>
          </div>

          {/* Enquiry form */}
          <Card className="bg-white/5 border-border/50">
            <CardContent className="p-6">
              {sent ? (
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Message sent!</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Cristina will be in touch soon. Check your email or WhatsApp.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-2" onClick={() => { setSent(false); setForm({ name: "", email: "", whatsapp: "", message: "" }); }}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Send a message</h3>
                    <p className="text-xs text-muted-foreground">Fill in the form below and Cristina will follow up with you personally.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs">Name <span className="text-primary">*</span></Label>
                      <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="bg-background/50 border-border/50 focus:border-primary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email <span className="text-primary">*</span></Label>
                      <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="bg-background/50 border-border/50 focus:border-primary/50" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className="text-xs">WhatsApp number <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+1 234 567 8900" className="bg-background/50 border-border/50 focus:border-primary/50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs">Message <span className="text-primary">*</span></Label>
                    <Textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="What would you like to say to Cristina?" rows={4} className="bg-background/50 border-border/50 focus:border-primary/50 resize-none" />
                  </div>

                  <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 font-medium shadow-[0_0_20px_rgba(153,27,84,0.3)] hover:shadow-[0_0_30px_rgba(153,27,84,0.5)] transition-all">
                    <Send className="w-4 h-4 mr-2" />
                    {isPending ? "Sending..." : "Send Message"}
                  </Button>

                  <p className="text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Your details are kept private
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
