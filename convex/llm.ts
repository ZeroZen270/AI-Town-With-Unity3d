"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

export const generateResponse = action({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await ollama.chat({
        model: args.model || "llama3.2:3b",
        messages: [
          ...(args.systemPrompt ? [{ role: "system", content: args.systemPrompt }] : []),
          { role: "user", content: args.prompt },
        ],
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error("Ollama error:", error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const generateEmbedding = action({
  args: {
    text: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await ollama.embeddings({
        model: args.model || "nomic-embed-text",
        prompt: args.text,
      });

      return response.embedding;
    } catch (error) {
      console.error("Ollama embedding error:", error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export const listModels = action({
  args: {},
  handler: async (ctx) => {
    try {
      const response = await ollama.list();
      return response.models.map(model => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
      }));
    } catch (error) {
      console.error("Ollama list models error:", error);
      return [];
    }
  },
});
