import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  agents: defineTable({
    name: v.string(),
    avatar: v.string(),
    description: v.string(),
    personality: v.string(),
    currentLocation: v.string(),
    currentActivity: v.string(),
    lastActive: v.number(),
    memories: v.array(v.string()),
    relationships: v.object({}),
    embedding: v.optional(v.array(v.number())), // For RAG similarity search
  })
    .index("by_name", ["name"])
    .index("by_location", ["currentLocation"]),

  locations: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.string(),
    capacity: v.number(),
    currentAgents: v.array(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_type", ["type"]),

  conversations: defineTable({
    participants: v.array(v.string()),
    location: v.string(),
    topic: v.string(),
    messages: v.array(v.object({
      speaker: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
    isActive: v.boolean(),
  })
    .index("by_location", ["location"])
    .index("by_active", ["isActive"]),

  activities: defineTable({
    agentName: v.string(),
    action: v.string(),
    location: v.string(),
    timestamp: v.number(),
    description: v.string(),
  })
    .index("by_agent", ["agentName"])
    .index("by_timestamp", ["timestamp"]),

  memories: defineTable({
    agentName: v.string(),
    content: v.string(),
    importance: v.number(),
    timestamp: v.number(),
    embedding: v.array(v.number()),
    tags: v.array(v.string()),
  })
    .index("by_agent", ["agentName"])
    .index("by_importance", ["importance"])
    .index("by_timestamp", ["timestamp"]),

  knowledge: defineTable({
    topic: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    source: v.string(),
    relevance: v.number(),
  })
    .index("by_topic", ["topic"])
    .index("by_relevance", ["relevance"]),

  simulation: defineTable({
    isRunning: v.boolean(),
    currentTime: v.number(),
    timeScale: v.number(),
    lastUpdate: v.number(),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
