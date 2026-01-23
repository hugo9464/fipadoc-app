/**
 * API Module - FIPADOC 2026
 *
 * Fetch functions for the FIPADOC API endpoints.
 */

import { APIScreening, APIProgramResponse, APIFilm, FESTIVAL_DAYS } from './api-types';

const API_BASE = 'https://admin.fipadoc.com/wp-json/v1';
const IMAGE_BASE = 'https://site-fipadoc.festicine.fr/o2-film-mini-2x/fipadoc/2026';

/**
 * Build full image URL from API image link.
 */
export function buildImageUrl(link: string | undefined): string | undefined {
  if (!link) return undefined;
  if (link.startsWith('http')) return link;
  return `${IMAGE_BASE}/${link}`;
}

/**
 * Fetch screenings for a specific day with pagination.
 * Automatically fetches all pages.
 */
export async function fetchDayScreenings(
  day: string,
  lang: string = 'fr'
): Promise<APIScreening[]> {
  const allScreenings: APIScreening[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_BASE}/program?page=${page}&day=${day}&lang=${lang}`;
    const response = await fetch(url, {
      next: { revalidate: 300 }, // ISR: 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} for ${url}`);
    }

    const data: APIProgramResponse = await response.json();
    allScreenings.push(...data.program);

    hasMore = page < data.paging.number_of_pages;
    page++;
  }

  return allScreenings;
}

/**
 * Fetch programme for all festival days in parallel.
 * Returns a Map with day as key and screenings array as value.
 */
export async function fetchAllProgramme(
  lang: string = 'fr'
): Promise<Map<string, APIScreening[]>> {
  const programmeMap = new Map<string, APIScreening[]>();

  // Fetch all days in parallel
  const results = await Promise.all(
    FESTIVAL_DAYS.map(async (day) => {
      const screenings = await fetchDayScreenings(day, lang);
      return { day, screenings };
    })
  );

  for (const { day, screenings } of results) {
    programmeMap.set(day, screenings);
  }

  return programmeMap;
}

/**
 * Fetch detailed film information by ID.
 */
export async function fetchFilmDetails(
  id: string,
  lang: string = 'fr'
): Promise<APIFilm | null> {
  const url = `${API_BASE}/film?id=${id}&lang=${lang}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // ISR: 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status} for ${url}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch film ${id}:`, error);
    return null;
  }
}

/**
 * Client-side fetch for film details (for use in components).
 * Does not use Next.js caching directives.
 */
export async function fetchFilmDetailsClient(
  id: string,
  lang: string = 'fr'
): Promise<APIFilm | null> {
  const url = `${API_BASE}/film?id=${id}&lang=${lang}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch film ${id}:`, error);
    return null;
  }
}
