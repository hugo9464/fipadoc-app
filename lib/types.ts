/**
 * Data Type Definitions for FIPADOC 2026
 *
 * Types matching the structure of:
 * - fipadoc-2026-programme.json (schedule by day)
 * - fipadoc-2026-films-complet.json (film details)
 */

/**
 * A scheduled screening session
 */
export interface Seance {
  /** Film title (may be undefined for grouped sessions) */
  titre?: string;
  /** Start time in HH:MM format */
  heureDebut: string;
  /** End time in HH:MM format */
  heureFin: string;
  /** Venue name */
  lieu: string;
  /** Category (e.g., "Documentaire musical", "Compétition") */
  categorie: string;
  /** Director name */
  realisateur: string;
  /** Thumbnail image URL */
  image?: string;
  /** Presence info (e.g., "En présence de l'équipe du film") */
  presence?: string;
}

/**
 * A day in the festival programme
 */
export interface JourProgramme {
  /** Date in French format (e.g., "Samedi 24 janvier 2026") */
  date: string;
  /** List of screenings for this day */
  seances: Seance[];
}

/**
 * Full programme data structure
 */
export interface Programme {
  festival: string;
  dateExtraction: string;
  source: string;
  jours: JourProgramme[];
}

/**
 * Trailer/video link
 */
export interface BandeAnnonce {
  raw: string;
  url: string;
  platform: 'vimeo' | 'youtube' | 'other';
}

/**
 * Detailed film information from fipadoc-2026-films-complet.json
 */
export interface Film {
  /** Film title */
  titre: string;
  /** Director(s) name */
  realisateurs: string;
  /** URL slug for the film page */
  slug: string;
  /** Main image URL */
  imageUrl?: string;
  /** All available images */
  images?: string[];
  /** Main film image */
  imageFilm?: string;
  /** Poster image */
  imagePoster?: string;
  /** Film synopsis */
  synopsis?: string;
  /** Trailer links */
  bandesAnnonces?: BandeAnnonce[];
  /** Festival selection category */
  selection?: string;
  /** URL to film page */
  url?: string;
}

/**
 * Selection category containing multiple films
 */
export interface Selection {
  nom: string;
  description?: string;
  url: string;
  films: Film[];
}

/**
 * Full films data structure
 */
export interface FilmsData {
  festival: string;
  dateExtraction: string;
  sourceUrl: string;
  nombreSelections: number;
  nombreTotalFilms: number;
  selections: Selection[];
}
