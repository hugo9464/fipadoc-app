'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { JourProgramme, Film, Seance } from '@/lib/types';
import { findTodayIndex, getShortDate } from '@/lib/schedule-utils';
import { getFavorites, toggleFavorite, migrateFavorites, isMigrationComplete } from '@/lib/favorites';
import { getShortFilms, isShortFilmsSession } from '@/lib/data';
import ScreeningCard from './ScreeningCard';
import FilmDetail from './FilmDetail';
import ShortFilmsDetail from './ShortFilmsDetail';
import ViewToggle, { ViewMode } from './ViewToggle';
import CalendarView from './CalendarView';
import SearchBar from './SearchBar';

interface DayNavigatorProps {
  programme: JourProgramme[];
  filmsIndex: Map<string, Film>;
}

/**
 * Get unique screening ID, preferring API _id_screening, falling back to composite.
 */
function getScreeningId(date: string, seance: Seance): string {
  // Use API screening ID if available (new format)
  if (seance._id_screening) {
    return seance._id_screening;
  }
  // Fall back to composite ID (old format, for backwards compatibility)
  return `${date}|${seance.heureDebut}|${seance.lieu}|${seance.titre?.toLowerCase() || ''}`;
}

export default function DayNavigator({ programme, filmsIndex }: DayNavigatorProps) {
  const initialIndex = useMemo(
    () => findTodayIndex(programme.map(j => j.date)),
    [programme]
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedScreening, setSelectedScreening] = useState<{ film: Film; seance: Seance; date: string } | null>(null);
  const [selectedShortFilmsSession, setSelectedShortFilmsSession] = useState<{ seance: Seance; date: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'programme' | 'favorites'>('programme');

  // Get short films from local data
  const shortFilms = useMemo(() => getShortFilms(), []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Run favorites migration on mount
  useEffect(() => {
    async function loadAndMigrateFavorites() {
      // Migrate old favorites if needed
      if (!isMigrationComplete()) {
        // Collect all screenings for migration
        const allScreenings: Array<{
          date: string;
          heureDebut: string;
          lieu: string;
          titre?: string;
          _id_screening?: string;
        }> = [];

        for (const jour of programme) {
          for (const seance of jour.seances) {
            allScreenings.push({
              date: jour.date,
              heureDebut: seance.heureDebut,
              lieu: seance.lieu,
              titre: seance.titre,
              _id_screening: seance._id_screening,
            });
          }
        }

        await migrateFavorites(allScreenings);
      }

      // Load favorites
      const ids = await getFavorites();
      setFavorites(new Set(ids));
      setFavoritesLoading(false);
    }

    loadAndMigrateFavorites();
  }, [programme]);

  const handleToggleFavorite = async (screeningId: string) => {
    const isNowFavorite = await toggleFavorite(screeningId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isNowFavorite) {
        next.add(screeningId);
      } else {
        next.delete(screeningId);
      }
      return next;
    });
  };

  const favoriteScreenings = useMemo(() => {
    const result: { date: string; seance: Seance; film: Film; screeningId: string }[] = [];
    for (const jour of programme) {
      for (const seance of jour.seances) {
        const screeningId = getScreeningId(jour.date, seance);
        if (favorites.has(screeningId)) {
          const film = seance.titre ? filmsIndex.get(seance.titre.toLowerCase()) : undefined;
          result.push({ date: jour.date, seance, film: film!, screeningId });
        }
      }
    }
    return result.filter(item => item.film);
  }, [programme, filmsIndex, favorites]);

  // Get unique dates from favorites for day navigation
  const favoriteDates = useMemo(() => {
    const dates = [...new Set(favoriteScreenings.map(f => f.date))];
    return dates;
  }, [favoriteScreenings]);

  // Track current favorites day index
  const [favoriteDayIndex, setFavoriteDayIndex] = useState(0);

  // Reset favorites day index when dates change
  useEffect(() => {
    if (favoriteDayIndex >= favoriteDates.length) {
      setFavoriteDayIndex(Math.max(0, favoriteDates.length - 1));
    }
  }, [favoriteDates.length, favoriteDayIndex]);

  // Get favorites for the current day (for calendar view)
  const currentFavoriteDate = favoriteDates[favoriteDayIndex];
  const currentDayFavorites = useMemo(() => {
    if (!currentFavoriteDate) return [];
    return favoriteScreenings.filter(f => f.date === currentFavoriteDate);
  }, [favoriteScreenings, currentFavoriteDate]);

  // Filter function for search
  const filterBySearch = useCallback((seance: Seance): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const title = seance.titre?.toLowerCase() || '';
    const director = seance.realisateur?.toLowerCase() || '';
    return title.includes(query) || director.includes(query);
  }, [searchQuery]);

  // Current day (computed before conditional return so hooks can use it)
  const currentDay = programme[currentIndex];

  // Filtered screenings for current day
  const filteredSeances = useMemo(() => {
    return currentDay?.seances.filter(filterBySearch) || [];
  }, [currentDay?.seances, filterBySearch]);

  // All filtered screenings across all days (for search results)
  const allFilteredScreenings = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: { date: string; seance: Seance; film: Film | undefined; screeningId: string }[] = [];
    for (const jour of programme) {
      for (const seance of jour.seances) {
        if (filterBySearch(seance)) {
          const film = seance.titre ? filmsIndex.get(seance.titre.toLowerCase()) : undefined;
          const screeningId = getScreeningId(jour.date, seance);
          results.push({ date: jour.date, seance, film, screeningId });
        }
      }
    }
    return results;
  }, [programme, filmsIndex, searchQuery, filterBySearch]);

  // Filtered favorites for current day
  const filteredFavorites = useMemo(() => {
    return currentDayFavorites.filter(f => filterBySearch(f.seance));
  }, [currentDayFavorites, filterBySearch]);

  // All filtered favorites across all days (for search results)
  const allFilteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return favoriteScreenings.filter(f => filterBySearch(f.seance));
  }, [favoriteScreenings, searchQuery, filterBySearch]);

  if (programme.length === 0) {
    return (
      <p className="text-center text-text-secondary p-xl">
        Aucune projection programmee
      </p>
    );
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < programme.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  const handleSelectSeance = (seance: Seance, film?: Film, date?: string) => {
    if (!date) return;

    // Check if this is a short films session
    if (isShortFilmsSession(seance)) {
      setSelectedShortFilmsSession({ seance, date });
      return;
    }

    if (film) {
      setSelectedScreening({ film, seance, date });
    }
  };

  const closeDetail = () => {
    setSelectedScreening(null);
  };

  const closeShortFilmsDetail = () => {
    setSelectedShortFilmsSession(null);
  };

  const findFilm = (titre?: string): Film | undefined => {
    if (!titre) return undefined;
    return filmsIndex.get(titre.toLowerCase());
  };

  // Get other screenings for a film (excluding current one)
  const getOtherScreenings = (filmTitle: string, currentDate: string, currentTime: string) => {
    const allScreenings: { date: string; time: string; isFavorite: boolean }[] = [];

    for (const jour of programme) {
      for (const seance of jour.seances) {
        if (seance.titre?.toLowerCase() === filmTitle.toLowerCase()) {
          if (!(jour.date === currentDate && seance.heureDebut === currentTime)) {
            const screeningId = getScreeningId(jour.date, seance);
            allScreenings.push({
              date: getShortDate(jour.date),
              time: seance.heureDebut,
              isFavorite: favorites.has(screeningId),
            });
          }
        }
      }
    }

    return allScreenings;
  };

  // Get all screenings for a film with full details
  const getAllScreeningsWithDetails = (filmTitle: string) => {
    const result: { date: string; seance: Seance; screeningId: string; isFavorite: boolean }[] = [];

    for (const jour of programme) {
      for (const seance of jour.seances) {
        if (seance.titre?.toLowerCase() === filmTitle.toLowerCase()) {
          const screeningId = getScreeningId(jour.date, seance);
          result.push({
            date: jour.date,
            seance,
            screeningId,
            isFavorite: favorites.has(screeningId),
          });
        }
      }
    }

    return result;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex bg-background border-b border-border">
        <button
          className={`flex-1 flex items-center justify-center gap-xs py-md px-sm border-none bg-transparent font-heading text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all duration-150 border-b-2 -mb-px ${
            activeTab === 'programme'
              ? 'text-foreground border-foreground'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
          onClick={() => setActiveTab('programme')}
        >
          Programme
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-xs py-md px-sm border-none bg-transparent font-heading text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all duration-150 border-b-2 -mb-px ${
            activeTab === 'favorites'
              ? 'text-foreground border-foreground'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          Mon programme
          {favorites.size > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-foreground text-background text-[0.7rem] font-bold rounded-full">
              {favorites.size}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'programme' ? (
        <>
          {/* Navigation header with view toggle */}
          <header className="flex items-center justify-between p-sm px-md bg-surface border-b border-border gap-sm">
            {!searchQuery.trim() && (
              <button
                onClick={goToPrevious}
                disabled={!hasPrevious}
                className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                aria-label="Jour precedent"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-sm flex-1 justify-center">
              <h2 className="font-heading text-base sm:text-lg font-semibold text-foreground text-center uppercase tracking-wide">
                {searchQuery.trim() ? `Resultats (${allFilteredScreenings.length})` : currentDay.date}
              </h2>
            </div>

            {!searchQuery.trim() && (
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                aria-label="Jour suivant"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            {!searchQuery.trim() && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
          </header>

          {/* Day indicator dots - hidden during search */}
          {!searchQuery.trim() && (
            <div className="flex justify-center gap-2 p-sm px-md bg-surface">
              {programme.map((day, index) => (
                <button
                  key={day.date}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-150 hover:bg-text-secondary ${
                    index === currentIndex
                      ? 'bg-foreground scale-125'
                      : 'bg-border'
                  }`}
                  aria-label={day.date}
                  aria-current={index === currentIndex ? 'true' : undefined}
                  title={getShortDate(day.date)}
                />
              ))}
            </div>
          )}

          {/* Screenings - list or calendar view */}
          {viewMode === 'list' || searchQuery.trim() ? (
            <div className="flex-1 p-md overflow-y-auto">
              {searchQuery.trim() ? (
                // Search results across all days
                allFilteredScreenings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-xl text-center text-text-secondary min-h-[200px]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted mb-md">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="m-0 text-base font-heading uppercase tracking-wide">Aucun resultat</p>
                    <p className="text-[0.85rem] text-text-muted mt-sm">Aucun film ne correspond a "{searchQuery}"</p>
                  </div>
                ) : (
                  // Group results by date
                  (() => {
                    const groupedByDate = allFilteredScreenings.reduce((acc, item) => {
                      if (!acc[item.date]) acc[item.date] = [];
                      acc[item.date].push(item);
                      return acc;
                    }, {} as Record<string, typeof allFilteredScreenings>);

                    return Object.entries(groupedByDate).map(([date, items]) => (
                      <div key={date} className="mb-lg">
                        <h3 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wide mb-sm px-xs border-b border-border pb-xs">
                          {getShortDate(date)}
                        </h3>
                        {items.map(({ seance, film, screeningId, date: itemDate }, idx) => {
                          const otherScreenings = seance.titre
                            ? getOtherScreenings(seance.titre, itemDate, seance.heureDebut)
                            : undefined;
                          return (
                            <ScreeningCard
                              key={`${screeningId}-${idx}`}
                              seance={seance}
                              film={film}
                              onSelect={(s, f) => handleSelectSeance(s, f, itemDate)}
                              isFavorite={favorites.has(screeningId)}
                              onToggleFavorite={film ? () => handleToggleFavorite(screeningId) : undefined}
                              otherScreenings={otherScreenings}
                            />
                          );
                        })}
                      </div>
                    ));
                  })()
                )
              ) : (
                // Regular day view
                filteredSeances.map((seance, idx) => {
                  const film = findFilm(seance.titre);
                  const screeningId = getScreeningId(currentDay.date, seance);
                  const otherScreenings = seance.titre
                    ? getOtherScreenings(seance.titre, currentDay.date, seance.heureDebut)
                    : undefined;
                  return (
                    <ScreeningCard
                      key={`${seance.heureDebut}-${seance.lieu}-${idx}`}
                      seance={seance}
                      film={film}
                      onSelect={(s, f) => handleSelectSeance(s, f, currentDay.date)}
                      isFavorite={favorites.has(screeningId)}
                      onToggleFavorite={film ? () => handleToggleFavorite(screeningId) : undefined}
                      otherScreenings={otherScreenings}
                    />
                  );
                })
              )}
            </div>
          ) : (
            <CalendarView
              seances={searchQuery ? filteredSeances : currentDay.seances}
              date={currentDay.date}
              filmsIndex={filmsIndex}
              favorites={favorites}
              getScreeningId={getScreeningId}
              onSelectSeance={(seance, film) => handleSelectSeance(seance, film, currentDay.date)}
            />
          )}
        </>
      ) : (
        <>
          {favoritesLoading ? (
            <p className="text-center text-text-secondary p-xl">Chargement...</p>
          ) : favoriteScreenings.length === 0 ? (
            <div className="flex-1 p-md overflow-y-auto pt-0">
              <div className="flex flex-col items-center justify-center p-xl px-lg text-center text-text-secondary min-h-[300px]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted mb-md">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p className="m-0 text-base font-heading uppercase tracking-wide">Aucun favori</p>
                <p className="text-[0.85rem] text-text-muted mt-sm">Ajoutez des films a votre programme en cliquant sur le coeur</p>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation header with view toggle for favorites */}
              <header className="flex items-center justify-between p-sm px-md bg-surface border-b border-border gap-sm">
                {!searchQuery.trim() && (
                  <button
                    onClick={() => setFavoriteDayIndex(Math.max(0, favoriteDayIndex - 1))}
                    disabled={favoriteDayIndex === 0}
                    className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                    aria-label="Jour precedent"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}

                <div className="flex items-center gap-sm flex-1 justify-center">
                  <h2 className="font-heading text-base sm:text-lg font-semibold text-foreground text-center uppercase tracking-wide">
                    {searchQuery.trim() ? `Resultats (${allFilteredFavorites.length})` : currentFavoriteDate}
                  </h2>
                </div>

                {!searchQuery.trim() && (
                  <button
                    onClick={() => setFavoriteDayIndex(Math.min(favoriteDates.length - 1, favoriteDayIndex + 1))}
                    disabled={favoriteDayIndex === favoriteDates.length - 1}
                    className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                    aria-label="Jour suivant"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}

                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                {!searchQuery.trim() && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
              </header>

              {/* Day indicator dots for favorites - hidden during search */}
              {!searchQuery.trim() && (
                <div className="flex justify-center gap-2 p-sm px-md bg-surface">
                  {favoriteDates.map((date, index) => (
                    <button
                      key={date}
                      onClick={() => setFavoriteDayIndex(index)}
                      className={`w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-150 hover:bg-text-secondary ${
                        index === favoriteDayIndex
                          ? 'bg-foreground scale-125'
                          : 'bg-border'
                      }`}
                      aria-label={date}
                      aria-current={index === favoriteDayIndex ? 'true' : undefined}
                      title={getShortDate(date)}
                    />
                  ))}
                </div>
              )}

              {/* Favorites - list or calendar view */}
              {viewMode === 'list' || searchQuery.trim() ? (
                <div className="flex-1 p-md overflow-y-auto pt-0">
                  {searchQuery.trim() ? (
                    // Search results across all favorites
                    allFilteredFavorites.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-xl text-center text-text-secondary min-h-[200px]">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted mb-md">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <p className="m-0 text-base font-heading uppercase tracking-wide">Aucun resultat</p>
                        <p className="text-[0.85rem] text-text-muted mt-sm">Aucun favori ne correspond a "{searchQuery}"</p>
                      </div>
                    ) : (
                      // Group results by date
                      (() => {
                        const groupedByDate = allFilteredFavorites.reduce((acc, item) => {
                          if (!acc[item.date]) acc[item.date] = [];
                          acc[item.date].push(item);
                          return acc;
                        }, {} as Record<string, typeof allFilteredFavorites>);

                        return Object.entries(groupedByDate).map(([date, items]) => (
                          <div key={date} className="mb-lg">
                            <h3 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wide mb-sm px-xs border-b border-border pb-xs">
                              {getShortDate(date)}
                            </h3>
                            {items.map(({ seance, film, screeningId, date: itemDate }) => (
                              <ScreeningCard
                                key={screeningId}
                                seance={seance}
                                film={film}
                                onSelect={(s, f) => handleSelectSeance(s, f, itemDate)}
                                isFavorite={true}
                                onToggleFavorite={() => handleToggleFavorite(screeningId)}
                              />
                            ))}
                          </div>
                        ));
                      })()
                    )
                  ) : (
                    // Regular day view
                    filteredFavorites.map(({ date, seance, film, screeningId }) => (
                      <ScreeningCard
                        key={screeningId}
                        seance={seance}
                        film={film}
                        onSelect={(s, f) => handleSelectSeance(s, f, date)}
                        isFavorite={true}
                        onToggleFavorite={() => handleToggleFavorite(screeningId)}
                      />
                    ))
                  )}
                </div>
              ) : (
                <CalendarView
                  seances={currentDayFavorites.map(f => f.seance)}
                  date={currentFavoriteDate}
                  filmsIndex={filmsIndex}
                  favorites={favorites}
                  getScreeningId={getScreeningId}
                  onSelectSeance={(seance, film) => handleSelectSeance(seance, film, currentFavoriteDate)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Film detail modal */}
      {selectedScreening && (
        <FilmDetail
          film={selectedScreening.film}
          seance={selectedScreening.seance}
          onClose={closeDetail}
          isFavorite={favorites.has(getScreeningId(selectedScreening.date, selectedScreening.seance))}
          onToggleFavorite={() => handleToggleFavorite(getScreeningId(selectedScreening.date, selectedScreening.seance))}
          allScreenings={getAllScreeningsWithDetails(selectedScreening.film.titre)}
          onToggleScreeningFavorite={handleToggleFavorite}
        />
      )}

      {/* Short films session modal */}
      {selectedShortFilmsSession && (
        <ShortFilmsDetail
          films={shortFilms}
          seance={selectedShortFilmsSession.seance}
          date={selectedShortFilmsSession.date}
          onClose={closeShortFilmsDetail}
        />
      )}
    </div>
  );
}
