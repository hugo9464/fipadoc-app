/**
 * Data Type Definitions
 *
 * This module contains TypeScript interfaces for the core data entities
 * used throughout the FIPADOC PWA application.
 *
 * These types are adapted from the original Airtable record types but
 * simplified to work with local JSON data files. The nested 'fields'
 * structure has been flattened to simple properties.
 *
 * Usage:
 *   import { Film, Screening, Room } from '@/lib/types';
 */

/**
 * Represents a documentary film in the festival catalog.
 *
 * @example
 * const film: Film = {
 *   id: 'film-001',
 *   name: 'Example Documentary',
 *   description: 'A compelling story...',
 *   duration: 90,
 *   director: 'Jane Doe',
 *   country: 'France',
 *   year: 2024
 * };
 */
export interface Film {
  /** Unique identifier for the film (e.g., 'film-001') */
  id: string;

  /** Title of the film */
  name: string;

  /** Synopsis or description of the film */
  description?: string;

  /** Duration of the film in minutes */
  duration?: number;

  /** Name of the film's director */
  director?: string;

  /** Country of origin */
  country?: string;

  /** Release year */
  year?: number;

  /** URL to the film's poster or promotional image */
  imageUrl?: string;

  /** Festival category or section (e.g., 'Competition', 'Panorama') */
  category?: string;
}

/**
 * Represents a scheduled screening of a film.
 *
 * @example
 * const screening: Screening = {
 *   id: 'screening-001',
 *   filmId: 'film-001',
 *   roomId: 'room-001',
 *   startTime: '2024-01-20T14:00:00',
 *   endTime: '2024-01-20T15:30:00',
 *   date: '2024-01-20'
 * };
 */
export interface Screening {
  /** Unique identifier for the screening (e.g., 'screening-001') */
  id: string;

  /** Reference to the Film.id being screened */
  filmId: string;

  /** Reference to the Room.id where the screening takes place */
  roomId: string;

  /** Start time in ISO 8601 format (e.g., '2024-01-20T14:00:00') */
  startTime: string;

  /** End time in ISO 8601 format (e.g., '2024-01-20T15:30:00') */
  endTime: string;

  /** Date of the screening in YYYY-MM-DD format (e.g., '2024-01-20') */
  date: string;
}

/**
 * Represents a venue or room where screenings take place.
 *
 * @example
 * const room: Room = {
 *   id: 'room-001',
 *   name: 'Salle Principale',
 *   capacity: 200,
 *   location: 'Centre des Congrès'
 * };
 */
export interface Room {
  /** Unique identifier for the room (e.g., 'room-001') */
  id: string;

  /** Name of the room or venue */
  name: string;

  /** Maximum seating capacity */
  capacity?: number;

  /** Physical location or address */
  location?: string;
}
