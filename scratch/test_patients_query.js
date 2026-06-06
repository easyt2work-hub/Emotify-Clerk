const CONVEX_SITE_URL = "https://usable-stork-789.convex.site";
const CONVEX_CLOUD_URL = "https://usable-stork-789.convex.cloud";

async function run() {
  console.log("1. Logging in...");
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
  
  console.log("Token obtained.");

  console.log("\n2. Calling users:listPatients with token...");
  const queryRes = await fetch(`${CONVEX_CLOUD_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      path: "users:listPatients",
      args: { search: "" }
    })
  });

  const queryData = await queryRes.json();
  console.log("Query Response Status:", queryRes.status);
  console.log("Query Response Data:", JSON.stringify(queryData, null, 2));
}

run();
