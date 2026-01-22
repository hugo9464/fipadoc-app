/**
 * Schedule Utilities for FIPADOC 2026
 *
 * Simplified utilities since dates are already formatted in the JSON.
 */

/**
 * Extract a short date label from a French date string.
 * e.g., "Samedi 24 janvier 2026" → "Sam. 24"
 */
export function getShortDate(dateFr: string): string {
  const parts = dateFr.split(' ');
  if (parts.length >= 2) {
    const dayName = parts[0].substring(0, 3);
    const dayNum = parts[1];
    return `${dayName}. ${dayNum}`;
  }
  return dateFr;
}

/**
 * Check if a French date string matches today.
 */
export function isToday(dateFr: string): boolean {
  const today = new Date();
  const dayNum = today.getDate();
  const monthIndex = today.getMonth();
  const year = today.getFullYear();

  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const monthName = monthNames[monthIndex];
  const todayPattern = `${dayNum} ${monthName} ${year}`;

  return dateFr.includes(todayPattern);
}

/**
 * Find the index of today's date in the programme, or 0 if not found.
 */
export function findTodayIndex(dates: string[]): number {
  const idx = dates.findIndex(isToday);
  return idx >= 0 ? idx : 0;
}

/**
 * Format a time range for display.
 */
export function formatTimeRange(heureDebut: string, heureFin: string): string {
  return `${heureDebut} - ${heureFin}`;
}

// ============================================
// Calendar View Utilities
// ============================================

/** Start hour for the timeline (9:00 AM) */
export const TIMELINE_START_HOUR = 9;

/** End hour for the timeline (midnight) */
export const TIMELINE_END_HOUR = 24;

/** Height in pixels for one hour in the calendar */
export const HOUR_HEIGHT_PX = 60;

/** Ordered list of venues */
export const VENUE_ORDER = [
  'Atalaya',
  'Casino Municipal',
  'Royal 1',
  'Auditorium',
  'Gamaritz',
  'Le Colisée',
  'Le Royal salles 2 & 3',
];

/**
 * Convert a time string (HH:MM) to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert a time string to pixel position relative to TIMELINE_START_HOUR.
 */
export function timeToPixelPosition(time: string): number {
  const minutes = timeToMinutes(time);
  const startMinutes = TIMELINE_START_HOUR * 60;
  const offsetMinutes = minutes - startMinutes;
  return (offsetMinutes / 60) * HOUR_HEIGHT_PX;
}

/**
 * Calculate the height in pixels for a screening block.
 */
export function durationToPixelHeight(heureDebut: string, heureFin: string): number {
  const startMinutes = timeToMinutes(heureDebut);
  const endMinutes = timeToMinutes(heureFin);
  const durationMinutes = endMinutes - startMinutes;
  return (durationMinutes / 60) * HOUR_HEIGHT_PX;
}

/**
 * Get unique venues from a list of screenings, sorted by VENUE_ORDER.
 */
export function getActiveVenues(seances: { lieu: string }[]): string[] {
  const venuesSet = new Set(seances.map(s => s.lieu));
  return VENUE_ORDER.filter(v => venuesSet.has(v));
}

/**
 * Group screenings by venue.
 */
export function groupSeancesByVenue<T extends { lieu: string }>(seances: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const seance of seances) {
    if (!groups.has(seance.lieu)) {
      groups.set(seance.lieu, []);
    }
    groups.get(seance.lieu)!.push(seance);
  }
  return groups;
}

/**
 * Get the current time position in pixels (for "now" indicator).
 * Returns null if current time is outside the timeline range.
 */
export function getCurrentTimePosition(): number | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const startMinutes = TIMELINE_START_HOUR * 60;
  const endMinutes = TIMELINE_END_HOUR * 60;

  if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
    return null;
  }

  return ((totalMinutes - startMinutes) / 60) * HOUR_HEIGHT_PX;
}

/**
 * Generate time labels for the timeline axis.
 */
export function getTimelineLabels(): string[] {
  const labels: string[] = [];
  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
    labels.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return labels;
}
