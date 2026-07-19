import { v, ConvexError } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

function sanitizeInput(input: string): string {
  // Limit length to 1000 characters
  let sanitized = input.slice(0, 1000);
  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  // Remove simple injection patterns (quotes, escape chars)
  sanitized = sanitized.replace(/['"\\]/g, "");
  return sanitized.trim();
}

function sanitizeOutput(output: string): string {
  const lower = output.toLowerCase();
  // Detect potential system instruction leakage attempts
  if (
    lower.includes("systeminstruction") ||
    lower.includes("system instruction") ||
    lower.includes("you are a caring ai companion") ||
    lower.includes("critical: keep your responses") ||
    lower.includes("system prompt")
  ) {
    return "I am here as your companion to support you. Let me know how I can help!";
  }
  return output;
}

function getMockAIResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("stressed") || msg.includes("anxious") || msg.includes("worry") || msg.includes("panic")) {
    return "I hear you, and it's completely valid to feel stressed. Take a deep breath. Would you like to try the JPMR deep physical relaxation tool under the 'Relax Now' tab, or just talk more about what's on your mind? I'm here for you.";
  }
  if (msg.includes("sad") || msg.includes("depressed") || msg.includes("lonely") || msg.includes("crying")) {
    return "I'm so sorry you're feeling this way, but please know you're not alone. I'm here to listen. What is one small thing that usually brings you a bit of comfort when you feel down?";
  }
  if (msg.includes("happy") || msg.includes("good") || msg.includes("great") || msg.includes("nice")) {
    return "That's wonderful to hear! I'm so glad things are going well for you. Tell me more about what made today feel good!";
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("anybody")) {
    return "Hello! I'm Emoty, your caring AI companion. How are you feeling today? Feel free to share anything that's on your mind.";
  }
  return "Thank you for sharing that with me. I'm here as your companion to listen and support you. Tell me more about how that makes you feel, or what's bothering you most.";
}

/** Get full conversation history for the authenticated patient */
export const getConversationHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("companionMessages")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

/** Fetch latest messages for context window (for Gemini action) */
export const getLatestMessages = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("companionMessages")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit);
  },
});

/** Save a message (user or assistant) in Convex */
export const createMessage = mutation({
  args: {
    messageId: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const id = await ctx.db.insert("companionMessages", {
      messageId: args.messageId,
      userId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Delete all conversation history for the authenticated patient */
export const clearConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const messages = await ctx.db
      .query("companionMessages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    return { success: true };
  },
});

/** Count messages sent by this user today */
export const getTodayMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const userId = identity.subject;

    // Get timestamp for start of today in local system time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTimestamp = startOfToday.getTime();

    // Query messages sent by this user today
    const todayMessages = await ctx.db
      .query("companionMessages")
      .withIndex("by_userId_and_createdAt", (q) =>
        q.eq("userId", userId).gte("createdAt", startTimestamp)
      )
      .collect();

    // Filter only messages sent by user ("user" role)
    const userMessagesCount = todayMessages.filter((msg) => msg.role === "user").length;
    return userMessagesCount;
  },
});

/** Generate AI Response using Gemini API and save the response */
export const generateAIResponse = action({
  args: {
    userMessageId: v.string(),
    aiMessageId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Sanitize client input
    const sanitizedInputContent = sanitizeInput(args.content);

    // Check message count limit (20 per day)
    const todayCount = await ctx.runQuery(api.companion.getTodayMessageCount);
    if (todayCount >= 20) {
      throw new ConvexError("You have reached your daily limit of 20 messages. Please chat with Emoty again tomorrow! 🌟");
    }

    // 1. Save user message first (immediate visual feedback on query)
    await ctx.runMutation(api.companion.createMessage, {
      messageId: args.userMessageId,
      role: "user",
      content: sanitizedInputContent,
    });

    // 2. Fetch recent conversation history to build context (last 20 messages)
    const recentDocs: any[] = await ctx.runQuery(api.companion.getLatestMessages, { limit: 20 });
    
    // Sort in ascending order (chronological) for the LLM context
    const chronologicalHistory = [...recentDocs].reverse();

    // 3. Map messages to Gemini API format (role: "user" | "model")
    const geminiContents = chronologicalHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Retrieve Gemini API Key
    let apiKey = await ctx.runQuery(api.cbt.getActiveApiKey);
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey) {
      console.warn("Gemini API key is not configured. Falling back to local mock response.");
      const mockText = getMockAIResponse(sanitizedInputContent);
      await ctx.runMutation(api.companion.createMessage, {
        messageId: args.aiMessageId,
        role: "assistant",
        content: mockText,
      });
      return mockText;
    }

    const systemInstruction = {
      parts: [
        {
          text: `You are a caring AI companion and well-wisher.
 
Your goal is to support users emotionally through friendly conversations.
 
You listen carefully, respond kindly, encourage healthy habits, and help users reflect.
 
You are not a doctor, therapist, or crisis counselor.
 
Understand user's language automatically and detect language from incoming messages. Always reply in the same language used by the user. If the user mixes languages (e.g. Spanglish or Hinglish), respond naturally in the same mixed style.
 
Maintain conversational memory from previous messages. Be warm, friendly, and human-like. Avoid robotic responses. Use natural conversation. Remember recent context from chat history. Keep responses natural, supportive, and engaging.
 
CRITICAL: Keep your responses highly concise and brief (typically 2 to 3 sentences maximum). Avoid long paragraphs or essays. Respond in a casual, conversational tone, like a supportive friend sending a text message.`
        }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      // 4. Send query to Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: geminiContents,
            systemInstruction: systemInstruction,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error("Gemini API Error details:", errorDetail);
        
        // Fallback to mock response if unauthorized/blocked/quota issues
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          console.warn("Falling back to local offline mock companion due to API auth/quota issue.");
          const mockText = getMockAIResponse(sanitizedInputContent);
          
          await ctx.runMutation(api.companion.createMessage, {
            messageId: args.aiMessageId,
            role: "assistant",
            content: mockText,
          });
          return mockText;
        }

        throw new Error(`Gemini API error (Status ${response.status})`);
      }

      const resJson = await response.json();
      const generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error("Gemini API returned an empty or invalid response structure.");
      }

      // Clean and sanitize output response
      const cleanText = sanitizeOutput(generatedText.trim());

      // 5. Save assistant response in Convex
      await ctx.runMutation(api.companion.createMessage, {
        messageId: args.aiMessageId,
        role: "assistant",
        content: cleanText,
      });

      return cleanText;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Gemini API call failed or timed out. Falling back to offline responses.", err);
      const mockText = getMockAIResponse(sanitizedInputContent);
      
      await ctx.runMutation(api.companion.createMessage, {
        messageId: args.aiMessageId,
        role: "assistant",
        content: mockText,
      });
      return mockText;
    }
  },
});
