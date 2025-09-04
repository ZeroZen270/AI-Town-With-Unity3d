import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getAgentByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();
  },
});

export const getAllLocations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect();
  },
});

export const getRecentActivities = internalQuery({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .order("desc")
      .take(5);
  },
});

export const listAgents = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getAgentsByLocation = internalQuery({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_location", (q) => q.eq("currentLocation", args.location))
      .collect();
  },
});
