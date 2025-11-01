"use client";

import { scrollToBottom, initialMessages } from "@/lib/utils";
import { ChatLine } from "./chat-line";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useEffect, useRef, useState } from "react";
import { UIMessage, useChat } from "@ai-sdk/react";

export function Chat() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  // useChat returns correct UIMessage type
  const { messages, setMessages } = useChat<UIMessage>();

  // Load initial messages once
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (!initialLoaded && initialMessages.length > 0) {
      setMessages(initialMessages);
      setInitialLoaded(true);
    }
  }, [initialLoaded, setMessages]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom(containerRef);
  }, [messages]);

  // ────────────── HANDLE SUBMIT ──────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: input }],
    };
    const afterUser = [...messages, userMsg];
    setMessages(afterUser);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: UIMessage = {
      id: assistantId,
      role: "assistant",
      parts: [{ type: "text", text: "" }],
    };
    setMessages([...afterUser, assistantMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: afterUser }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error("No body");

      const reader = response.body
        .pipeThrough(new TextDecoderStream()) // Decode chunks safely
        .getReader();

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += value;

        // Update assistant message live
        setMessages((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((m) => m.id === assistantId);
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], parts: [{ type: "text", text: accumulated }] };
          }
          return copy;
        });
      }

      // Ensure final message is fully set
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.id === assistantId);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], parts: [{ type: "text", text: accumulated || "No response." }] };
        }
        return copy;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          parts: [{ type: "text", text: "Sorry, connection failed. Try again." }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
      <div className="p-6 overflow-auto" ref={containerRef}>
        {messages.map((msg) => (
          <ChatLine key={msg.id} role={msg.role} parts={msg.parts} sources={[]} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex clear-both">
        <Input
          value={input}
          placeholder="Type to chat with AI..."
          onChange={(e) => setInput(e.target.value)}
          className="mr-2"
          disabled={isLoading}
        />
        <Button type="submit" className="w-24" disabled={isLoading}>
          {isLoading ? <Spinner /> : "Ask"}
        </Button>
      </form>
    </div>
  );
}
