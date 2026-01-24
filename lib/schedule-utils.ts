/**
 * Schedule Utilities for FIPADOC 2026
 *
 * Simplified utilities since dates are already formatted in the JSON.
 */

// ============================================
// Category Color & Label Utilities
// ============================================

/**
 * Map a category string to its corresponding CSS variable name.
 */
export function getCategoryColorVar(categorie: string): string {
  const cat = categorie.toLowerCase();

  if (cat.includes('international')) return 'var(--color-cat-international)';
  if (cat.includes('national') || cat.includes('france')) return 'var(--color-cat-france)';
  if (cat.includes('musica') || cat.includes('musical')) return 'var(--color-cat-musique)';
  if (cat.includes('impact')) return 'var(--color-cat-impact)';
  if (cat.includes('court')) return 'var(--color-cat-courts)';
  if (cat.includes('jeune')) return 'var(--color-cat-jeune-creation)';
  if (cat.includes('europe')) return 'var(--color-cat-europe)';
  if (cat.includes('panorama')) return 'var(--color-cat-panorama)';
  if (cat.includes('famille')) return 'var(--color-cat-en-famille)';
  if (cat.includes('goût') || cat.includes('gout')) return 'var(--color-cat-gout-du-doc)';
  if (cat.includes('série') || cat.includes('serie')) return 'var(--color-cat-series)';
  if (cat.includes('focus')) return 'var(--color-cat-focus)';
  if (cat.includes('ukraine')) return 'var(--color-cat-ukraine)';
  if (cat.includes('smart')) return 'var(--color-cat-smart)';
  if (cat.includes('teens') || cat.includes('docs4teens')) return 'var(--color-cat-docs4teens)';
  if (cat.includes('spéciale') || cat.includes('speciale')) return 'var(--color-cat-seance-speciale)';

  return 'var(--color-cat-default)';
}

/**
 * Get a short label for a category (e.g., "Documentaire musical" → "MUSIQUE").
 */
export function getCategoryShortLabel(categorie: string): string {
  const cat = categorie.toLowerCase();

  if (cat.includes('international')) return 'INTERNATIONAL';
  if (cat.includes('national') || cat.includes('france')) return 'FRANCE';
  if (cat.includes('musica') || cat.includes('musical')) return 'MUSIQUE';
  if (cat.includes('impact')) return 'IMPACT';
  if (cat.includes('court')) return 'COURTS';
  if (cat.includes('jeune')) return 'JEUNE CRÉATION';
  if (cat.includes('europe')) return 'EUROPE';
  if (cat.includes('panorama')) return 'PANORAMA';
  if (cat.includes('famille')) return 'EN FAMILLE';
  if (cat.includes('goût') || cat.includes('gout')) return 'GOÛT DU DOC';
  if (cat.includes('série') || cat.includes('serie')) return 'SÉRIES';
  if (cat.includes('focus')) return 'FOCUS';
  if (cat.includes('ukraine')) return 'UKRAINE';
  if (cat.includes('smart')) return 'SMART';
  if (cat.includes('teens') || cat.includes('docs4teens')) return 'DOCS4TEENS';
  if (cat.includes('spéciale') || cat.includes('speciale')) return 'SPÉCIALE';

  // Fallback: return first word uppercase
  const firstWord = categorie.split(' ')[0];
  return firstWord.toUpperCase();
}

/**
 * Format duration in French style (e.g., 88 → "1 h 28").
 */
export function formatDurationFrench(minutes: string | undefined): string | null {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return null;

  if (mins < 60) {
    return `${mins} min`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (remainingMins === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMins.toString().padStart(2, '0')}`;
}

// ============================================
// French Date Utilities
// ============================================

const FRENCH_MONTHS: Record<string, string> = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
};

/**
 * Convert a French date string to ISO format.
 * e.g., "Samedi 24 janvier 2026" → "2026-01-24"
 */
export function frenchDateToISO(dateFr: string): string | null {
  const parts = dateFr.toLowerCase().split(' ');
  if (parts.length < 4) return null;

  const day = parts[1].padStart(2, '0');
  const month = FRENCH_MONTHS[parts[2]];
  const year = parts[3];

  if (!month) return null;
  return `${year}-${month}-${day}`;
}

/**
 * Build a booking URL for festicine with date and title filters.
 */
export function buildBookingUrl(filmTitle: string, dateFr: string): string | null {
  const isoDate = frenchDateToISO(dateFr);
  if (!isoDate) return null;

  const encodedTitle = encodeURIComponent(filmTitle);
  return `https://site-fipadoc.festicine.fr/fr/schedule?jour[]=${isoDate}&titre=${encodedTitle}`;
}

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
 * Check if a screening is upcoming (not yet started).
 * Returns true if the screening date is in the future, or if it's today and the start time is in the future.
 */
export function isScreeningUpcoming(dateFr: string, heureDebut: string): boolean {
  const isoDate = frenchDateToISO(dateFr);
  if (!isoDate) return true; // If we can't parse, show it

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // If the screening date is in the future, it's upcoming
  if (isoDate > todayISO) return true;

  // If the screening date is in the past, it's not upcoming
  if (isoDate < todayISO) return false;

  // It's today - check the time
  const [hours, minutes] = heureDebut.split(':').map(Number);
  const screeningMinutes = hours * 60 + minutes;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return screeningMinutes > nowMinutes;
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
 * Calculate film duration info for visual representation.
 * Returns the percentage of the session that is the actual film,
 * and the extra time after the film ends.
 */
export interface FilmDurationInfo {
  /** Percentage of session height for the film (0-100) */
  filmPercent: number;
  /** Extra time after film in minutes */
  extraMinutes: number;
  /** Whether there is extra time after the film */
  hasExtraTime: boolean;
}

export function calculateFilmDuration(
  heureDebut: string,
  heureFin: string,
  filmDuration: string | undefined
): FilmDurationInfo {
  if (!filmDuration) {
    return { filmPercent: 100, extraMinutes: 0, hasExtraTime: false };
  }

  const filmMinutes = parseInt(filmDuration, 10);
  if (isNaN(filmMinutes)) {
    return { filmPercent: 100, extraMinutes: 0, hasExtraTime: false };
  }

  const startMinutes = timeToMinutes(heureDebut);
  const endMinutes = timeToMinutes(heureFin);
  const sessionMinutes = endMinutes - startMinutes;

  if (sessionMinutes <= 0 || filmMinutes >= sessionMinutes) {
    return { filmPercent: 100, extraMinutes: 0, hasExtraTime: false };
  }

  const extraMinutes = sessionMinutes - filmMinutes;
  const filmPercent = (filmMinutes / sessionMinutes) * 100;

  return {
    filmPercent,
    extraMinutes,
    hasExtraTime: extraMinutes > 0,
  };
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
