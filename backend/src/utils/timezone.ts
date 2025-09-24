/**
 * Timezone utilities for calendar integration
 */

interface SessionData {
  starts_at: string; // ISO string from database
  ends_at?: string;
  duration_minutes?: number;
}

interface TimezoneConversionOptions {
  targetTimeZone?: string;
  defaultDuration?: number; // minutes
}

export class TimezoneUtils {
  /**
   * Convert session time to target timezone
   */
  static convertSessionToTimezone(
    session: SessionData,
    options: TimezoneConversionOptions = {}
  ): {
    startTime: string; // ISO string in target timezone
    endTime: string; // ISO string in target timezone
    targetTimeZone: string;
  } {
    const { targetTimeZone = 'UTC', defaultDuration = 60 } = options;

    // Parse start time
    const startDate = new Date(session.starts_at);

    // Calculate end time
    let endDate: Date;
    if (session.ends_at) {
      endDate = new Date(session.ends_at);
    } else if (session.duration_minutes) {
      endDate = new Date(startDate.getTime() + (session.duration_minutes * 60 * 1000));
    } else {
      endDate = new Date(startDate.getTime() + (defaultDuration * 60 * 1000));
    }

    // Convert to target timezone by creating locale-aware ISO strings
    const startInTargetTZ = this.convertToTimezone(startDate, targetTimeZone);
    const endInTargetTZ = this.convertToTimezone(endDate, targetTimeZone);

    return {
      startTime: startInTargetTZ,
      endTime: endInTargetTZ,
      targetTimeZone
    };
  }

  /**
   * Convert a Date to ISO string in specific timezone
   */
  private static convertToTimezone(date: Date, timeZone: string): string {
    // For UTC, return as-is
    if (timeZone === 'UTC') {
      return date.toISOString();
    }

    // For other timezones, we need to be careful about DST and proper conversion
    // The safest approach is to format it properly for the calendar API
    try {
      // Use Intl.DateTimeFormat to get the proper timezone representation
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const formatted = parts.reduce((acc, part) => {
        if (part.type === 'year') acc.year = part.value;
        if (part.type === 'month') acc.month = part.value;
        if (part.type === 'day') acc.day = part.value;
        if (part.type === 'hour') acc.hour = part.value;
        if (part.type === 'minute') acc.minute = part.value;
        if (part.type === 'second') acc.second = part.value;
        return acc;
      }, {} as any);

      // Return in ISO format without Z (for non-UTC timezones)
      return `${formatted.year}-${formatted.month}-${formatted.day}T${formatted.hour}:${formatted.minute}:${formatted.second}`;
    } catch (error) {
      console.warn(`Invalid timezone ${timeZone}, falling back to UTC`);
      return date.toISOString();
    }
  }

  /**
   * Get common timezone mappings
   */
  static getCommonTimezones(): { [key: string]: string } {
    return {
      'PST': 'America/Los_Angeles',
      'MST': 'America/Denver',
      'CST': 'America/Chicago',
      'EST': 'America/New_York',
      'GMT': 'GMT',
      'CET': 'Europe/Berlin',
      'JST': 'Asia/Tokyo',
      'AEST': 'Australia/Sydney'
    };
  }

  /**
   * Validate timezone string
   */
  static isValidTimezone(timeZone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's local timezone
   */
  static getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'UTC';
    }
  }

  /**
   * Format time for display in specific timezone
   */
  static formatTimeInTimezone(date: Date, timeZone: string, locale = 'en-US'): string {
    try {
      return date.toLocaleString(locale, {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return date.toLocaleString(locale);
    }
  }

  /**
   * Detect timezone from calendar API response
   */
  static normalizeTimezone(timeZone?: string): string {
    if (!timeZone) return 'UTC';

    // Handle common timezone variations
    const normalized = timeZone.trim();
    const commonTimezones = this.getCommonTimezones();

    // Check if it's a common abbreviation
    if (commonTimezones[normalized.toUpperCase()]) {
      return commonTimezones[normalized.toUpperCase()];
    }

    // Validate and return if valid
    if (this.isValidTimezone(normalized)) {
      return normalized;
    }

    // Default to UTC if invalid
    console.warn(`Invalid timezone "${timeZone}", defaulting to UTC`);
    return 'UTC';
  }
}