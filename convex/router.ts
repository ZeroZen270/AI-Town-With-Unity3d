import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const http = httpRouter();

// Health check endpoint for container monitoring
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({
      status: "healthy",
      timestamp: Date.now(),
      service: "ai-town-api"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  })
});

// Unity 3D Integration Endpoints
http.route({
  path: "/unity/agents",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const agents = await ctx.runQuery(internal.internal.listAgents);
      const locations = await ctx.runQuery(internal.internal.getAllLocations);
      
      // Create a map of location names to coordinates (Unity will need these)
      const locationCoords: Record<string, { x: number; y: number; z: number }> = {
        "Library": { x: -10, y: 0, z: 5 },
        "Cafe": { x: 0, y: 0, z: 10 },
        "Lab": { x: 10, y: 0, z: 5 },
        "Art Studio": { x: -5, y: 0, z: -10 },
        "Gym": { x: 5, y: 0, z: -10 },
        "Park": { x: 0, y: 0, z: 0 },
        "Town Square": { x: 0, y: 0, z: -5 }
      };

      const agentsWithPositions = agents.map((agent: any) => ({
        id: agent._id,
        name: agent.name,
        avatar: agent.avatar,
        description: agent.description,
        personality: agent.personality,
        currentLocation: agent.currentLocation,
        currentActivity: agent.currentActivity,
        lastActive: agent.lastActive,
        position: locationCoords[agent.currentLocation] || { x: 0, y: 0, z: 0 },
        memories: agent.memories,
        relationships: agent.relationships
      }));

      return new Response(JSON.stringify({
        agents: agentsWithPositions,
        locations: locations.map((loc: any) => ({
          name: loc.name,
          description: loc.description,
          type: loc.type,
          capacity: loc.capacity,
          currentAgents: loc.currentAgents,
          position: locationCoords[loc.name] || { x: 0, y: 0, z: 0 }
        })),
        timestamp: Date.now()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Failed to fetch agents",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
});

http.route({
  path: "/unity/activities",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "20");
      
      const activities = await ctx.runQuery(api.activities.getRecentActivities, { limit });
      
      return new Response(JSON.stringify({
        activities: activities.map((activity: any) => ({
          id: activity._id,
          agentName: activity.agentName,
          action: activity.action,
          location: activity.location,
          timestamp: activity.timestamp,
          description: activity.description
        })),
        timestamp: Date.now()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Failed to fetch activities",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
});

http.route({
  path: "/unity/conversations",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const conversations = await ctx.runQuery(api.conversations.getActiveConversations);
      
      return new Response(JSON.stringify({
        conversations: conversations.map((conv: any) => ({
          id: conv._id,
          participants: conv.participants,
          location: conv.location,
          topic: conv.topic,
          messages: conv.messages.slice(-3), // Last 3 messages for speech bubbles
          isActive: conv.isActive
        })),
        timestamp: Date.now()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
});

http.route({
  path: "/unity/trigger-action",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { agentName } = await request.json();
      
      if (!agentName) {
        return new Response(JSON.stringify({ error: "agentName is required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      await ctx.runAction(internal.agents.generateAgentAction, { agentName });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Triggered action for ${agentName}` 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Failed to trigger action",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
});

http.route({
  path: "/unity/initialize",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      await ctx.runMutation(api.agents.initializeAgents);
      await ctx.runMutation(api.agents.initializeLocations);
      await ctx.runMutation(api.simulation.startSimulation);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Simulation initialized successfully" 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  })
});

// Handle CORS preflight requests for all Unity endpoints
const corsHandler = httpAction(async (ctx, request) => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
});

http.route({
  path: "/unity/agents",
  method: "OPTIONS",
  handler: corsHandler
});

http.route({
  path: "/unity/activities",
  method: "OPTIONS",
  handler: corsHandler
});

http.route({
  path: "/unity/conversations",
  method: "OPTIONS",
  handler: corsHandler
});

http.route({
  path: "/unity/trigger-action",
  method: "OPTIONS",
  handler: corsHandler
});

http.route({
  path: "/unity/initialize",
  method: "OPTIONS",
  handler: corsHandler
});

export default http;
