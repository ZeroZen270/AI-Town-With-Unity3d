import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createMemory = internalMutation({
  args: {
    agentName: v.string(),
    content: v.string(),
    importance: v.number(),
    embedding: v.array(v.number()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      agentName: args.agentName,
      content: args.content,
      importance: args.importance,
      timestamp: Date.now(),
      embedding: args.embedding,
      tags: args.tags,
    });
  },
});

export const getMemoriesByAgent = query({
  args: {
    agentName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .order("desc")
      .take(args.limit || 10);
  },
});

export const getImportantMemories = query({
  args: {
    agentName: v.string(),
    minImportance: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .filter((q) => q.gte(q.field("importance"), args.minImportance))
      .order("desc")
      .collect();
  },
});
