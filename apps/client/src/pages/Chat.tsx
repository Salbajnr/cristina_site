import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageCircle, Send } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

const MESSAGE_LIMIT = 5000;

export default function Chat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUserId(session?.user.id ?? null);
        setIsLoadingAuth(false);
      }
    });

    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
      } else {
        setUserId(sessionData.session?.user.id ?? null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    let active = true;
    setIsLoadingConversation(true);
    setError(null);

    void supabase.rpc("start_creator_conversation").then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError) {
        setError(rpcError.message);
      } else if (typeof data !== "string") {
        setError("The conversation could not be started.");
      } else {
        setConversationId(data);
      }
      setIsLoadingConversation(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const loadMessages = useCallback(async (active: () => boolean) => {
    if (!conversationId || !userId) return;

    const { data, error: queryError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!active()) return;
    if (queryError) {
      setError(queryError.message);
      return;
    }

    const recentMessages = [...(data ?? [])].reverse();
    setMessages(recentMessages);

    const { error: readError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (active() && readError) {
      setError(readError.message);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    let active = true;
    const isActive = () => active;
    void loadMessages(isActive);

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void loadMessages(isActive);
        },
      )
      .subscribe((status) => {
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          setError("Live message updates are unavailable. Reload the page to retry.");
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages, userId]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !conversationId || !userId || isSending) return;

    setIsSending(true);
    setError(null);
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setDraft("");
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <Sidebar />
      <main className="flex-1 w-full max-w-3xl md:ml-20 xl:ml-64 px-4 py-8 pb-20 md:pb-8">
        <div className="space-y-6">
          <header className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <MessageCircle aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">Private chat</h1>
              <p className="text-sm text-muted-foreground">A private conversation with Cristina.</p>
            </div>
          </header>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!isLoadingAuth && !userId ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                <p className="font-medium">Sign in to start a private conversation.</p>
                <Link href="/login">
                  <Button>Sign in</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="flex min-h-[65vh] flex-col p-0">
                <div
                  aria-live="polite"
                  aria-label="Conversation messages"
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {isLoadingAuth || isLoadingConversation ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Connecting to your conversation…</p>
                  ) : messages.length === 0 && !error ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Send a message to start the conversation.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === userId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <article
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                            <time
                              className={`mt-1 block text-right text-[11px] ${
                                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                              dateTime={message.created_at}
                            >
                              {new Date(message.created_at).toLocaleString()}
                            </time>
                          </article>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="border-t border-border p-4">
                  <label htmlFor="chat-message" className="sr-only">Your message</label>
                  <div className="flex items-end gap-3">
                    <Textarea
                      id="chat-message"
                      value={draft}
                      maxLength={MESSAGE_LIMIT}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write a private message…"
                      rows={2}
                      disabled={!userId || !conversationId || isSending}
                      className="min-h-12 resize-y"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      aria-label="Send message"
                      disabled={!draft.trim() || !conversationId || isSending}
                    >
                      <Send aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {draft.length}/{MESSAGE_LIMIT}
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
