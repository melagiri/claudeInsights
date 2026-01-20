import { format, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

const SCHEDULER_KEY = 'claudeinsight_report_schedule';
const LAST_EXPORT_KEY = 'claudeinsight_last_export';

interface SchedulerSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  dayOfWeek?: number; // 0 = Sunday, 6 = Saturday
}

/**
 * Load scheduler settings
 */
export function loadSchedulerSettings(): SchedulerSettings {
  const saved = localStorage.getItem(SCHEDULER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { enabled: false, frequency: 'weekly', dayOfWeek: 0 };
    }
  }
  return { enabled: false, frequency: 'weekly', dayOfWeek: 0 };
}

/**
 * Save scheduler settings
 */
export function saveSchedulerSettings(settings: SchedulerSettings): void {
  localStorage.setItem(SCHEDULER_KEY, JSON.stringify(settings));
}

/**
 * Get last export date
 */
export function getLastExportDate(): Date | null {
  const saved = localStorage.getItem(LAST_EXPORT_KEY);
  if (saved) {
    return new Date(saved);
  }
  return null;
}

/**
 * Set last export date
 */
export function setLastExportDate(date: Date): void {
  localStorage.setItem(LAST_EXPORT_KEY, date.toISOString());
}

/**
 * Check if export is due
 */
export function isExportDue(): boolean {
  const settings = loadSchedulerSettings();
  if (!settings.enabled) return false;

  const lastExport = getLastExportDate();
  if (!lastExport) return true;

  const now = new Date();
  const daysSinceExport = differenceInDays(now, lastExport);

  if (settings.frequency === 'daily') {
    return daysSinceExport >= 1;
  }

  // Weekly - check if we're past the scheduled day
  if (settings.frequency === 'weekly') {
    const currentDayOfWeek = now.getDay();
    const scheduledDay = settings.dayOfWeek ?? 0;

    if (daysSinceExport >= 7) return true;
    if (currentDayOfWeek === scheduledDay && daysSinceExport >= 1) return true;
  }

  return false;
}

/**
 * Get export reminder message
 */
export function getExportReminder(): string | null {
  const settings = loadSchedulerSettings();
  if (!settings.enabled) return null;

  const lastExport = getLastExportDate();
  if (!lastExport) {
    return 'You haven\'t exported your insights yet. Visit the Export page to download your data.';
  }

  if (isExportDue()) {
    const lastExportStr = format(lastExport, 'MMMM d');
    if (settings.frequency === 'daily') {
      return `Your daily export is ready. Last export was on ${lastExportStr}.`;
    }
    return `Your weekly export is ready. Last export was on ${lastExportStr}.`;
  }

  return null;
}

/**
 * Get next scheduled export date
 */
export function getNextExportDate(): Date | null {
  const settings = loadSchedulerSettings();
  if (!settings.enabled) return null;

  const lastExport = getLastExportDate() || new Date();

  if (settings.frequency === 'daily') {
    const next = new Date(lastExport);
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (settings.frequency === 'weekly') {
    const next = new Date(lastExport);
    const daysUntilNext = (7 + (settings.dayOfWeek ?? 0) - next.getDay()) % 7 || 7;
    next.setDate(next.getDate() + daysUntilNext);
    return next;
  }

  return null;
}
