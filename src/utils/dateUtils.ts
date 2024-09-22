export function isNewMonth(lastUsageDate: string | null): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  
  return now.getUTCFullYear() > last.getUTCFullYear() ||
         (now.getUTCFullYear() === last.getUTCFullYear() && now.getUTCMonth() > last.getUTCMonth());
}

export function getTimeUntilNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const msUntilNextMonth = nextMonth.getTime() - now.getTime();
  const daysUntilNextMonth = Math.ceil(msUntilNextMonth / (1000 * 60 * 60 * 24));
  return `${daysUntilNextMonth} days`;
}