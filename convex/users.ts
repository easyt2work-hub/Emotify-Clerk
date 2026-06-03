import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getOrCreateKeyPair, signJwt, verifyPassword, hashPassword } from "./authHelpers";

/** Get or create key pair internally for JWKS */
export const getOrCreateKeyPairMutation = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await getOrCreateKeyPair(ctx);
  },
});

/** Authenticate a user by mobile number and password */
export const authenticateUser = internalMutation({
  args: { mobile_number: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .first();

    if (!user) {
      return { error: "Invalid mobile number or password" };
    }

    if (user.status === "inactive") {
      return { error: "Account is inactive. Please contact administrator." };
    }

    if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
      const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      return { error: `Account locked due to multiple failures. Try again in ${minutesLeft} minute(s).` };
    }

    const isValid = await verifyPassword(args.password, user.password_hash || "");
    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const patchData: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        patchData.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins lockout
        patchData.failedLoginAttempts = 0; // reset
        await ctx.db.patch(user._id, patchData);
        return { error: "Too many failed attempts. Account locked for 15 minutes." };
      }
      await ctx.db.patch(user._id, patchData);
      return { error: "Invalid mobile number or password" };
    }

    // Reset login attempts
    await ctx.db.patch(user._id, {
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
      lastLoginAt: Date.now(),
    });

    // Generate JWT
    const token = await signJwt(ctx, {
      sub: user._id,
      role: user.role || "patient",
      mobile_number: user.mobile_number || "",
      full_name: user.full_name || "",
    });

    // Generate Refresh Token
    const refreshToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("refreshTokens", {
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    return {
      token,
      refreshToken,
      user: {
        id: user._id,
        full_name: user.full_name,
        mobile_number: user.mobile_number,
        role: user.role,
        status: user.status,
        is_first_login: user.is_first_login,
        onboardingComplete: user.onboardingComplete || false,
        screeningComplete: user.screeningComplete || false,
      },
    };
  },
});

/** Refresh access token using refresh token */
export const refreshUserToken = internalMutation({
  args: { refreshToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("refreshTokens")
      .withIndex("by_token", (q) => q.eq("token", args.refreshToken))
      .first();

    if (!session || Date.now() > session.expiresAt) {
      if (session) await ctx.db.delete(session._id);
      return { error: "Invalid or expired session" };
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status === "inactive") {
      await ctx.db.delete(session._id);
      return { error: "User is inactive or not found" };
    }

    const token = await signJwt(ctx, {
      sub: user._id,
      role: user.role || "patient",
      mobile_number: user.mobile_number || "",
      full_name: user.full_name || "",
    });

    // Extend expiry time of the existing refresh token
    await ctx.db.patch(session._id, {
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    });

    return {
      token,
      refreshToken: args.refreshToken,
    };
  },
});

/** Generate OTP for Password Reset */
export const generatePasswordResetOtp = internalMutation({
  args: { mobile_number: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .first();

    if (!user) {
      return { error: "User with this mobile number does not exist" };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Clear old OTPs
    const existing = await ctx.db
      .query("otps")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.insert("otps", {
      mobile_number: args.mobile_number,
      code,
      expiresAt,
    });

    console.log(`[OTP] Mobile: ${args.mobile_number}, Code: ${code}`);

    return {
      message: `OTP sent successfully. (Developer Mode: OTP is ${code})`,
    };
  },
});

/** Reset password using OTP verification */
export const resetPasswordWithOtp = internalMutation({
  args: { mobile_number: v.string(), otp: v.string(), new_password: v.string() },
  handler: async (ctx, args) => {
    const otpRecord = await ctx.db
      .query("otps")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .filter((q) => q.eq(q.field("code"), args.otp))
      .first();

    if (!otpRecord || Date.now() > otpRecord.expiresAt) {
      return { error: "Invalid or expired OTP code" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .first();

    if (!user) {
      return { error: "User not found" };
    }

    const password_hash = await hashPassword(args.new_password);
    await ctx.db.patch(user._id, {
      password_hash,
      is_first_login: false,
      updated_at: Date.now(),
    });

    await ctx.db.delete(otpRecord._id);
    return { success: true };
  },
});

/** Get user by ID (for compatibility with getByClerkId) */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.clerkId as Id<"users">);
      if (user) return user;
    } catch (e) {
      // Ignore conversion error
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

/** Required Admin Auth Helper */
async function checkAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db.get(identity.subject as Id<"users">);
  if (!user || user.role !== "admin") return null;
  return user;
}

/** Admin: List all patient users */
export const listPatients = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await checkAdmin(ctx);
    if (!admin) return [];

    let users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "patient"))
      .collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(s) ||
          (u.mobile_number || "").includes(s)
      );
    }

    return users;
  },
});

/** Admin: Create a new user (patient or admin) */
export const createUser = mutation({
  args: {
    full_name: v.string(),
    mobile_number: v.string(),
    email: v.optional(v.string()),
    password: v.string(),
    status: v.string(), // "active" | "inactive"
    role: v.string(), // "admin" | "patient"
  },
  handler: async (ctx, args) => {
    const admin = await checkAdmin(ctx);
    if (!admin) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .first();

    if (existing) {
      throw new Error("Mobile number is already registered.");
    }

    const password_hash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      full_name: args.full_name,
      mobile_number: args.mobile_number,
      email: args.email,
      password_hash,
      role: args.role,
      status: args.status,
      is_first_login: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      onboardingComplete: false,
      screeningComplete: false,
      biometricEnabled: false,
    });

    return userId;
  },
});

/** Admin: Toggle user active status */
export const toggleUserStatus = mutation({
  args: { userId: v.id("users"), status: v.string() },
  handler: async (ctx, args) => {
    const admin = await checkAdmin(ctx);
    if (!admin) throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

/** Admin: Edit user profile details */
export const editUser = mutation({
  args: {
    userId: v.id("users"),
    full_name: v.string(),
    mobile_number: v.string(),
    email: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await checkAdmin(ctx);
    if (!admin) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", args.mobile_number))
      .first();

    if (existing && existing._id !== args.userId) {
      throw new Error("Mobile number is registered to another user.");
    }

    await ctx.db.patch(args.userId, {
      full_name: args.full_name,
      mobile_number: args.mobile_number,
      email: args.email,
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

/** First login: Force change password */
export const changePassword = mutation({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db.get(identity.subject as Id<"users">);
    if (!user) throw new Error("User not found");

    const isValid = await verifyPassword(args.currentPassword, user.password_hash || "");
    if (!isValid) throw new Error("Incorrect current password.");

    const password_hash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      password_hash,
      is_first_login: false,
      updated_at: Date.now(),
    });
  },
});

/** First login: Force change password (no current password validation needed as token is validated) */
export const firstLoginChangePassword = mutation({
  args: { newPassword: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db.get(identity.subject as Id<"users">);
    if (!user) throw new Error("User not found");
    if (!user.is_first_login) throw new Error("Not first login");

    const password_hash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      password_hash,
      is_first_login: false,
      updated_at: Date.now(),
    });
  },
});

/** Complete onboarding details */
export const completeOnboarding = mutation({
  args: {
    alias: v.string(),
    age: v.number(),
    campus: v.string(),
    department: v.string(),
    consentVersion: v.string(),
    consentTimestamp: v.number(),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db.get(identity.subject as Id<"users">);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      alias: args.alias,
      age: args.age,
      campus: args.campus,
      department: args.department,
      consentVersion: args.consentVersion,
      consentTimestamp: args.consentTimestamp,
      emergencyContactName: args.emergencyContactName,
      emergencyContactPhone: args.emergencyContactPhone,
      onboardingComplete: true,
      updated_at: Date.now(),
    });
  },
});

/** Get user by ID */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/** Get current user profile details */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.get(identity.subject as Id<"users">);
  },
});

/** Toggle biometric helper */
export const toggleBiometric = mutation({
  args: { clerkId: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.clerkId as Id<"users">);
      if (user) {
        await ctx.db.patch(user._id, { biometricEnabled: args.enabled });
        return;
      }
    } catch (e) { }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { biometricEnabled: args.enabled });
    }
  },
});

/** Mark screening complete helper */
export const markScreeningComplete = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.clerkId as Id<"users">);
      if (user) {
        await ctx.db.patch(user._id, { screeningComplete: true });
        return;
      }
    } catch (e) { }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { screeningComplete: true });
    }
  },
});

/** Seed a default admin user for testing */
export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_mobile_number", (q) => q.eq("mobile_number", "1234567890"))
      .first();

    if (existing) {
      return { message: "Admin already seeded" };
    }

    const password_hash = await hashPassword("adminpassword");
    await ctx.db.insert("users", {
      full_name: "Admin User",
      mobile_number: "1234567890",
      password_hash,
      role: "admin",
      status: "active",
      is_first_login: false,
      created_at: Date.now(),
      updated_at: Date.now(),
      onboardingComplete: true,
      screeningComplete: true,
      biometricEnabled: false,
    });

    return { message: "Admin seeded successfully. Mobile: 1234567890, Password: adminpassword" };
  },
});

/** Update last login timestamp for the authenticated user */
export const updateLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    await ctx.db.patch(identity.subject as Id<"users">, {
      lastLoginAt: Date.now(),
    });
  },
});

/** Query to check if auth keys exist in the database */
export const keysExist = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("authKeys").first();
    return !!existing;
  },
});

/** Mutation to save generated JWK keys to the database */
export const storeKeys = internalMutation({
  args: { privateKeyJwk: v.string(), publicKeyJwk: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("authKeys").first();
    if (existing) return;
    await ctx.db.insert("authKeys", {
      privateKeyJwk: args.privateKeyJwk,
      publicKeyJwk: args.publicKeyJwk,
      createdAt: Date.now(),
    });
  },
});

/** Action to securely generate RSA key pair and save it if not present */
export const ensureKeysInitialized = internalAction({
  args: {},
  handler: async (ctx) => {
    const exists = await ctx.runQuery(api.users.keysExist);
    if (exists) return;

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: "SHA-256" },
      },
      true,
      ["sign", "verify"]
    );

    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

    // Make sure we add key identifier 'kid' and 'alg' to public key for JWKS compatibility
    (publicKeyJwk as any).kid = "key1";
    (publicKeyJwk as any).alg = "RS256";
    (publicKeyJwk as any).use = "sig";
    (privateKeyJwk as any).kid = "key1";
    (privateKeyJwk as any).alg = "RS256";
    (privateKeyJwk as any).use = "sig";

    await ctx.runMutation(internal.users.storeKeys, {
      privateKeyJwk: JSON.stringify(privateKeyJwk),
      publicKeyJwk: JSON.stringify(publicKeyJwk),
    });
  },
});

/** Query to get the public key for JWKS endpoint */
export const getPublicKeyJWK = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("authKeys").first();
    if (!existing) return null;
    return JSON.parse(existing.publicKeyJwk);
  },
});


