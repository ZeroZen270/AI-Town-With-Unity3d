"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

export const initializeRAG = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Create collections for different types of knowledge
      const collections = ["agent_memories", "world_knowledge", "conversation_history"];
      
      for (const collectionName of collections) {
        try {
          await chroma.getCollection({ name: collectionName });
          console.log(`Collection ${collectionName} already exists`);
        } catch (error) {
          await chroma.createCollection({
            name: collectionName,
            metadata: { description: `AI Town ${collectionName}` },
          });
          console.log(`Created collection ${collectionName}`);
        }
      }

      return { success: true, message: "RAG system initialized" };
    } catch (error) {
      console.error("RAG initialization error:", error);
      throw new Error(`Failed to initialize RAG: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const storeMemory = action({
  args: {
    agentName: v.string(),
    content: v.string(),
    importance: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Generate embedding for the memory (disabled for now)
      const embedding = Array(768).fill(0).map(() => Math.random()); // Dummy embedding

      // Store in ChromaDB
      const collection = await chroma.getCollection({ name: "agent_memories" });
      const memoryId = `${args.agentName}_${Date.now()}`;
      
      await collection.add({
        ids: [memoryId],
        embeddings: [embedding],
        documents: [args.content],
        metadatas: [{
          agentName: args.agentName,
          importance: args.importance,
          timestamp: Date.now(),
          tags: args.tags.join(","),
        }],
      });

      // Also store in Convex for persistence
      await ctx.runMutation(internal.memories.createMemory, {
        agentName: args.agentName,
        content: args.content,
        importance: args.importance,
        embedding,
        tags: args.tags,
      });

      return { success: true, memoryId };
    } catch (error) {
      console.error("Store memory error:", error);
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const retrieveRelevantMemories = action({
  args: {
    agentName: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    try {
      // Generate embedding for the query (disabled for now)
      const queryEmbedding: any = Array(768).fill(0).map(() => Math.random()); // Dummy embedding

      // Search in ChromaDB
      const collection = await chroma.getCollection({ name: "agent_memories" });
      const results: any = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: args.limit || 5,
        where: { agentName: args.agentName },
      });

      const memories = results.documents[0]?.map((doc: any, index: number) => ({
        content: doc,
        distance: results.distances?.[0]?.[index] || 0,
        metadata: results.metadatas?.[0]?.[index],
      })) || [];

      return memories;
    } catch (error) {
      console.error("Retrieve memories error:", error);
      return [];
    }
  },
});

export const storeWorldKnowledge = action({
  args: {
    topic: v.string(),
    content: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const embedding = Array(768).fill(0).map(() => Math.random()); // Dummy embedding

      const collection = await chroma.getCollection({ name: "world_knowledge" });
      const knowledgeId = `${args.topic}_${Date.now()}`;
      
      await collection.add({
        ids: [knowledgeId],
        embeddings: [embedding],
        documents: [args.content],
        metadatas: [{
          topic: args.topic,
          source: args.source,
          timestamp: Date.now(),
        }],
      });

      await ctx.runMutation(internal.knowledge.createKnowledge, {
        topic: args.topic,
        content: args.content,
        embedding,
        source: args.source,
        relevance: 1.0,
      });

      return { success: true, knowledgeId };
    } catch (error) {
      console.error("Store knowledge error:", error);
      throw new Error(`Failed to store knowledge: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const retrieveWorldKnowledge = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    try {
      const queryEmbedding: any = Array(768).fill(0).map(() => Math.random()); // Dummy embedding

      const collection = await chroma.getCollection({ name: "world_knowledge" });
      const results: any = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: args.limit || 3,
      });

      const knowledge = results.documents[0]?.map((doc: any, index: number) => ({
        content: doc,
        distance: results.distances?.[0]?.[index] || 0,
        metadata: results.metadatas?.[0]?.[index],
      })) || [];

      return knowledge;
    } catch (error) {
      console.error("Retrieve knowledge error:", error);
      return [];
    }
  },
});
