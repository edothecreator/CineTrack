/** Convert total minutes to days + hours (integer hours remainder). */
export function formatBingeClock(totalMinutes: number): {
  days: number;
  hours: number;
} {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { days: 0, hours: 0 };
  }
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  return { days, hours };
}
