export function parseAppointmentTime(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return new Date(`${dateStr} ${timeStr}`).getTime() || 0;
    
    let [_, hours, mins, modifier] = match;
    let h = parseInt(hours, 10);
    if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
    if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
    
    const d = new Date(`${dateStr}T${h.toString().padStart(2, '0')}:${mins}:00`);
    return d.getTime();
  } catch (e) {
    return 0;
  }
}
