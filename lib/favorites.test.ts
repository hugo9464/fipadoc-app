/**
 * Unit tests for IndexedDB favorites utility
 */
import 'fake-indexeddb/auto';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
  clearAllFavorites,
} from './favorites';

describe('favorites', () => {
  beforeEach(async () => {
    await clearAllFavorites();
  });

  describe('addFavorite', () => {
    it('should add a film to favorites', async () => {
      await addFavorite('film123');
      const favorites = await getFavorites();
      expect(favorites).toContain('film123');
    });

    it('should handle adding duplicate favorites', async () => {
      await addFavorite('film123');
      await addFavorite('film123');
      const favorites = await getFavorites();
      expect(favorites.filter(id => id === 'film123')).toHaveLength(1);
    });
  });

  describe('removeFavorite', () => {
    it('should remove a film from favorites', async () => {
      await addFavorite('film123');
      await removeFavorite('film123');
      const favorites = await getFavorites();
      expect(favorites).not.toContain('film123');
    });

    it('should handle removing non-existent favorite', async () => {
      // Should not throw
      await expect(removeFavorite('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites', async () => {
      const favorites = await getFavorites();
      expect(favorites).toEqual([]);
    });

    it('should return all favorite film IDs', async () => {
      await addFavorite('film1');
      await addFavorite('film2');
      await addFavorite('film3');
      const favorites = await getFavorites();
      expect(favorites).toHaveLength(3);
      expect(favorites).toEqual(expect.arrayContaining(['film1', 'film2', 'film3']));
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorited films', async () => {
      await addFavorite('film123');
      expect(await isFavorite('film123')).toBe(true);
    });

    it('should return false for non-favorited films', async () => {
      expect(await isFavorite('notfavorited')).toBe(false);
    });
  });
});
