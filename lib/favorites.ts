/**
 * IndexedDB Favorites Utility - Client-Side Only
 *
 * This module provides local persistence for user favorites using IndexedDB.
 * Favorites are stored locally in the browser and persist across sessions
 * without requiring server interaction.
 *
 * IMPORTANT: This module is client-side only. When importing in React components,
 * ensure you use the 'use client' directive:
 *
 *   'use client';
 *   import { addFavorite, removeFavorite, getFavorites, isFavorite } from '@/lib/favorites';
 *
 * The module handles IndexedDB unavailability gracefully (e.g., in SSR or
 * browsers without IndexedDB support).
 *
 * ## Migration Support (v1.1 → v1.2)
 *
 * Old favorites format: "date|heure|lieu|titre" (e.g., "Samedi 24 janvier 2026|09:30|Royal 1|l'île aux esclaves")
 * New favorites format: screening ID (e.g., "1523")
 *
 * The migration happens automatically when the app loads and programme data is available.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Database schema definition for IndexedDB
 */
interface FipadocDB extends DBSchema {
  favorites: {
    key: string;
    value: {
      filmId: string;
      addedAt: number;
    };
  };
}

const DB_NAME = 'fipadoc-favorites';
const DB_VERSION = 1;
const MIGRATION_KEY = 'fipadoc_favorites_migrated_v2';

/**
 * Singleton promise for the database connection.
 * This ensures we only open one connection per session.
 */
let dbPromise: Promise<IDBPDatabase<FipadocDB>> | null = null;

/**
 * Check if IndexedDB is available in the current environment.
 * Returns false during SSR or in environments without IndexedDB support.
 */
function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.indexedDB !== 'undefined'
  );
}

/**
 * Get or create the database connection.
 * Uses a singleton pattern to reuse the same connection.
 *
 * @returns Promise resolving to the database instance
 * @throws Error if IndexedDB is not available
 */
function getDB(): Promise<IDBPDatabase<FipadocDB>> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(
      new Error('IndexedDB is not available in this environment')
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<FipadocDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create the favorites object store if it doesn't exist
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'filmId' });
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Check if migration has been completed.
 */
export function isMigrationComplete(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete.
 */
function markMigrationComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
}

/**
 * Check if a favorite ID looks like the old format (contains |).
 */
function isOldFormat(id: string): boolean {
  return id.includes('|');
}

/**
 * Parse an old format favorite ID.
 * Format: "date|heureDebut|lieu|titre"
 */
function parseOldFavorite(id: string): { date: string; heureDebut: string; lieu: string; titre: string } | null {
  const parts = id.split('|');
  if (parts.length !== 4) return null;

  return {
    date: parts[0],
    heureDebut: parts[1],
    lieu: parts[2],
    titre: parts[3],
  };
}

/**
 * Screening data type for migration.
 */
interface ScreeningForMigration {
  date: string;
  heureDebut: string;
  lieu: string;
  titre?: string;
  _id_screening?: string;
}

/**
 * Migrate old favorites to new format using programme data.
 *
 * @param screenings - All screenings from the programme (with _id_screening)
 * @returns Number of favorites migrated
 */
export async function migrateFavorites(
  screenings: ScreeningForMigration[]
): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;
  if (isMigrationComplete()) return 0;

  const db = await getDB();
  const allFavorites = await db.getAll('favorites');
  const oldFavorites = allFavorites.filter((f) => isOldFormat(f.filmId));

  if (oldFavorites.length === 0) {
    markMigrationComplete();
    return 0;
  }

  // Build a lookup map for screenings
  const screeningMap = new Map<string, string>();
  for (const s of screenings) {
    if (!s._id_screening) continue;

    // Create lookup key matching old format: date|heureDebut|lieu|titre
    const key = `${s.date}|${s.heureDebut}|${s.lieu}|${(s.titre || '').toLowerCase()}`;
    screeningMap.set(key, s._id_screening);
  }

  let migratedCount = 0;

  for (const oldFav of oldFavorites) {
    const parsed = parseOldFavorite(oldFav.filmId);
    if (!parsed) continue;

    // Try to find the matching screening
    const lookupKey = `${parsed.date}|${parsed.heureDebut}|${parsed.lieu}|${parsed.titre}`;
    const newId = screeningMap.get(lookupKey);

    if (newId) {
      // Add new favorite with id_screening
      await db.put('favorites', { filmId: newId, addedAt: oldFav.addedAt });
      // Remove old favorite
      await db.delete('favorites', oldFav.filmId);
      migratedCount++;
    }
  }

  markMigrationComplete();
  return migratedCount;
}

/**
 * Add a film to favorites.
 *
 * @param filmId - The unique identifier of the film to add
 * @returns Promise that resolves when the film is added
 *
 * @example
 * await addFavorite('film123');
 */
export async function addFavorite(filmId: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  const db = await getDB();
  await db.put('favorites', { filmId, addedAt: Date.now() });
}

/**
 * Remove a film from favorites.
 *
 * @param filmId - The unique identifier of the film to remove
 * @returns Promise that resolves when the film is removed
 *
 * @example
 * await removeFavorite('film123');
 */
export async function removeFavorite(filmId: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  const db = await getDB();
  await db.delete('favorites', filmId);
}

/**
 * Get all favorite film IDs.
 *
 * @returns Promise resolving to an array of film IDs
 *
 * @example
 * const favorites = await getFavorites();
 * // ['film123', 'film456', 'film789']
 */
export async function getFavorites(): Promise<string[]> {
  if (!isIndexedDBAvailable()) {
    return [];
  }

  const db = await getDB();
  const all = await db.getAll('favorites');
  return all.map((f) => f.filmId);
}

/**
 * Check if a film is in favorites.
 *
 * @param filmId - The unique identifier of the film to check
 * @returns Promise resolving to true if the film is a favorite, false otherwise
 *
 * @example
 * const isFav = await isFavorite('film123');
 * // true or false
 */
export async function isFavorite(filmId: string): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    return false;
  }

  const db = await getDB();
  const result = await db.get('favorites', filmId);
  return !!result;
}

/**
 * Toggle a film's favorite status.
 * If the film is a favorite, it will be removed. Otherwise, it will be added.
 *
 * @param filmId - The unique identifier of the film to toggle
 * @returns Promise resolving to the new favorite status (true if now a favorite)
 *
 * @example
 * const isNowFavorite = await toggleFavorite('film123');
 */
export async function toggleFavorite(filmId: string): Promise<boolean> {
  const currentStatus = await isFavorite(filmId);

  if (currentStatus) {
    await removeFavorite(filmId);
    return false;
  } else {
    await addFavorite(filmId);
    return true;
  }
}

/**
 * Clear all favorites from the database.
 * Use with caution - this action cannot be undone.
 *
 * @returns Promise that resolves when all favorites are cleared
 *
 * @example
 * await clearAllFavorites();
 */
export async function clearAllFavorites(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  const db = await getDB();
  await db.clear('favorites');
}

/**
 * Get the count of favorite films.
 *
 * @returns Promise resolving to the number of favorites
 *
 * @example
 * const count = await getFavoritesCount();
 * // 5
 */
export async function getFavoritesCount(): Promise<number> {
  if (!isIndexedDBAvailable()) {
    return 0;
  }

  const db = await getDB();
  return db.count('favorites');
}
