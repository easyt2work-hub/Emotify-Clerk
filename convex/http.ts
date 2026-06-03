import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// CORS Headers helper
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

// OPTIONS handler for preflights
const handleOptions = httpAction(async (_ctx, _req) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
});

http.route({ path: "/api/login", method: "OPTIONS", handler: handleOptions });
http.route({ path: "/api/refresh", method: "OPTIONS", handler: handleOptions });
http.route({ path: "/api/forgot-password-otp", method: "OPTIONS", handler: handleOptions });
http.route({ path: "/api/reset-password", method: "OPTIONS", handler: handleOptions });

// OIDC Metadata
http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    const siteUrl = (globalThis as any).process?.env?.CONVEX_SITE_URL || "https://usable-stork-789.convex.site";
    const body = {
      issuer: siteUrl,
      jwks_uri: `${siteUrl}/.well-known/jwks.json`,
      authorization_endpoint: `${siteUrl}/oauth/authorize`,
      token_endpoint: `${siteUrl}/oauth/token`,
      userinfo_endpoint: `${siteUrl}/oauth/userinfo`,
      response_types_supported: ["code", "token", "id_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: getCorsHeaders(),
    });
  }),
});

// JWKS Public Keys
http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (ctx, _req) => {
    // Ensure keys are initialized (runs securely in action context)
    await ctx.runAction(internal.users.ensureKeysInitialized);
    
    // Retrieve the public key
    const publicKeyJwk = await ctx.runQuery(api.users.getPublicKeyJWK);
    const body = {
      keys: publicKeyJwk ? [publicKeyJwk] : [],
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: getCorsHeaders(),
    });
  }),
});

// Login endpoint
http.route({
  path: "/api/login",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      // Ensure keys are initialized (runs securely in action context)
      await ctx.runAction(internal.users.ensureKeysInitialized);

      const { mobile_number, password } = await req.json();

      if (!mobile_number || !password) {
        return new Response(JSON.stringify({ error: "Mobile number and password are required" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const result = await ctx.runMutation(internal.users.authenticateUser, {
        mobile_number,
        password,
      });

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: getCorsHeaders(),
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
        status: 500,
        headers: getCorsHeaders(),
      });
    }
  }),
});

// Token refresh endpoint
http.route({
  path: "/api/refresh",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      // Ensure keys are initialized (runs securely in action context)
      await ctx.runAction(internal.users.ensureKeysInitialized);

      const { refreshToken } = await req.json();
      if (!refreshToken) {
        return new Response(JSON.stringify({ error: "Refresh token is required" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const result = await ctx.runMutation(internal.users.refreshUserToken, {
        refreshToken,
      });

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 401,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: getCorsHeaders(),
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
        status: 500,
        headers: getCorsHeaders(),
      });
    }
  }),
});

// Forgot Password - Send OTP
http.route({
  path: "/api/forgot-password-otp",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const { mobile_number } = await req.json();
      if (!mobile_number) {
        return new Response(JSON.stringify({ error: "Mobile number is required" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const result = await ctx.runMutation(internal.users.generatePasswordResetOtp, {
        mobile_number,
      });

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify({ success: true, message: result.message }), {
        status: 200,
        headers: getCorsHeaders(),
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
        status: 500,
        headers: getCorsHeaders(),
      });
    }
  }),
});

// Reset Password using OTP
http.route({
  path: "/api/reset-password",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const { mobile_number, otp, new_password } = await req.json();
      if (!mobile_number || !otp || !new_password) {
        return new Response(
          JSON.stringify({ error: "Mobile number, OTP, and new password are required" }),
          {
            status: 400,
            headers: getCorsHeaders(),
          }
        );
      }

      const result = await ctx.runMutation(internal.users.resetPasswordWithOtp, {
        mobile_number,
        otp,
        new_password,
      });

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Password reset successful" }), {
        status: 200,
        headers: getCorsHeaders(),
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
        status: 500,
        headers: getCorsHeaders(),
      });
    }
  }),
});

export default http;
