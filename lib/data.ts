/**
 * Data Module - Server and Client Compatible
 *
 * This module provides access to film and schedule data from local JSON files.
 * Data is loaded at build time via static imports, enabling Next.js build optimization.
 * The module can be safely imported by both server and client components.
 *
 * Usage:
 *   import { getFilms, getScreenings, getRooms } from '@/lib/data';
 *   import { Film, Screening, Room } from '@/lib/data';
 *
 * The data functions return typed arrays of Film, Screening, and Room objects.
 * If the underlying data is empty or undefined, empty arrays are returned.
 */

import { Film, Screening, Room } from './types';

// Static JSON imports for Next.js build optimization
import filmsData from '../pwa-films-index.json';
import scheduleData from '../pwa-schedule.json';

// Re-export types for convenience
export type { Film, Screening, Room };

/**
 * Get all films from the local data.
 *
 * @returns Array of Film objects from pwa-films-index.json
 *
 * @example
 * const films = getFilms();
 * // [{ id: 'film-001', name: 'Les Voix du Silence', ... }, ...]
 */
export function getFilms(): Film[] {
  return filmsData.films ?? [];
}

/**
 * Get all screenings from the local data.
 *
 * @returns Array of Screening objects from pwa-schedule.json
 *
 * @example
 * const screenings = getScreenings();
 * // [{ id: 'screening-001', filmId: 'film-001', roomId: 'room-001', ... }, ...]
 */
export function getScreenings(): Screening[] {
  return scheduleData.screenings ?? [];
}

/**
 * Get all rooms from the local data.
 *
 * @returns Array of Room objects from pwa-schedule.json
 *
 * @example
 * const rooms = getRooms();
 * // [{ id: 'room-001', name: 'Salle Gare du Midi', ... }, ...]
 */
export function getRooms(): Room[] {
  return scheduleData.rooms ?? [];
}
