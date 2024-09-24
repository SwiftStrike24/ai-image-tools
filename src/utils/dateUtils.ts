export function isNewPeriod(lastUsageDate: string | null, isMonthly: boolean): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  if (isMonthly) {
    return now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
  } else {
    return now.getUTCDate() !== last.getUTCDate() || now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
  }
}

export function getTimeUntilReset(isMonthly: boolean): string {
  const now = new Date();
  if (isMonthly) {
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const msUntilEndOfMonth = lastDayOfMonth.getTime() - now.getTime();
    const daysUntilEndOfMonth = Math.ceil(msUntilEndOfMonth / (1000 * 60 * 60 * 24));
    
    if (daysUntilEndOfMonth > 1) {
      return `${daysUntilEndOfMonth} days`;
    } else if (daysUntilEndOfMonth === 1) {
      return "1 day";
    } else {
      const hoursUntilEndOfMonth = Math.ceil(msUntilEndOfMonth / (1000 * 60 * 60));
      return `${hoursUntilEndOfMonth} hours`;
    }
  } else {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursUntilMidnight}h ${minutesUntilMidnight}m`;
  }
}

export function isNewMonth(lastUsageDate: string | null): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  return now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
}

export function getTimeUntilNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const msUntilNextMonth = nextMonth.getTime() - now.getTime();
  const daysUntilNextMonth = Math.ceil(msUntilNextMonth / (1000 * 60 * 60 * 24));
  return `${daysUntilNextMonth} days`;
}

export function getTimeUntilEndOfMonth(): string {
  return getTimeUntilNextMonth(); // This is the same as getTimeUntilNextMonth
}