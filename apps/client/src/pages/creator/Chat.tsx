import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface Conversation {
  id: string;
  fan_user_id: string;
  creator_user_id: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

const MESSAGE_LIMIT = 5000;

export default function CreatorChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (active: () => boolean) => {
    const { data, error: queryError } = await supabase
      .from("conversations")
      .select("id, fan_user_id, creator_user_id, updated_at")
      .order("updated_at", { ascending: false });

    if (!active()) return;
    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }

    const rows = data ?? [];
    setConversations(rows);
    setConversationId((current) =>
      current && rows.some((conversation) => conversation.id === current)
        ? current
        : rows[0]?.id ?? null,
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id ?? null);
    });

    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setUserId(sessionData.session?.user.id ?? null);
      if (sessionError || !sessionData.session) setIsLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    const isActive = () => active;
    void loadConversations(isActive);

    const channel = supabase
      .channel(`creator-conversations:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void loadConversations(isActive);
        },
      )
      .subscribe((status) => {
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          setError("Live conversation updates are unavailable. Reload the page to retry.");
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loadConversations, userId]);

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

    setMessages([...(data ?? [])].reverse());
    const { error: readError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (active() && readError) setError(readError.message);
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId || !userId) {
      setMessages([]);
      return;
    }

    let active = true;
    const isActive = () => active;
    void loadMessages(isActive);

    const channel = supabase
      .channel(`creator-chat:${conversationId}`)
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
    <CreatorLayout>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Private chat</h1>
            <p className="text-sm text-muted-foreground">Reply to fans in real time.</p>
          </div>
        </header>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid min-h-[65vh] gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardContent className="space-y-1 p-2">
              <h2 className="px-3 py-2 text-sm font-semibold">Conversations</h2>
              {isLoading ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Loading conversations…</p>
              ) : conversations.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">New fan conversations will appear here.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setConversationId(conversation.id)}
                    aria-current={conversation.id === conversationId ? "true" : undefined}
                    className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                      conversation.id === conversationId
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="block font-medium">Fan {conversation.fan_user_id.slice(-6)}</span>
                    <time className="mt-1 block text-xs text-muted-foreground" dateTime={conversation.updated_at}>
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </time>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="flex min-h-[65vh] flex-col p-0">
              <div aria-live="polite" aria-label="Conversation messages" className="flex-1 space-y-3 overflow-y-auto p-4">
                {!conversationId ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Select a conversation to view messages.</p>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No messages in this conversation yet.</p>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === userId;
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <article className={`max-w-[85%] rounded-2xl px-4 py-3 ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                          <time
                            className={`mt-1 block text-right text-[11px] ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}
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
                <label htmlFor="creator-chat-message" className="sr-only">Your reply</label>
                <div className="flex items-end gap-3">
                  <Textarea
                    id="creator-chat-message"
                    value={draft}
                    maxLength={MESSAGE_LIMIT}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    disabled={!conversationId || isSending}
                    className="min-h-12 resize-y"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send reply"
                    disabled={!draft.trim() || !conversationId || isSending}
                  >
                    <Send aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">{draft.length}/{MESSAGE_LIMIT}</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
}
