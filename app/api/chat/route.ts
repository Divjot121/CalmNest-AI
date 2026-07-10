import { NextRequest, NextResponse } from "next/server";
import { getGemini, getLocalizedSystemPrompt, detectCrisis } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;
    const language = body.language || 'en';
    const voiceStyle = body.voiceStyle || 'warm';

    // Support single content or message format
    if (!messages && body.message) {
      const hist = Array.isArray(body.history) ? body.history.map((h: any) => ({
        role: h.role === 'model' || h.role === 'ai' ? 'model' : 'user',
        content: h.text || h.content || ''
      })) : [];
      messages = [...hist, { role: 'user', content: body.message }];
    } else if (!messages && body.content) {
      messages = [{ role: 'user', content: body.content }];
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const lastMessageObj = messages[messages.length - 1];
    const lastMessage = typeof lastMessageObj === 'string' ? lastMessageObj : lastMessageObj.content || "";
    const normalizedMessage = lastMessage.trim().toLowerCase().replace(/[^\w\s]/g, "");
    const commonGreetings = ["hi", "hello", "hey", "how are you", "who are you", "good morning", "good evening", "good afternoon", "whats up", "hiya", "नमस्ते", "सत श्री अकाल", "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ"];
    
    let text = "";

    if (commonGreetings.includes(normalizedMessage) || normalizedMessage.length <= 3) {
      if (language === 'hi') {
        text = "नमस्ते! मैं आपका शांत साथी (CalmNest AI) हूँ। आज आप कैसा महसूस कर रहे हैं? इस सुरक्षित जगह में आप अपने मन की कोई भी बात साझा कर सकते हैं।";
      } else if (language === 'pa') {
        text = "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸ਼ਾਂਤ ਸਾਥੀ (CalmNest AI) ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ? ਇਸ ਸੁਰੱਖਿਅਤ ਥਾਂ ਵਿੱਚ ਤੁਸੀਂ ਆਪਣੇ ਮਨ ਦੀ ਕੋਈ ਵੀ ਗੱਲ ਸਾਂਝੀ ਕਰ ਸਕਦੇ ਹੋ।";
      } else {
        text = "Hello! I'm your CalmNest sanctuary companion. How are you feeling today? You can share whatever is on your mind in this safe, quiet space.";
      }
    } else {
      const ai = getGemini();
      const chat = ai.chats.create({ 
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: getLocalizedSystemPrompt(language, voiceStyle)
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
      reply: text,
      crisisDetected: containsCrisis,
      isCrisis: containsCrisis 
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

