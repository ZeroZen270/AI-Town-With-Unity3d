/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as knowledge from "../knowledge.js";
import type * as llm from "../llm.js";
import type * as memories from "../memories.js";
import type * as rag from "../rag.js";
import type * as router from "../router.js";
import type * as simulation from "../simulation.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  agents: typeof agents;
  auth: typeof auth;
  conversations: typeof conversations;
  http: typeof http;
  internal: typeof internal_;
  knowledge: typeof knowledge;
  llm: typeof llm;
  memories: typeof memories;
  rag: typeof rag;
  router: typeof router;
  simulation: typeof simulation;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
