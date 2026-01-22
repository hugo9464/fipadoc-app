/**
 * Data Module - FIPADOC 2026
 *
 * Loads and provides access to programme and film data from local JSON files.
 */

import { JourProgramme, Film, Programme, FilmsData, Seance } from './types';

// Static JSON imports for Next.js build optimization
import programmeData from '../fipadoc-2026-programme.json';
import filmsData from '../fipadoc-2026-films-complet.json';

// Re-export types for convenience
export type { JourProgramme, Film, Seance } from './types';

// Type assertions for imported JSON
const programme = programmeData as Programme;
const films = filmsData as FilmsData;

/**
 * Get all days from the programme.
 */
export function getProgramme(): JourProgramme[] {
  return programme.jours ?? [];
}

/**
 * Get all films as an array.
 */
export function getFilmsArray(): Film[] {
  const allFilms: Film[] = [];
  for (const selection of films.selections) {
    for (const film of selection.films) {
      allFilms.push({
        ...film,
        selection: selection.nom,
      });
    }
  }
  return allFilms;
}

/**
 * Get films indexed by title for fast O(1) lookup.
 * The index includes both the full title and any subtitle variant.
 */
export function getFilmsIndex(): Map<string, Film> {
  const index = new Map<string, Film>();

  for (const selection of films.selections) {
    for (const film of selection.films) {
      const filmWithSelection = {
        ...film,
        selection: selection.nom,
      };

      // Index by full title
      index.set(film.titre.toLowerCase(), filmWithSelection);

      // Also index by first part of title (before " - ") for matching
      // e.g., "Le Ministère de la Solitude - Dear Tomorrow" → "Le Ministère de la Solitude"
      const dashIndex = film.titre.indexOf(' - ');
      if (dashIndex > 0) {
        const firstPart = film.titre.substring(0, dashIndex);
        if (!index.has(firstPart.toLowerCase())) {
          index.set(firstPart.toLowerCase(), filmWithSelection);
        }
        // Also index by second part (English title)
        const secondPart = film.titre.substring(dashIndex + 3);
        if (!index.has(secondPart.toLowerCase())) {
          index.set(secondPart.toLowerCase(), filmWithSelection);
        }
      }
    }
  }

  return index;
}

/**
 * Find a film by its title (case-insensitive).
 */
export function findFilmByTitle(title: string, index: Map<string, Film>): Film | undefined {
  return index.get(title.toLowerCase());
}

/**
 * Get festival metadata.
 */
export function getFestivalInfo() {
  return {
    name: programme.festival,
    source: programme.source,
    dateExtraction: programme.dateExtraction,
    totalFilms: films.nombreTotalFilms,
    totalSelections: films.nombreSelections,
  };
}

/**
 * Get all screenings for a specific film by title.
 * Returns screenings sorted by date and time.
 */
export function getScreeningsForFilm(filmTitle: string): { date: string; seance: Seance }[] {
  const titleLower = filmTitle.toLowerCase();
  const result: { date: string; seance: Seance }[] = [];

  for (const jour of programme.jours) {
    for (const seance of jour.seances) {
      if (seance.titre?.toLowerCase() === titleLower) {
        result.push({ date: jour.date, seance });
      }
    }
  }

  return result;
}
