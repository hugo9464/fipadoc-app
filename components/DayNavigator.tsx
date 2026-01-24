'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { JourProgramme, Film, Seance } from '@/lib/types';
import { findTodayIndex, getShortDate, isScreeningUpcoming } from '@/lib/schedule-utils';
import { getFavorites, toggleFavorite, migrateFavorites, isMigrationComplete } from '@/lib/favorites';
import { getShortFilmsForSession, isShortFilmsSession } from '@/lib/data';
import ScreeningCard from './ScreeningCard';
import FilmDetail from './FilmDetail';
import ShortFilmsDetail from './ShortFilmsDetail';
import ViewToggle, { ViewMode } from './ViewToggle';
import CalendarView from './CalendarView';
import SearchBar from './SearchBar';
import StickyDateHeader from './StickyDateHeader';

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
  const [shortFilmsForSession, setShortFilmsForSession] = useState<Film[]>([]);
  const [shortFilmsLoading, setShortFilmsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'programme' | 'favorites'>('programme');

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const programmeScrollRef = useRef<HTMLDivElement>(null);
  const favoritesScrollRef = useRef<HTMLDivElement>(null);

  // Presence data: screeningId -> presence string
  const [presenceMap, setPresenceMap] = useState<Record<string, string>>({});

  // Load presence data in background
  useEffect(() => {
    // Collect unique film IDs (excluding short films sessions with multiple IDs)
    const filmIds = new Set<string>();
    for (const jour of programme) {
      for (const seance of jour.seances) {
        if (seance._id_film && !seance._id_film.includes(',')) {
          filmIds.add(seance._id_film);
        }
      }
    }

    if (filmIds.size === 0) return;

    // Fetch presence data
    const idsParam = Array.from(filmIds).join(',');
    fetch(`/api/presence?filmIds=${idsParam}`)
      .then(res => res.json())
      .then(data => {
        setPresenceMap(data);
      })
      .catch(err => {
        console.error('Failed to load presence data:', err);
      });
  }, [programme]);

  // Helper to get presence for a seance
  const getPresence = useCallback((seance: Seance): string | undefined => {
    if (seance.presence) return seance.presence;
    if (seance._id_screening && presenceMap[seance._id_screening]) {
      return presenceMap[seance._id_screening];
    }
    return undefined;
  }, [presenceMap]);

  // Enrich seance with presence
  const enrichSeance = useCallback((seance: Seance): Seance => {
    const presence = getPresence(seance);
    if (presence && !seance.presence) {
      return { ...seance, presence };
    }
    return seance;
  }, [getPresence]);

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

  // Get favorites for the current day (for calendar view) - upcoming only
  const currentFavoriteDate = favoriteDates[favoriteDayIndex];
  const currentDayFavorites = useMemo(() => {
    if (!currentFavoriteDate) return [];
    return favoriteScreenings
      .filter(f => f.date === currentFavoriteDate)
      .filter(f => filterUpcoming(f.seance, f.date));
  }, [favoriteScreenings, currentFavoriteDate, filterUpcoming]);

  // Filter function for search
  const filterBySearch = useCallback((seance: Seance): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const title = seance.titre?.toLowerCase() || '';
    const director = seance.realisateur?.toLowerCase() || '';
    return title.includes(query) || director.includes(query);
  }, [searchQuery]);

  // Filter function for upcoming screenings (based on current date/time)
  const filterUpcoming = useCallback((seance: Seance, date: string): boolean => {
    return isScreeningUpcoming(date, seance.heureDebut);
  }, []);

  // Current day (computed before conditional return so hooks can use it)
  const currentDay = programme[currentIndex];

  // Filtered screenings for current day (upcoming only)
  const filteredSeances = useMemo(() => {
    return currentDay?.seances
      .filter(seance => filterUpcoming(seance, currentDay.date))
      .filter(filterBySearch) || [];
  }, [currentDay?.seances, currentDay?.date, filterBySearch, filterUpcoming]);

  // All seances for current day for calendar view (upcoming only)
  const upcomingSeancesForCalendar = useMemo(() => {
    return currentDay?.seances.filter(seance => filterUpcoming(seance, currentDay.date)) || [];
  }, [currentDay?.seances, currentDay?.date, filterUpcoming]);

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

  // Filtered favorites for current day (already filtered for upcoming in currentDayFavorites)
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
      // Fetch the short films for this session
      setShortFilmsLoading(true);
      getShortFilmsForSession(seance)
        .then(films => {
          setShortFilmsForSession(films);
          setShortFilmsLoading(false);
        })
        .catch(() => {
          setShortFilmsForSession([]);
          setShortFilmsLoading(false);
        });
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
    setShortFilmsForSession([]);
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
          {/* Navigation header with search bar and view toggle */}
          <header className="flex items-center p-sm px-md bg-surface border-b border-border gap-sm">
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
            <div ref={programmeScrollRef} className="flex-1 overflow-y-auto bg-background">
              {/* Sticky date header with arrows and parallax - hidden during search */}
              {!searchQuery.trim() && (
                <StickyDateHeader
                  date={currentDay.date}
                  scrollContainerRef={programmeScrollRef}
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                  onPrevious={goToPrevious}
                  onNext={goToNext}
                />
              )}
              <div className="p-md">
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
                          const enrichedSeance = enrichSeance(seance);
                          const otherScreenings = seance.titre
                            ? getOtherScreenings(seance.titre, itemDate, seance.heureDebut)
                            : undefined;
                          return (
                            <ScreeningCard
                              key={`${screeningId}-${idx}`}
                              seance={enrichedSeance}
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
                  const enrichedSeance = enrichSeance(seance);
                  const film = findFilm(seance.titre);
                  const screeningId = getScreeningId(currentDay.date, seance);
                  const otherScreenings = seance.titre
                    ? getOtherScreenings(seance.titre, currentDay.date, seance.heureDebut)
                    : undefined;
                  return (
                    <ScreeningCard
                      key={`${seance.heureDebut}-${seance.lieu}-${idx}`}
                      seance={enrichedSeance}
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
            </div>
          ) : (
            <CalendarView
              seances={(searchQuery ? filteredSeances : upcomingSeancesForCalendar).map(enrichSeance)}
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
            <div className="flex-1 p-md overflow-y-auto pt-0 bg-background">
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
              {/* Navigation header with search bar and view toggle for favorites */}
              <header className="flex items-center p-sm px-md bg-surface border-b border-border gap-sm">
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
                <div ref={favoritesScrollRef} className="flex-1 overflow-y-auto bg-background">
                  {/* Sticky date header with arrows and parallax - hidden during search */}
                  {!searchQuery.trim() && currentFavoriteDate && (
                    <StickyDateHeader
                      date={currentFavoriteDate}
                      scrollContainerRef={favoritesScrollRef}
                      hasPrevious={favoriteDayIndex > 0}
                      hasNext={favoriteDayIndex < favoriteDates.length - 1}
                      onPrevious={() => setFavoriteDayIndex(Math.max(0, favoriteDayIndex - 1))}
                      onNext={() => setFavoriteDayIndex(Math.min(favoriteDates.length - 1, favoriteDayIndex + 1))}
                    />
                  )}
                  <div className="p-md pt-0">
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
                                seance={enrichSeance(seance)}
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
                        seance={enrichSeance(seance)}
                        film={film}
                        onSelect={(s, f) => handleSelectSeance(s, f, date)}
                        isFavorite={true}
                        onToggleFavorite={() => handleToggleFavorite(screeningId)}
                      />
                    ))
                  )}
                  </div>
                </div>
              ) : (
                <CalendarView
                  seances={currentDayFavorites.map(f => enrichSeance(f.seance))}
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
      {selectedShortFilmsSession && !shortFilmsLoading && (
        <ShortFilmsDetail
          films={shortFilmsForSession}
          seance={selectedShortFilmsSession.seance}
          date={selectedShortFilmsSession.date}
          onClose={closeShortFilmsDetail}
        />
      )}
    </div>
  );
}
