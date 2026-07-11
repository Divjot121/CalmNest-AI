import { NextRequest, NextResponse } from "next/server";
import { getGemini, getLocalizedSystemPrompt, detectCrisis } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { getAuthSession } from "@/lib/auth";

// Simple sentiment analyzer based on keywords (supporting English, Hindi, and Punjabi)
function analyzeSentiment(text: string): string {
  const normalized = text.toLowerCase();
  
  const sadKeywords = ['sad', 'depressed', 'lonely', 'hopeless', 'crying', 'hurt', 'pain', 'उदासी', 'उदास', 'ਦੁਖੀ', 'ਰੋਣਾ'];
  const anxiousKeywords = ['anxious', 'panic', 'worry', 'scared', 'fear', 'afraid', 'stressed', 'nervous', 'चिंता', 'घबराहट', 'ਡਰ', 'ਚਿੰਤਾ'];
  const angryKeywords = ['angry', 'mad', 'hate', 'frustrated', 'annoyed', 'irritated', 'गुस्सा', 'क्रोध', 'ਗੁੱਸਾ'];
  const happyKeywords = ['happy', 'good', 'great', 'awesome', 'joy', 'excited', 'खुश', 'अच्छा', 'ਖੁਸ਼', 'ਵਧੀਆ'];
  
  if (sadKeywords.some(kw => normalized.includes(kw))) return 'sad';
  if (anxiousKeywords.some(kw => normalized.includes(kw))) return 'anxious';
  if (angryKeywords.some(kw => normalized.includes(kw))) return 'angry';
  if (happyKeywords.some(kw => normalized.includes(kw))) return 'happy';
  return 'neutral';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;
    const language = body.language || 'en';
    const voiceStyle = body.voiceStyle || 'warm';
    const conversationId = body.conversationId;
    const aiPersonality = body.aiPersonality || 'counselor';
    const aiResponseLength = body.aiResponseLength || 'medium';
    const aiEmpathyLevel = body.aiEmpathyLevel || 'high';
    const aiMemoryEnabled = body.aiMemoryEnabled !== false;

    // Get auth user if present
    const session = await getAuthSession(req).catch(() => null);
    const userId = session?.user?.id;

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
    
    // Analyze sentiment of the incoming message
    const sentiment = analyzeSentiment(lastMessage);

    // Fetch AI memory if user is logged in
    let memoryPromptContext = "";
    if (userId && aiMemoryEnabled) {
      try {
        const { data: memories } = await supabase
          .from('ai_memory')
          .select('key, value')
          .eq('user_id', userId);
        
        if (memories && memories.length > 0) {
          memoryPromptContext = "\n### USER BACKSTORY & CONTEXT (AI MEMORY):\n" + 
            memories.map(m => `- ${m.key}: ${m.value}`).join('\n') + 
            "\nKeep these user preferences and context in mind during the conversation.\n";
        }
      } catch (err) {}
    }

    let customizationPrompt = "\n### COUNSELING STYLE TUNING:";
    
    // Personality Tone
    if (aiPersonality === 'companion') {
      customizationPrompt += "\n- Role: Soothing peer companion/friend. Speak in a slightly more casual, friendly, and deeply personal tone. Avoid overly clinical therapy terms.";
    } else if (aiPersonality === 'philosopher') {
      customizationPrompt += "\n- Role: Reflective Sage/Philosopher. Share quiet wisdom, quote Stoic, Zen, or Sufi teachings where helpful, and encourage spacious existential inquiry.";
    } else if (aiPersonality === 'mentor') {
      customizationPrompt += "\n- Role: Empathetic Mentor/Guide. Focus on practical action steps, goal setting, habit building, and positive encouragement to complete tasks.";
    } else {
      customizationPrompt += "\n- Role: Warm clinical counselor. Provide active listening, validation, empathetic reflection, and cognitive behavioral adjustments.";
    }

    // Empathy Level
    if (aiEmpathyLevel === 'moderate') {
      customizationPrompt += "\n- Empathy: Moderate. Validate the user's emotions, then transition smoothly to rational reframing or problem-solving.";
    } else if (aiEmpathyLevel === 'low') {
      customizationPrompt += "\n- Empathy: Objective/Low. Be objective, calm, and practical. Keep focus on cognitive exercises and mindfulness grounding without excessive emotional validation.";
    } else {
      customizationPrompt += "\n- Empathy: Deep/High. Be highly validating, reflective, and spacious. Spend quality time unpacking and honoring the user's emotional state before introducing tools.";
    }

    // Response Length
    if (aiResponseLength === 'short') {
      customizationPrompt += "\n- Length Constraints: CRITICAL: Keep replies extremely brief (maximum 1-2 paragraphs). Be precise, neat, and direct.";
    } else if (aiResponseLength === 'long') {
      customizationPrompt += "\n- Length Constraints: Provide comprehensive, detailed support (3-5 paragraphs), potentially breaking down journaling guides or step-by-step breathing tools.";
    } else {
      customizationPrompt += "\n- Length Constraints: Medium length (2-3 paragraphs). Keep it readable and balanced.";
    }

    const systemPromptBase = getLocalizedSystemPrompt(language, voiceStyle);
    const systemPrompt = systemPromptBase + memoryPromptContext + customizationPrompt;

    const encoder = new TextEncoder();

    // Create ReadableStream for Server-Sent Events (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Check if message contains crisis keywords
          const isUserCrisis = detectCrisis(lastMessage);

          if (commonGreetings.includes(normalizedMessage) || normalizedMessage.length <= 3) {
            let text = "";
            if (language === 'hi') {
              text = "नमस्ते! मैं आपका शांत साथी (CalmNest AI) हूँ। आज आप कैसा महसूस कर रहे हैं? इस सुरक्षित जगह में आप अपने मन की कोई भी बात साझा कर सकते हैं।";
            } else if (language === 'pa') {
              text = "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸ਼ਾਂਤ ਸਾਥੀ (CalmNest AI) ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ? ਇਸ ਸੁਰੱਖਿਅਤ ਥਾਂ ਵਿੱਚ ਤੁਸੀਂ ਆਪਣੇ ਮਨ ਦੀ ਕੋਈ ਵੀ ਗੱਲ ਸਾਂਝੀ ਕਰ ਸਕਦੇ ਹੋ।";
            } else {
              text = "Hello! I'm your CalmNest sanctuary companion. How are you feeling today? You can share whatever is on your mind in this safe, quiet space.";
            }

            // Stream simple greeting
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, sentiment, isCrisis: false })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
            return;
          }

          // 2. Call Gemini Stream
          const ai = getGemini();
          const chat = ai.chats.create({ 
            model: "gemini-3.5-flash",
            config: {
              systemInstruction: systemPrompt
            },
            history: messages.slice(0, -1).map((m: any) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content || "" }]
            })),
          });

          const resultStream = await chat.sendMessageStream({ message: lastMessage });
          let accumulatedText = "";

          for await (const chunk of resultStream) {
            const chunkText = chunk.text || "";
            accumulatedText += chunkText;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, sentiment })}\n\n`));
          }

          // 3. Final Crisis Check on accumulated response
          const isResponseCrisis = detectCrisis(accumulatedText);
          const isCrisis = isUserCrisis || isResponseCrisis;

          // Update conversation table if a risk is detected and a conversation ID is provided
          if (isCrisis && conversationId) {
            try {
              await supabase
                .from('conversations')
                .update({ risk_detected: true, updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            } catch (err) {}
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, isCrisis })}\n\n`));
          controller.close();
        } catch (streamErr: any) {
          console.error("Stream generation error:", streamErr);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: streamErr.message || "Error generating content" })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error("Chat Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
