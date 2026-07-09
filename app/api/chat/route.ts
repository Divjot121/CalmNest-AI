import { NextRequest, NextResponse } from "next/server";
import { getGemini, SYSTEM_PROMPT, detectCrisis } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;

    // Support single content string format (`{ content: "..." }`)
    if (!messages && body.content) {
      messages = [{ role: 'user', content: body.content }];
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const lastMessageObj = messages[messages.length - 1];
    const lastMessage = typeof lastMessageObj === 'string' ? lastMessageObj : lastMessageObj.content || "";
    const normalizedMessage = lastMessage.trim().toLowerCase().replace(/[^\w\s]/g, "");
    const commonGreetings = ["hi", "hello", "hey", "how are you", "who are you", "good morning", "good evening", "good afternoon", "whats up", "hiya"];
    
    let text = "";

    if (commonGreetings.includes(normalizedMessage) || normalizedMessage.length <= 3) {
      text = "Hello! I'm CalmNest AI. How are you feeling today? You can share whatever is on your mind in this safe space.";
    } else {
      const ai = getGemini();
      const chat = ai.chats.create({ 
        model: "gemini-3.1-flash-lite",
        config: {
          systemInstruction: SYSTEM_PROMPT
        },
        history: messages.slice(0, -1).map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content || "" }]
        })),
      });

      const result = await chat.sendMessage({ message: lastMessage });
      text = result.text;
    }

    const containsCrisis = detectCrisis(lastMessage) || detectCrisis(text);

    return NextResponse.json({ 
      text, 
      crisisDetected: containsCrisis 
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
