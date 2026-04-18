import { useState } from "react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { useListInquiries, useMarkInquiryRead } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Mail, MessageSquare, Phone, ExternalLink, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function CreatorInquiries() {
  const { data: inquiries, isLoading } = useListInquiries();
  const { mutate: markRead } = useMarkInquiryRead();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);

  const unreadCount = (inquiries ?? []).filter((i) => !i.isRead).length;

  const handleMarkRead = (id: number) => {
    markRead(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listInquiries"] });
        },
      }
    );
  };

  const handleReplyEmail = (email: string, name: string) => {
    window.open(`mailto:${email}?subject=Re: Your enquiry&body=Hi ${name},%0D%0A%0D%0A`, "_blank");
  };

  const handleReplyWhatsApp = (whatsapp: string) => {
    const cleaned = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight">Enquiries</h1>
            <p className="text-muted-foreground mt-1">Messages sent by visitors from the contact form.</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-white border-0 text-sm px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : !inquiries || inquiries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed border-border/50">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No enquiries yet</p>
                <p className="text-sm mt-1">When visitors send a message, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      !inquiry.isRead
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-background hover:bg-white/5"
                    }`}
                    onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!inquiry.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className="font-semibold text-foreground">{inquiry.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(inquiry.createdAt), "MMM d, yyyy · h:mm a")}
                          </span>
                        </div>
                        <p className={`text-sm text-muted-foreground truncate ${expanded === inquiry.id ? "whitespace-pre-line truncate-none" : ""}`}>
                          {inquiry.message}
                        </p>

                        {expanded === inquiry.id && (
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleReplyEmail(inquiry.email, inquiry.name); }}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Reply via Email
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </Button>

                              {inquiry.whatsapp && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
                                  onClick={(e) => { e.stopPropagation(); handleReplyWhatsApp(inquiry.whatsapp!); }}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  Reply via WhatsApp
                                  <ExternalLink className="w-3 h-3 opacity-60" />
                                </Button>
                              )}

                              {!inquiry.isRead && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-2 text-xs text-muted-foreground"
                                  onClick={(e) => { e.stopPropagation(); handleMarkRead(inquiry.id); }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Mark as read
                                </Button>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/30">
                              <p><span className="font-medium">Email:</span> {inquiry.email}</p>
                              {inquiry.whatsapp && <p><span className="font-medium">WhatsApp:</span> {inquiry.whatsapp}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
