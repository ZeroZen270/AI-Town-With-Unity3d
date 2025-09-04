import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecentActivities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 20);
  },
});

export const getActivitiesByLocation = query({
  args: { location: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("location"), args.location))
      .order("desc")
      .take(args.limit || 10);
  },
});

export const logActivity = internalMutation({
  args: {
    agentName: v.string(),
    action: v.string(),
    location: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      agentName: args.agentName,
      action: args.action,
      location: args.location,
      timestamp: Date.now(),
      description: args.description,
    });
  },
});
