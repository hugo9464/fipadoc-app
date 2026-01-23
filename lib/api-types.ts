/**
 * API Type Definitions for FIPADOC 2026
 *
 * Types matching the structure of:
 * - https://admin.fipadoc.com/wp-json/v1/program (programme by day)
 * - https://admin.fipadoc.com/wp-json/v1/film (film details)
 */

/**
 * Picture object from API
 */
export interface APIPicture {
  link: string;
  copyright?: string;
}

/**
 * A screening session from the programme API
 */
export interface APIScreening {
  id_screening: string;
  id_film: string;
  season: string;
  title_l1: string;
  title_l2?: string;
  international_title?: string;
  original_title?: string;
  title_fr?: string;
  category_l1: string[];
  category_l1_slug: string[];
  category_l2?: string[];
  picture?: APIPicture;
  picture_2?: APIPicture;
  theater?: string;
  place?: string | null;
  area: string;
  day: string;
  starting_time: string;
  closing_time: string;
  duration: string;
  detail_l1?: string;
  detail_l2?: string;
}

/**
 * Paging info from API
 */
export interface APIPaging {
  count: string;
  current_page: number;
  number_of_pages: number;
  items_per_page: number;
}

/**
 * Full response from programme API
 */
export interface APIProgramResponse {
  version: string;
  season: string;
  paging: APIPaging;
  all_categories_l1: string[];
  all_categories_l1_slug: string[];
  program: APIScreening[];
}

/**
 * Director information from the film API
 */
export interface APIDirector {
  name: string;
  bio_l1?: string;
  bio_l2?: string;
  photo?: string;
}

/**
 * Detailed director information from the film API (directors_detail field)
 */
export interface APIDirectorDetail {
  name: string;
  directors_biography_l1?: string;
  directors_biography_l2?: string;
  filmography?: string;
  directors_photo?: string;
}

/**
 * Detailed film information from the film API
 */
export interface APIFilm {
  id_film?: string;
  title_l1: string;
  title_l2?: string;
  original_title?: string;
  international_title?: string;
  film_length?: number;
  synopsis_short_l1?: string;
  synopsis_short_l2?: string;
  synopsis_long_l1?: string;
  synopsis_long_l2?: string;
  picture?: APIPicture;
  picture_2?: APIPicture;
  trailer?: string;
  directors?: string; // API returns a string, not an array
  directors_detail?: Record<string, APIDirectorDetail>;
  category_l1?: string[];
  country?: string;
  country_name_l1?: string;
  secondary_countries_name_l1?: string;
  premiere?: string;
  year?: string;
  production?: string;
  producer_company?: string[];
  scriptwriter?: string;
  video_film?: string;
  video_film_pass?: string;
  website?: string;
}

/**
 * Festival days configuration
 */
export const FESTIVAL_DAYS = [
  '2026-01-24',
  '2026-01-25',
  '2026-01-26',
  '2026-01-27',
  '2026-01-28',
  '2026-01-29',
  '2026-01-30',
] as const;
