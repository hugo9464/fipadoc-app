/**
 * API Route to fetch presence information for films.
 * Returns a map of screening_id -> presence string.
 */

import { NextResponse } from 'next/server';
import { APIFilm, APIFilmScreening } from '@/lib/api-types';

const API_BASE = 'https://admin.fipadoc.com/wp-json/v1';

interface PresenceMap {
  [screeningId: string]: string;
}

/**
 * Extract presence string from API screening data.
 */
function getPresenceString(screening: APIFilmScreening): string | null {
  const participants = screening.qa_other_participants || [];
  if (participants.length === 0) return null;
  return "En présence de l'équipe du film";
}

/**
 * Fetch film details and extract presence info.
 */
async function fetchFilmPresence(filmId: string): Promise<PresenceMap> {
  const result: PresenceMap = {};

  try {
    const response = await fetch(`${API_BASE}/film?id=${filmId}&lang=fr`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) return result;

    const film: APIFilm = await response.json();

    if (film.program) {
      for (const screening of film.program) {
        const presence = getPresenceString(screening);
        if (presence) {
          result[screening.id_screening] = presence;
        }
      }
    }
  } catch (error) {
    console.error(`Failed to fetch presence for film ${filmId}:`, error);
  }

  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filmIds = searchParams.get('filmIds');

  if (!filmIds) {
    return NextResponse.json({ error: 'Missing filmIds parameter' }, { status: 400 });
  }

  const ids = filmIds.split(',').map(id => id.trim()).filter(Boolean);

  // Fetch all film presence data in parallel
  const presencePromises = ids.map(id => fetchFilmPresence(id));
  const presenceResults = await Promise.all(presencePromises);

  // Merge all results
  const mergedPresence: PresenceMap = {};
  for (const result of presenceResults) {
    Object.assign(mergedPresence, result);
  }

  return NextResponse.json(mergedPresence);
}
