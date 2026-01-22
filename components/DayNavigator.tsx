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
      <p className="empty-message">
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
    <div className="day-navigator">
      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 'programme' ? 'active' : ''}`}
          onClick={() => setActiveTab('programme')}
        >
          Programme
        </button>
        <button
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Mon programme
          {favorites.size > 0 && (
            <span className="tab-badge">{favorites.size}</span>
          )}
        </button>
      </div>

      {activeTab === 'programme' ? (
        <>
          {/* Navigation header with view toggle */}
          <header className="nav-header-with-toggle">
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="nav-button"
              aria-label="Jour précédent"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="nav-header-center">
              <h2 className="current-date">
                {currentDay.date}
              </h2>
            </div>

            <button
              onClick={goToNext}
              disabled={!hasNext}
              className="nav-button"
              aria-label="Jour suivant"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </header>

          {/* Day indicator dots */}
          <div className="day-indicators">
            {programme.map((day, index) => (
              <button
                key={day.date}
                onClick={() => setCurrentIndex(index)}
                className={`day-dot ${index === currentIndex ? 'active' : ''}`}
                aria-label={day.date}
                aria-current={index === currentIndex ? 'true' : undefined}
                title={getShortDate(day.date)}
              />
            ))}
          </div>

          {/* Screenings - list or calendar view */}
          {viewMode === 'list' ? (
            <div className="screenings-list">
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
            <p className="empty-message">Chargement...</p>
          ) : favoriteScreenings.length === 0 ? (
            <div className="screenings-list favorites-list">
              <div className="favorites-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p>Aucun favori</p>
                <p className="favorites-empty-hint">Ajoutez des films à votre programme en cliquant sur le coeur</p>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation header with view toggle for favorites */}
              <header className="nav-header-with-toggle">
                <button
                  onClick={() => setFavoriteDayIndex(Math.max(0, favoriteDayIndex - 1))}
                  disabled={favoriteDayIndex === 0}
                  className="nav-button"
                  aria-label="Jour précédent"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="nav-header-center">
                  <h2 className="current-date">
                    {currentFavoriteDate}
                  </h2>
                </div>

                <button
                  onClick={() => setFavoriteDayIndex(Math.min(favoriteDates.length - 1, favoriteDayIndex + 1))}
                  disabled={favoriteDayIndex === favoriteDates.length - 1}
                  className="nav-button"
                  aria-label="Jour suivant"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </header>

              {/* Day indicator dots for favorites */}
              <div className="day-indicators">
                {favoriteDates.map((date, index) => (
                  <button
                    key={date}
                    onClick={() => setFavoriteDayIndex(index)}
                    className={`day-dot ${index === favoriteDayIndex ? 'active' : ''}`}
                    aria-label={date}
                    aria-current={index === favoriteDayIndex ? 'true' : undefined}
                    title={getShortDate(date)}
                  />
                ))}
              </div>

              {/* Favorites - list or calendar view */}
              {viewMode === 'list' ? (
                <div className="screenings-list favorites-list">
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
