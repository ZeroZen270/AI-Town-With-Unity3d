import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const initializeAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const existingAgents = await ctx.db.query("agents").collect();
    if (existingAgents.length > 0) {
      return { message: "Agents already initialized" };
    }

    const agents = [
      {
        name: "Alice",
        avatar: "👩‍🏫",
        description: "A friendly librarian who loves books and helping others learn",
        personality: "Introverted, thoughtful, patient, and knowledgeable. Enjoys quiet conversations about literature and history.",
        currentLocation: "Library",
        currentActivity: "Reading",
        lastActive: Date.now(),
        memories: ["I love organizing books", "Students often ask me for research help"],
        relationships: {},
      },
      {
        name: "Bob",
        avatar: "👨‍🍳",
        description: "An enthusiastic chef who runs the local cafe",
        personality: "Extroverted, creative, energetic, and social. Loves trying new recipes and chatting with customers.",
        currentLocation: "Cafe",
        currentActivity: "Cooking",
        lastActive: Date.now(),
        memories: ["My specialty is homemade pasta", "I enjoy meeting new people"],
        relationships: {},
      },
      {
        name: "Charlie",
        avatar: "👨‍🔬",
        description: "A curious scientist working on various experiments",
        personality: "Analytical, curious, methodical, and innovative. Fascinated by how things work.",
        currentLocation: "Lab",
        currentActivity: "Experimenting",
        lastActive: Date.now(),
        memories: ["I'm working on a new renewable energy project", "Science can solve many problems"],
        relationships: {},
      },
      {
        name: "Diana",
        avatar: "👩‍🎨",
        description: "A creative artist who paints beautiful landscapes",
        personality: "Creative, emotional, expressive, and intuitive. Sees beauty in everyday moments.",
        currentLocation: "Art Studio",
        currentActivity: "Painting",
        lastActive: Date.now(),
        memories: ["Nature inspires my best work", "Art is a way to connect with others"],
        relationships: {},
      },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", agent);
    }

    return { message: "Agents initialized successfully" };
  },
});

export const initializeLocations = mutation({
  args: {},
  handler: async (ctx) => {
    const existingLocations = await ctx.db.query("locations").collect();
    if (existingLocations.length > 0) {
      return { message: "Locations already initialized" };
    }

    const locations = [
      {
        name: "Library",
        description: "A quiet place filled with books and knowledge",
        type: "social",
        capacity: 10,
        currentAgents: ["Alice"],
      },
      {
        name: "Cafe",
        description: "A cozy spot for coffee, food, and conversation",
        type: "social",
        capacity: 15,
        currentAgents: ["Bob"],
      },
      {
        name: "Lab",
        description: "A modern laboratory for scientific research",
        type: "work",
        capacity: 5,
        currentAgents: ["Charlie"],
      },
      {
        name: "Art Studio",
        description: "A creative space filled with art supplies and inspiration",
        type: "creative",
        capacity: 8,
        currentAgents: ["Diana"],
      },
      {
        name: "Park",
        description: "A peaceful outdoor area with trees and benches",
        type: "recreation",
        capacity: 20,
        currentAgents: [],
      },
      {
        name: "Town Square",
        description: "The central meeting place of the town",
        type: "social",
        capacity: 30,
        currentAgents: [],
      },
    ];

    for (const location of locations) {
      await ctx.db.insert("locations", location);
    }

    return { message: "Locations initialized successfully" };
  },
});

export const generateAgentAction = internalAction({
  args: {
    agentName: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get agent data
    const agent: any = await ctx.runQuery(internal.internal.getAgentByName, {
      name: args.agentName,
    });

    if (!agent) {
      throw new Error(`Agent ${args.agentName} not found`);
    }

    // Create context for the LLM using agent's existing memories
    const memoryContext = agent.memories.slice(-3).join(". ");
    const knowledgeContext = `${agent.currentLocation} is a place for ${agent.currentActivity.toLowerCase()}.`;

    const prompt = `You are ${agent.name}, ${agent.description}. 
Personality: ${agent.personality}
Current location: ${agent.currentLocation}
Current activity: ${agent.currentActivity}
Recent memories: ${memoryContext}

Decide what you should do next. Consider your personality and current location. 
Respond with a JSON object containing:
- action: brief description of the action
- newActivity: what you'll be doing
- newLocation: where you'll go (can be same as current)
- thought: your internal reasoning
- memory: something worth remembering about this decision

What should I do next?`;

    try {
      // For now, use simple rule-based behavior until Ollama is set up
      const activities = ["Reading", "Cooking", "Experimenting", "Painting", "Socializing", "Resting"];
      const locations = ["Library", "Cafe", "Lab", "Art Studio", "Park", "Town Square"];
      
      const actionData = {
        action: `Decided to ${activities[Math.floor(Math.random() * activities.length)].toLowerCase()}`,
        newActivity: activities[Math.floor(Math.random() * activities.length)],
        newLocation: Math.random() > 0.7 ? locations[Math.floor(Math.random() * locations.length)] : agent.currentLocation,
        thought: `As ${agent.name}, I'm following my ${agent.personality.split(',')[0].toLowerCase()} nature`,
        memory: `I decided to change my activity based on my personality`,
      };

      // Update agent state
      await ctx.runMutation(internal.agents.updateAgentState, {
        agentName: args.agentName,
        newActivity: actionData.newActivity,
        newLocation: actionData.newLocation,
      });

      // Store the memory in agent's memory array
      if (actionData.memory) {
        const updatedMemories = [...agent.memories, actionData.memory].slice(-10); // Keep last 10 memories
        await ctx.runMutation(internal.agents.updateAgentMemories, {
          agentName: args.agentName,
          memories: updatedMemories,
        });
      }

      // Log the activity
      await ctx.runMutation(internal.activities.logActivity, {
        agentName: args.agentName,
        action: actionData.action,
        location: actionData.newLocation,
        description: actionData.thought,
      });

      return actionData;
    } catch (error) {
      console.error(`Error generating action for ${args.agentName}:`, error);
      return {
        action: "Rest",
        newActivity: "Resting",
        newLocation: agent.currentLocation,
        thought: "Taking a moment to rest",
        memory: "I took some time to rest and think",
      };
    }
  },
});

export const updateAgentState = internalMutation({
  args: {
    agentName: v.string(),
    newActivity: v.string(),
    newLocation: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .unique();

    if (!agent) {
      throw new Error(`Agent ${args.agentName} not found`);
    }

    // Update agent
    await ctx.db.patch(agent._id, {
      currentActivity: args.newActivity,
      currentLocation: args.newLocation,
      lastActive: Date.now(),
    });

    // Update location occupancy
    if (agent.currentLocation !== args.newLocation) {
      // Remove from old location
      const oldLocation = await ctx.db
        .query("locations")
        .withIndex("by_name", (q) => q.eq("name", agent.currentLocation))
        .unique();

      if (oldLocation) {
        const updatedAgents = oldLocation.currentAgents.filter(name => name !== args.agentName);
        await ctx.db.patch(oldLocation._id, { currentAgents: updatedAgents });
      }

      // Add to new location
      const newLocation = await ctx.db
        .query("locations")
        .withIndex("by_name", (q) => q.eq("name", args.newLocation))
        .unique();

      if (newLocation && !newLocation.currentAgents.includes(args.agentName)) {
        const updatedAgents = [...newLocation.currentAgents, args.agentName];
        await ctx.db.patch(newLocation._id, { currentAgents: updatedAgents });
      }
    }

    return { success: true };
  },
});

export const getAllAgents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getAgentByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});

export const getAllLocations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect();
  },
});

export const getAgentsByLocation = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_location", (q) => q.eq("currentLocation", args.location))
      .collect();
  },
});

export const updateAgentMemories = internalMutation({
  args: {
    agentName: v.string(),
    memories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .unique();

    if (!agent) {
      throw new Error(`Agent ${args.agentName} not found`);
    }

    await ctx.db.patch(agent._id, {
      memories: args.memories,
    });

    return { success: true };
  },
});
