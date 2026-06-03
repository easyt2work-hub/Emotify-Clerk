const CONVEX_SITE_URL = "https://usable-stork-789.convex.site";

async function run() {
  console.log("1. Simulating login...");
  try {
    const loginRes = await fetch(`${CONVEX_SITE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number: "1234567890", password: "adminpassword" }),
    });
    
    const loginData = await loginRes.json();
    console.log("Login Status:", loginRes.status);
    console.log("Login Data:", JSON.stringify(loginData, null, 2));

    if (!loginRes.ok || !loginData.refreshToken) {
      console.error("Login failed!");
      return;
    }

    console.log("\n2. Simulating token refresh...");
    const refreshRes = await fetch(`${CONVEX_SITE_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginData.refreshToken }),
    });

    const refreshData = await refreshRes.json();
    console.log("Refresh Status:", refreshRes.status);
    console.log("Refresh Data:", JSON.stringify(refreshData, null, 2));

  } catch (err) {
    console.error("Error during authentication test:", err);
  }
}

run();
