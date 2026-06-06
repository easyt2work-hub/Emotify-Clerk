import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "clear-expired-sessions",
  { hourUTC: 0, minuteUTC: 0 },
  internal.users.clearExpiredSessions
);

export default crons;
