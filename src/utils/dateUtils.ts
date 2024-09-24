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

export function getTimeUntilEndOfMonth(): string {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
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
}

export function isNewMonth(lastUsageDate: string | null): boolean {
  return isNewPeriod(lastUsageDate, true);
}

// Keep this function for backwards compatibility
export function getTimeUntilNextMonth(): string {
  return getTimeUntilEndOfMonth();
}

export function getTimeUntilReset(isMonthly: boolean): string {
  if (isMonthly) {
    return getTimeUntilEndOfMonth();
  } else {
    const now = new Date();
    const tomorrow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursUntilMidnight}h ${minutesUntilMidnight}m`;
  }
}