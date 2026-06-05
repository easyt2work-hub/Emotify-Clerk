const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://usable-stork-789.convex.cloud");

client.query("appointments:tempGetAppointments").then((appts) => {
  console.log("Appointments fetched successfully:");
  console.log(JSON.stringify(appts, null, 2));
}).catch((err) => {
  console.error("Error fetching appointments:", err);
});
