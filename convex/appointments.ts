import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Create an appointment (Admin only) with conflict check */
export const createAppointment = mutation({
  args: {
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const caller = await ctx.db.get(identity.subject as Id<"users">);
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: Admin access required.");
    }

    if (args.startTime >= args.endTime) {
      throw new Error("Invalid time range: Start time must be before end time.");
    }

    const MAX_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms
    if (args.endTime - args.startTime > MAX_DURATION) {
      throw new Error("Invalid slot: Sessions cannot exceed 4 hours.");
    }

    // slot conflict validation - prevent double booking
    // Only search appointments starting up to 4 hours before the requested start time, up to the end time
    const activeAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q
          .gte("startTime", args.startTime - MAX_DURATION)
          .lt("startTime", args.endTime)
      )
      .collect();

    const overlap = activeAppointments.some((appt) => {
      if (appt.status !== "scheduled") return false;
      // Overlap formula: (startA < endB) && (endA > startB)
      return args.startTime < appt.endTime && args.endTime > appt.startTime;
    });

    if (overlap) {
      throw new Error("Conflict: This slot is already booked by another appointment.");
    }

    const appointmentId = await ctx.db.insert("appointments", {
      userId: args.userId,
      startTime: args.startTime,
      endTime: args.endTime,
      description: args.description,
      status: "scheduled",
      createdAt: Date.now(),
    });

    return appointmentId;
  },
});

/** List all appointments with patient details joined (Admin only) */
export const listAllAppointments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const caller = await ctx.db.get(identity.subject as Id<"users">);
    if (!caller || caller.role !== "admin") return [];

    // Limit query to last 7 days of appointments up to future ones, and take max 100
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) => q.gte("startTime", sevenDaysAgo))
      .take(100);
    const results = [];

    for (const appt of appointments) {
      const patient = await ctx.db.get(appt.userId);
      results.push({
        ...appt,
        patientName: patient?.full_name || "Unknown Patient",
        patientPhone: patient?.mobile_number || "N/A",
      });
    }

    // Sort by startTime ascending
    return results.sort((a, b) => a.startTime - b.startTime);
  },
});

/** Retrieve appointments for the authenticated patient */
export const getPatientAppointments = query({
  args: { userId: v.string() }, // Clerk userId or subject ID
  handler: async (ctx, args) => {
    let dbUser = await ctx.db.get(args.userId as Id<"users">);
    if (!dbUser) {
      dbUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .first();
    }
    if (!dbUser) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", dbUser!._id))
      .take(50);

    // Sort by startTime ascending
    return appointments.sort((a, b) => a.startTime - b.startTime);
  },
});

/** Cancel an appointment (Admin only) */
export const cancelAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const caller = await ctx.db.get(identity.subject as Id<"users">);
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

/** Update an appointment (Admin only) with conflict check */
export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const caller = await ctx.db.get(identity.subject as Id<"users">);
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: Admin access required.");
    }

    if (args.startTime >= args.endTime) {
      throw new Error("Invalid time range: Start time must be before end time.");
    }

    const MAX_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms
    if (args.endTime - args.startTime > MAX_DURATION) {
      throw new Error("Invalid slot: Sessions cannot exceed 4 hours.");
    }

    // slot conflict validation - prevent double booking
    // Only search appointments starting up to 4 hours before the requested start time, up to the end time
    const activeAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q
          .gte("startTime", args.startTime - MAX_DURATION)
          .lt("startTime", args.endTime)
      )
      .collect();

    const overlap = activeAppointments.some((appt) => {
      if (appt._id === args.appointmentId) return false; // skip self
      if (appt.status !== "scheduled") return false;
      // Overlap formula: (startA < endB) && (endA > startB)
      return args.startTime < appt.endTime && args.endTime > appt.startTime;
    });

    if (overlap) {
      throw new Error("Conflict: This slot is already booked by another appointment.");
    }

    await ctx.db.patch(args.appointmentId, {
      userId: args.userId,
      startTime: args.startTime,
      endTime: args.endTime,
      description: args.description,
    });

    return { success: true };
  },
});

export const tempGetAppointments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appointments").collect();
  }
});
