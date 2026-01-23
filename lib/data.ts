/**
 * Data Module - FIPADOC 2026
 *
 * Provides access to programme and film data from the FIPADOC API.
 */

import { JourProgramme, Film, Seance } from './types';
import { fetchAllProgramme, buildImageUrl } from './api';
import { APIScreening, FESTIVAL_DAYS } from './api-types';

// Re-export types for convenience
export type { JourProgramme, Film, Seance } from './types';

/**
 * Convert API date format (2026-01-24) to French display format (Samedi 24 janvier 2026)
 */
function formatDateFrench(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

/**
 * Extract time in HH:MM format from HH:MM:SS format.
 */
function formatTime(time: string): string {
  // time is in HH:MM:SS format
  return time.substring(0, 5);
}

/**
 * Extract presence info from detail HTML if it contains presence information.
 */
function extractPresence(detail: string | undefined): string | undefined {
  if (!detail) return undefined;
  // Check for common presence patterns
  const presenceMatch = detail.match(/En présence de[^<]*/i);
  if (presenceMatch) {
    return presenceMatch[0].trim();
  }
  return undefined;
}

/**
 * Convert an API screening to internal Seance format.
 */
function convertScreeningToSeance(screening: APIScreening): Seance {
  const imageUrl = buildImageUrl(screening.picture?.link);

  return {
    titre: screening.title_l1,
    heureDebut: formatTime(screening.starting_time),
    heureFin: formatTime(screening.closing_time),
    lieu: screening.area,
    categorie: screening.category_l1.join(', '),
    realisateur: '', // Will be fetched from film details
    image: imageUrl,
    presence: extractPresence(screening.detail_l1),
    _id_screening: screening.id_screening,
    _id_film: screening.id_film,
    _duration: screening.duration,
  };
}

/**
 * Get all days from the programme via API.
 */
export async function getProgramme(): Promise<JourProgramme[]> {
  const programmeMap = await fetchAllProgramme();

  const jours: JourProgramme[] = [];

  for (const day of FESTIVAL_DAYS) {
    const screenings = programmeMap.get(day) || [];
    const seances = screenings.map(convertScreeningToSeance);

    // Sort seances by start time
    seances.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

    jours.push({
      date: formatDateFrench(day),
      seances,
    });
  }

  return jours;
}

/**
 * Build a films index from programme screenings.
 * Creates a Map for O(1) lookup by title.
 */
export async function getFilmsIndex(): Promise<Map<string, Film>> {
  const programmeMap = await fetchAllProgramme();
  const index = new Map<string, Film>();

  for (const screenings of programmeMap.values()) {
    for (const screening of screenings) {
      if (!screening.title_l1) continue;

      const imageUrl = buildImageUrl(screening.picture?.link);

      const film: Film = {
        titre: screening.title_l1,
        realisateurs: '', // Will be fetched via film details API
        slug: screening.id_film,
        imageUrl: imageUrl,
        imageFilm: imageUrl,
        // Synopsis and trailer will be fetched on demand via fetchFilmDetails
      };

      const titleLower = screening.title_l1.toLowerCase();
      if (!index.has(titleLower)) {
        index.set(titleLower, film);
      }

      // Also index by second part of title if present
      const dashIndex = screening.title_l1.indexOf(' - ');
      if (dashIndex > 0) {
        const firstPart = screening.title_l1.substring(0, dashIndex);
        const secondPart = screening.title_l1.substring(dashIndex + 3);

        if (!index.has(firstPart.toLowerCase())) {
          index.set(firstPart.toLowerCase(), film);
        }
        if (!index.has(secondPart.toLowerCase())) {
          index.set(secondPart.toLowerCase(), film);
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
    name: 'FIPADOC 2026',
    source: 'https://admin.fipadoc.com/wp-json/v1/program',
    totalFilms: 0, // Will be determined by API
    totalSelections: 0,
  };
}

// Keep track of programme for getScreeningsForFilm
let cachedProgramme: JourProgramme[] | null = null;

/**
 * Get all screenings for a specific film by title.
 * Returns screenings sorted by date and time.
 */
export async function getScreeningsForFilm(filmTitle: string): Promise<{ date: string; seance: Seance }[]> {
  if (!cachedProgramme) {
    cachedProgramme = await getProgramme();
  }

  const titleLower = filmTitle.toLowerCase();
  const result: { date: string; seance: Seance }[] = [];

  for (const jour of cachedProgramme) {
    for (const seance of jour.seances) {
      if (seance.titre?.toLowerCase() === titleLower) {
        result.push({ date: jour.date, seance });
      }
    }
  }

  return result;
}
