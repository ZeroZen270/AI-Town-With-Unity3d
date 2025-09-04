import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createKnowledge = internalMutation({
  args: {
    topic: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    source: v.string(),
    relevance: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("knowledge", {
      topic: args.topic,
      content: args.content,
      embedding: args.embedding,
      source: args.source,
      relevance: args.relevance,
    });
  },
});

export const getKnowledgeByTopic = query({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knowledge")
      .withIndex("by_topic", (q) => q.eq("topic", args.topic))
      .collect();
  },
});

export const getAllKnowledge = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("knowledge").collect();
  },
});
