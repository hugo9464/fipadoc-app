'use client';

import { useState, useMemo, useEffect } from 'react';
import { JourProgramme, Film, Seance } from '@/lib/types';
import { findTodayIndex, getShortDate } from '@/lib/schedule-utils';
import { getFavorites, toggleFavorite } from '@/lib/favorites';
import { getScreeningsForFilm } from '@/lib/data';
import ScreeningCard from './ScreeningCard';
import FilmDetail from './FilmDetail';
import ViewToggle, { ViewMode } from './ViewToggle';
import CalendarView from './CalendarView';

interface DayNavigatorProps {
  programme: JourProgramme[];
  filmsIndex: Map<string, Film>;
}

function getScreeningId(date: string, seance: Seance): string {
  return `${date}|${seance.heureDebut}|${seance.lieu}|${seance.titre?.toLowerCase() || ''}`;
}

export default function DayNavigator({ programme, filmsIndex }: DayNavigatorProps) {
  const initialIndex = useMemo(
    () => findTodayIndex(programme.map(j => j.date)),
    [programme]
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedScreening, setSelectedScreening] = useState<{ film: Film; seance: Seance; date: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'programme' | 'favorites'>('programme');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    getFavorites().then(ids => {
      setFavorites(new Set(ids));
      setFavoritesLoading(false);
    });
  }, []);

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

  if (programme.length === 0) {
    return (
      <p className="text-center text-text-secondary p-xl">
        Aucune projection programmée
      </p>
    );
  }

  const currentDay = programme[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < programme.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  const handleSelectSeance = (seance: Seance, film?: Film, date?: string) => {
    if (film && date) {
      setSelectedScreening({ film, seance, date });
    }
  };

  const closeDetail = () => {
    setSelectedScreening(null);
  };

  const findFilm = (titre?: string): Film | undefined => {
    if (!titre) return undefined;
    return filmsIndex.get(titre.toLowerCase());
  };

  // Get other screenings for a film (excluding current one)
  const getOtherScreenings = (filmTitle: string, currentDate: string, currentTime: string) => {
    const allScreenings = getScreeningsForFilm(filmTitle);
    return allScreenings
      .filter(s => !(s.date === currentDate && s.seance.heureDebut === currentTime))
      .map(s => ({
        date: getShortDate(s.date),
        time: s.seance.heureDebut,
        isFavorite: favorites.has(getScreeningId(s.date, s.seance)),
      }));
  };

  // Get all screenings for a film with full details
  const getAllScreeningsWithDetails = (filmTitle: string) => {
    const allScreenings = getScreeningsForFilm(filmTitle);
    return allScreenings.map(s => ({
      date: s.date,
      seance: s.seance,
      screeningId: getScreeningId(s.date, s.seance),
      isFavorite: favorites.has(getScreeningId(s.date, s.seance)),
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex bg-background border-b border-border">
        <button
          className={`flex-1 flex items-center justify-center gap-xs p-md border-none bg-transparent text-[0.9rem] font-medium cursor-pointer transition-colors duration-150 border-b-2 -mb-px ${
            activeTab === 'programme'
              ? 'text-foreground border-foreground'
              : 'text-text-secondary border-transparent hover:text-foreground'
          }`}
          onClick={() => setActiveTab('programme')}
        >
          Programme
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-xs p-md border-none bg-transparent text-[0.9rem] font-medium cursor-pointer transition-colors duration-150 border-b-2 -mb-px ${
            activeTab === 'favorites'
              ? 'text-foreground border-foreground'
              : 'text-text-secondary border-transparent hover:text-foreground'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          Mon programme
          {favorites.size > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-foreground text-background text-[0.75rem] font-semibold rounded-full">
              {favorites.size}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'programme' ? (
        <>
          {/* Navigation header with view toggle */}
          <header className="flex items-center justify-between p-sm px-md bg-surface border-b border-border gap-sm">
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="flex items-center justify-center w-11 h-11 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
              aria-label="Jour précédent"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex items-center gap-sm flex-1 justify-center">
              <h2 className="text-base sm:text-lg font-semibold text-foreground text-center">
                {currentDay.date}
              </h2>
            </div>

            <button
              onClick={goToNext}
              disabled={!hasNext}
              className="flex items-center justify-center w-11 h-11 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
              aria-label="Jour suivant"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </header>

          {/* Day indicator dots */}
          <div className="flex justify-center gap-sm p-sm px-md bg-surface">
            {programme.map((day, index) => (
              <button
                key={day.date}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-150 hover:bg-text-muted ${
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

          {/* Screenings - list or calendar view */}
          {viewMode === 'list' ? (
            <div className="flex-1 p-md overflow-y-auto">
              {currentDay.seances.map((seance, idx) => {
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
              })}
            </div>
          ) : (
            <CalendarView
              seances={currentDay.seances}
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
                <p className="m-0 text-base">Aucun favori</p>
                <p className="text-[0.85rem] text-text-muted mt-sm">Ajoutez des films à votre programme en cliquant sur le coeur</p>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation header with view toggle for favorites */}
              <header className="flex items-center justify-between p-sm px-md bg-surface border-b border-border gap-sm">
                <button
                  onClick={() => setFavoriteDayIndex(Math.max(0, favoriteDayIndex - 1))}
                  disabled={favoriteDayIndex === 0}
                  className="flex items-center justify-center w-11 h-11 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                  aria-label="Jour précédent"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="flex items-center gap-sm flex-1 justify-center">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground text-center">
                    {currentFavoriteDate}
                  </h2>
                </div>

                <button
                  onClick={() => setFavoriteDayIndex(Math.min(favoriteDates.length - 1, favoriteDayIndex + 1))}
                  disabled={favoriteDayIndex === favoriteDates.length - 1}
                  className="flex items-center justify-center w-11 h-11 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
                  aria-label="Jour suivant"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </header>

              {/* Day indicator dots for favorites */}
              <div className="flex justify-center gap-sm p-sm px-md bg-surface">
                {favoriteDates.map((date, index) => (
                  <button
                    key={date}
                    onClick={() => setFavoriteDayIndex(index)}
                    className={`w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-150 hover:bg-text-muted ${
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

              {/* Favorites - list or calendar view */}
              {viewMode === 'list' ? (
                <div className="flex-1 p-md overflow-y-auto pt-0">
                  {currentDayFavorites.map(({ date, seance, film, screeningId }) => (
                    <ScreeningCard
                      key={screeningId}
                      seance={seance}
                      film={film}
                      onSelect={(s, f) => handleSelectSeance(s, f, date)}
                      isFavorite={true}
                      onToggleFavorite={() => handleToggleFavorite(screeningId)}
                    />
                  ))}
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
    </div>
  );
}
