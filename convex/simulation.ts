import { internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const runSimulationStep = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all agents
    const agents = await ctx.runQuery(internal.internal.listAgents);
    
    // Randomly select some agents to take actions
    const activeAgents = agents.filter(() => Math.random() < 0.3); // 30% chance each agent acts
    
    for (const agent of activeAgents) {
      // Generate action for agent
      await ctx.runAction(internal.agents.generateAgentAction, {
        agentName: agent.name,
      });
    }

    // Generate conversations in locations with multiple agents
    const locations = await ctx.runQuery(internal.internal.getAllLocations);
    
    for (const location of locations) {
      if (location.currentAgents.length >= 2 && Math.random() < 0.2) { // 20% chance
        await ctx.runAction(internal.conversations.generateConversation, {
          location: location.name,
        });
      }
    }
  },
});

export const startSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    // Schedule the simulation to run every 10 seconds
    await ctx.scheduler.runAfter(10000, internal.simulation.runSimulationStep);
    await ctx.scheduler.runAfter(20000, internal.simulation.runSimulationStep);
    await ctx.scheduler.runAfter(30000, internal.simulation.runSimulationStep);
    await ctx.scheduler.runAfter(40000, internal.simulation.runSimulationStep);
    await ctx.scheduler.runAfter(50000, internal.simulation.runSimulationStep);
  },
});
