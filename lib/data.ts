/**
 * Data Module - FIPADOC 2026
 *
 * Provides access to programme and film data from the FIPADOC API.
 */

import { JourProgramme, Film, Seance, BandeAnnonce } from './types';
import { fetchAllProgramme, buildImageUrl, fetchFilmDetailsClient } from './api';
import { APIScreening, FESTIVAL_DAYS, APIFilm } from './api-types';

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
 * Note: Presence info (qa_other_participants) is only available in the film details API,
 * not in the programme API. The presence field will be populated when film details are fetched.
 */

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
    // presence is not available in programme API, only in film details
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

// Import local films data for short films
import filmsData from '@/fipadoc-2026-films-complet.json';

interface JSONBandeAnnonce {
  raw: string;
  url?: string;
  platform: string;
}

interface JSONFilm {
  titre: string;
  realisateurs: string;
  slug: string;
  imageUrl?: string;
  images?: string[];
  imageFilm?: string;
  imagePoster?: string;
  synopsis?: string;
  bandesAnnonces?: JSONBandeAnnonce[];
}

interface JSONSelection {
  nom: string;
  films: JSONFilm[];
}

/**
 * Get all short films from the local JSON data.
 * Returns films from the "COURTS MÉTRAGES" selection.
 */
export function getShortFilms(): Film[] {
  const selections = filmsData.selections as JSONSelection[];
  const shortFilmsSelection = selections.find(
    (s) => s.nom.toUpperCase().includes('COURTS')
  );

  if (!shortFilmsSelection) {
    return [];
  }

  return shortFilmsSelection.films.map((f): Film => {
    const bandesAnnonces: BandeAnnonce[] | undefined = f.bandesAnnonces
      ?.filter((ba): ba is JSONBandeAnnonce & { url: string } => !!ba.url)
      .map(ba => ({
        raw: ba.raw,
        url: ba.url,
        platform: ba.platform as BandeAnnonce['platform'],
      }));

    return {
      titre: f.titre,
      realisateurs: f.realisateurs,
      slug: f.slug,
      imageUrl: f.imageUrl,
      images: f.images,
      imageFilm: f.imageFilm,
      imagePoster: f.imagePoster,
      synopsis: f.synopsis,
      bandesAnnonces: bandesAnnonces?.length ? bandesAnnonces : undefined,
      selection: 'Courts métrages',
    };
  });
}

/**
 * Check if a seance is a short films session.
 * Short films sessions have multiple film IDs separated by commas in _id_film.
 */
export function isShortFilmsSession(seance: Seance): boolean {
  // Short films sessions have multiple film IDs (comma-separated)
  if (seance._id_film && seance._id_film.includes(',')) {
    return true;
  }
  return false;
}

/**
 * Convert API film to our Film type.
 */
function convertAPIFilmToFilm(apiFilm: APIFilm): Film {
  // Get director names
  const directors = apiFilm.directors?.map(d => d.name).join(', ') || '';

  // Get trailer URL
  let bandesAnnonces: BandeAnnonce[] | undefined;
  if (apiFilm.trailer) {
    const platform = apiFilm.trailer.includes('vimeo') ? 'vimeo'
                   : apiFilm.trailer.includes('youtube') ? 'youtube'
                   : 'other';
    bandesAnnonces = [{
      raw: apiFilm.trailer,
      url: apiFilm.trailer,
      platform,
    }];
  }

  // Remove HTML tags from synopsis
  const synopsis = apiFilm.synopsis_short_l1?.replace(/<[^>]*>/g, '') ||
                   apiFilm.synopsis_long_l1?.replace(/<[^>]*>/g, '');

  return {
    titre: apiFilm.title_l1,
    realisateurs: directors,
    slug: apiFilm.id_film || '',
    imageUrl: apiFilm.image_mini || apiFilm.image_large,
    imageFilm: apiFilm.image_mini || apiFilm.image_large,
    imagePoster: apiFilm.image_poster,
    synopsis,
    bandesAnnonces,
    selection: 'Courts métrages',
  };
}

/**
 * Get short films for a session by fetching each film from the API.
 * The seance._id_film contains comma-separated film IDs.
 */
export async function getShortFilmsForSession(seance: Seance): Promise<Film[]> {
  if (!seance._id_film) return [];

  const filmIds = seance._id_film.split(',').map(id => id.trim());
  const films: Film[] = [];

  // Fetch each film in parallel
  const fetchPromises = filmIds.map(async (id) => {
    try {
      const apiFilm = await fetchFilmDetailsClient(id);
      if (apiFilm) {
        return convertAPIFilmToFilm(apiFilm);
      }
    } catch (error) {
      console.error(`Failed to fetch film ${id}:`, error);
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);

  for (const film of results) {
    if (film) {
      films.push(film);
    }
  }

  return films;
}

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
