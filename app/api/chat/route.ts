// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { UIMessage } from "ai";
import { getVectorStore } from "@/lib/vector-store";
import { ChatGroq } from "@langchain/groq";
import { getPineconeClient } from "@/lib/pinecone-client";
import { processUserMessage } from "@/lib/langchain";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: UIMessage[] = body.messages ?? [];

    if (!messages.length) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400 }
      );
    }

    // Get the last text part of the last message
    const lastMessage = messages[messages.length - 1];
    const lastTextPart = lastMessage.parts.find(
      (p): p is { type: "text"; text: string } => p.type === "text"
    );
    const currentQuestion = lastTextPart?.text?.trim();

    if (!currentQuestion) {
      return new Response(
        JSON.stringify({ error: "Empty question" }),
        { status: 400 }
      );
    }

    // Format previous messages
    const formattedPreviousMessages = messages
      .slice(0, -1)
      .map((m) => {
        const role = m.role === "user" ? "Human" : "Assistant";
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("\n");
        return `${role}: ${text}`;
      })
      .join("\n");

    // Initialize the Groq model
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      streaming: true,
      maxTokens: 200,
    });

    // Get vector store
    const pc = await getPineconeClient();
    const vectorStore = await getVectorStore(pc);

    // Process user message
    const { stream: langChainStream } = await processUserMessage({
      userPrompt: currentQuestion,
      conversationHistory: formattedPreviousMessages,
      vectorStore,
      model,
    });

    // ──────────────────────────────────────────────────────
    //  CONSOLE LOGGING + STREAM TO CLIENT
    // ──────────────────────────────────────────────────────
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of langChainStream) {
            // 1. Send to the client
            controller.enqueue(encoder.encode(chunk));

            // 2. Print the **exact same** chunk to console
            process.stdout.write(chunk);   // <-- this is the console response you asked for
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500 }
    );
  }
}