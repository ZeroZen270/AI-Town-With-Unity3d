import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getActiveConversations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getConversationsByLocation = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .order("desc")
      .take(10);
  },
});

export const startConversation = internalMutation({
  args: {
    participants: v.array(v.string()),
    location: v.string(),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      participants: args.participants,
      messages: [],
      location: args.location,
      topic: args.topic,
      isActive: true,
    });
  },
});

export const addMessageToConversation = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    speaker: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const newMessage = {
      speaker: args.speaker,
      content: args.content,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
    });

    // Log activity
    await ctx.db.insert("activities", {
      agentName: args.speaker,
      action: "spoke",
      location: conversation.location,
      timestamp: Date.now(),
      description: `${args.speaker} said: "${args.content}"`,
    });
  },
});

export const generateConversation = internalAction({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.runQuery(internal.internal.getAgentsByLocation, {
      location: args.location,
    });

    if (agents.length < 2) return;

    // Pick 2-3 random agents for conversation
    const shuffled = agents.sort(() => 0.5 - Math.random());
    const participants = shuffled.slice(0, Math.min(3, agents.length));

    // Generate conversation topic
    const topicPrompt = `Generate a conversation topic for ${participants.map((a: any) => `${a.name} (${a.description})`).join(", ")} meeting at ${args.location}. 
    
    Consider their personalities and the location. Return just the topic as a short phrase.`;

    try {
      // Simple topic generation for now
      const topics = ["books and learning", "cooking recipes", "scientific discoveries", "art and creativity", "weather and nature"];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      const conversationId = await ctx.runMutation(internal.conversations.startConversation, {
        participants: participants.map((p: any) => p.name),
        location: args.location,
        topic,
      });

      // Generate 3-5 messages
      const messageCount = Math.floor(Math.random() * 3) + 3;
      let conversationHistory = "";

      for (let i = 0; i < messageCount; i++) {
        const speaker = participants[i % participants.length];
        
        const messagePrompt = `You are ${speaker.name}, ${speaker.description}.
Your personality: ${speaker.personality}
Location: ${args.location}
Topic: ${topic}

Previous conversation:
${conversationHistory}

Generate a natural response that fits your personality and continues the conversation. Keep it conversational and under 100 characters.`;

        // Simple message generation for now
        const responses = [
          "That's really interesting!",
          "I completely agree with you.",
          "Tell me more about that.",
          "I have a different perspective on this.",
          "That reminds me of something similar.",
        ];
        const content = `${responses[Math.floor(Math.random() * responses.length)]}`;
        if (!content) continue;

        await ctx.runMutation(internal.conversations.addMessageToConversation, {
          conversationId,
          speaker: speaker.name,
          content,
        });

        conversationHistory += `${speaker.name}: ${content}\n`;
      }

      // End conversation
      setTimeout(async () => {
        await ctx.runMutation(internal.conversations.endConversation, {
          conversationId,
        });
      }, 30000); // End after 30 seconds

    } catch (error) {
      console.error("Error generating conversation:", error);
    }
  },
});

export const endConversation = internalMutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isActive: false,
    });
  },
});
