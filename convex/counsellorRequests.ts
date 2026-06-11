import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    user_id: v.string(),
    thought_original: v.optional(v.string()),
    situation_text: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("counsellorRequests", args);
  },
});
