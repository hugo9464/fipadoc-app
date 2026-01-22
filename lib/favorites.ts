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
