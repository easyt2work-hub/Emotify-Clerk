function getAppointmentTimeLeft(startTime, endTime, now) {
  if (now > endTime) return "passed";
  
  if (now >= startTime && now <= endTime) {
    const diffMs = endTime - now;
    const mins = Math.floor(diffMs / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
    return `Ongoing (${mins} mins ${secs} sec left)`;
  }
  
  const diffMs = startTime - now;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffSecs < 60) {
    return `${diffSecs} sec left`;
  }
  
  if (diffMins < 60) {
    const secs = diffSecs % 60;
    return `${diffMins} mins ${secs} sec left`;
  }
  
  if (diffHrs < 24) {
    const mins = diffMins % 60;
    return `${diffHrs} hrs ${mins} mins left`;
  }
  
  const hrs = diffHrs % 24;
  return `${diffDays} days ${hrs} hrs left`;
}

const now = new Date("2026-06-05T19:03:16+05:30").getTime();
const start1 = new Date("2026-06-09T22:02:00+05:30").getTime();
const end1 = new Date("2026-06-09T23:00:00+05:30").getTime();

console.log("Appt 1 time left:", getAppointmentTimeLeft(start1, end1, now));
console.log("now:", now, "start1:", start1, "end1:", end1);
