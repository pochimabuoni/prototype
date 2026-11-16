"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMessageTime } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function ChatThread({
  conversationId,
  viewerId,
  otherName,
  initialMessages,
  canSend,
}: {
  conversationId: string;
  viewerId: string;
  otherName: string;
  initialMessages: ChatMessage[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // Realtime: new messages in this conversation (RLS-filtered by Supabase).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== viewerId) void markConversationRead(conversationId);
        },
      )
      .subscribe();
    void markConversationRead(conversationId);
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, viewerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    start(async () => {
      const r = await sendMessage({ conversationId, body });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDraft("");
      if (r.data) {
        const created = { id: r.data.id, created_at: r.data.created_at, body, sender_id: viewerId };
        setMessages((prev) => (prev.some((x) => x.id === created.id) ? prev : [...prev, created]));
      }
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col border border-border bg-card">
      <ol className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-8" aria-live="polite" aria-label={`Conversation with ${otherName}`}>
        {messages.length === 0 ? (
          <li className="py-16 text-center text-sm text-muted-foreground">Say hello — suggest a sport, a time, or a favourite court.</li>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === viewerId;
            return (
              <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <p className={cn("max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-[0.9375rem] leading-relaxed sm:max-w-[70%]", mine ? "bg-ink text-paper" : "bg-linen text-ink")}>
                  {m.body}
                </p>
                <time dateTime={m.created_at} className="mt-1 text-[0.625rem] uppercase tracking-[0.14em] text-stone">
                  {mine ? "You" : otherName} · {formatMessageTime(m.created_at)}
                </time>
              </li>
            );
          })
        )}
        <div ref={endRef} />
      </ol>
      {canSend ? (
        <form
          className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="composer" className="sr-only">Message</label>
          <Textarea
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder={`Message ${otherName}…`}
            className="min-h-12 flex-1 resize-none"
          />
          <Button type="submit" disabled={pending || !draft.trim()}>{pending ? "Sending…" : "Send"}</Button>
          {error ? <p role="alert" className="text-xs text-destructive sm:basis-full">{error}</p> : null}
        </form>
      ) : (
        <p className="border-t border-border p-4 text-sm text-muted-foreground">
          This conversation is closed. Messaging is only available between connected members who haven&apos;t blocked one another.
        </p>
      )}
    </div>
  );
}
