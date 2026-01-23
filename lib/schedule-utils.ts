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

/** Ordered list of venues (matching API area values) */
export const VENUE_ORDER = [
  'Casino Municipal',
  'Le Colisée',
  'Le Royal',
  'Gare du Midi',
  'Bellevue',
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

/**
 * Layout info for a screening block (for handling overlaps).
 */
export interface SeanceLayout {
  column: number;      // Which column this seance occupies (0-indexed)
  totalColumns: number; // Total columns in this overlap group
}

/**
 * Check if two screenings overlap in time.
 */
function seancesOverlap(
  a: { heureDebut: string; heureFin: string },
  b: { heureDebut: string; heureFin: string }
): boolean {
  const aStart = timeToMinutes(a.heureDebut);
  const aEnd = timeToMinutes(a.heureFin);
  const bStart = timeToMinutes(b.heureDebut);
  const bEnd = timeToMinutes(b.heureFin);

  // Two intervals overlap if one starts before the other ends
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Calculate layout for overlapping screenings within a venue.
 * Returns a Map from seance index to its layout info.
 */
export function calculateOverlapLayout<T extends { heureDebut: string; heureFin: string }>(
  seances: T[]
): Map<number, SeanceLayout> {
  const layouts = new Map<number, SeanceLayout>();

  if (seances.length === 0) return layouts;

  // Sort by start time for consistent processing
  const indexed = seances.map((s, i) => ({ seance: s, originalIndex: i }));
  indexed.sort((a, b) => timeToMinutes(a.seance.heureDebut) - timeToMinutes(b.seance.heureDebut));

  // Track which seances have been assigned to groups
  const assigned = new Set<number>();

  for (let i = 0; i < indexed.length; i++) {
    if (assigned.has(indexed[i].originalIndex)) continue;

    // Find all seances that overlap with this one (transitively)
    const group: number[] = [indexed[i].originalIndex];
    assigned.add(indexed[i].originalIndex);

    // Keep expanding the group while we find new overlaps
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (let j = 0; j < indexed.length; j++) {
        if (assigned.has(indexed[j].originalIndex)) continue;

        // Check if this seance overlaps with any in the current group
        const overlapsWithGroup = group.some(idx =>
          seancesOverlap(seances[idx], indexed[j].seance)
        );

        if (overlapsWithGroup) {
          group.push(indexed[j].originalIndex);
          assigned.add(indexed[j].originalIndex);
          expanded = true;
        }
      }
    }

    // Assign columns within the group using a greedy algorithm
    const columns: number[][] = []; // columns[col] = list of seance indices in that column

    // Sort group members by start time
    group.sort((a, b) => timeToMinutes(seances[a].heureDebut) - timeToMinutes(seances[b].heureDebut));

    for (const idx of group) {
      // Find the first column where this seance doesn't overlap with existing ones
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const canPlace = columns[col].every(existingIdx =>
          !seancesOverlap(seances[idx], seances[existingIdx])
        );
        if (canPlace) {
          columns[col].push(idx);
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Need a new column
        columns.push([idx]);
      }
    }

    // Assign layout info to each seance in the group
    const totalColumns = columns.length;
    for (let col = 0; col < columns.length; col++) {
      for (const idx of columns[col]) {
        layouts.set(idx, { column: col, totalColumns });
      }
    }
  }

  return layouts;
}
