const CONVEX_SITE_URL = "https://usable-stork-789.convex.site";
const CONVEX_CLOUD_URL = "https://usable-stork-789.convex.cloud";

async function run() {
  console.log("1. Logging in as admin...");
  const loginRes = await fetch(`${CONVEX_SITE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number: "1234567890", password: "adminpassword" }),
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    console.error("Login failed!");
    return;
  }
  
  console.log("Token obtained. Calling users:getByClerkId for patient...");
  const queryRes = await fetch(`${CONVEX_CLOUD_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      path: "users:getByClerkId",
      args: { clerkId: "k576yagbca18qxqemxeyn5pq8h87wjv8" }
    })
  });

  const queryData = await queryRes.json();
  console.log("Response Status:", queryRes.status);
  console.log("Patient User Doc:", JSON.stringify(queryData, null, 2));
}

run();



