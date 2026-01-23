'use client';

import { useEffect, useCallback, useState } from 'react';
import { Film, Seance } from '@/lib/types';
import { fetchFilmDetailsClient } from '@/lib/api';
import { APIFilm, APIDirectorDetail } from '@/lib/api-types';
import FavoriteButton from './FavoriteButton';

interface ScreeningWithDate {
  date: string;
  seance: Seance;
  screeningId: string;
  isFavorite: boolean;
}

interface FilmDetailProps {
  film: Film;
  seance?: Seance;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  allScreenings?: ScreeningWithDate[];
  onToggleScreeningFavorite?: (screeningId: string) => void;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

function formatDuration(minutes: string | undefined): string | null {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return null;
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h${remainingMins.toString().padStart(2, '0')}`;
}

export default function FilmDetail({
  film,
  seance,
  onClose,
  isFavorite,
  onToggleFavorite,
  allScreenings,
  onToggleScreeningFavorite
}: FilmDetailProps) {
  const [apiFilm, setApiFilm] = useState<APIFilm | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const copyPassword = useCallback(async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Fetch film details from API
  useEffect(() => {
    const filmId = seance?._id_film || film.slug;

    if (filmId && !filmId.includes('/')) {
      setLoading(true);
      fetchFilmDetailsClient(filmId)
        .then(data => {
          setApiFilm(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [seance?._id_film, film.slug]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use API data if available, fall back to passed props
  const mainImage = apiFilm?.image_large || apiFilm?.image_mini || film.imageFilm || film.imageUrl;
  const synopsis = apiFilm?.synopsis_long_l1 || apiFilm?.synopsis_short_l1 || film.synopsis;
  const duration = formatDuration(apiFilm?.film_length || seance?._duration);

  // Get directors - from API or fall back to film prop
  const directors = apiFilm?.directors;
  const directorDisplay = (Array.isArray(directors) ? directors.map(d => d.name).join(', ') : null) || film.realisateurs;

  // Get directors details for the expanded section
  const directorsDetail: APIDirectorDetail[] = apiFilm?.directors_detail
    ? Object.values(apiFilm.directors_detail)
    : [];

  // Get original title (if different from main title)
  const originalTitle = apiFilm?.original_title && apiFilm.original_title !== film.titre
    ? apiFilm.original_title
    : null;

  // Get countries display
  const primaryCountry = apiFilm?.country_name_l1;
  const secondaryCountries = apiFilm?.secondary_countries_name_l1;
  const countriesDisplay = [primaryCountry, secondaryCountries].filter(Boolean).join(', ');

  // Get premiere type
  const premiere = apiFilm?.premiere;

  // Get video film (full film link)
  const videoFilm = apiFilm?.video_film;
  const videoFilmPass = apiFilm?.video_film_pass;

  // Get trailer embed URL
  let embedUrl: string | null = null;
  const trailer = film.bandesAnnonces?.[0];
  const apiTrailer = apiFilm?.trailer;

  if (apiTrailer) {
    embedUrl = getVimeoEmbedUrl(apiTrailer) || getYouTubeEmbedUrl(apiTrailer);
  } else if (trailer) {
    if (trailer.platform === 'vimeo') {
      embedUrl = getVimeoEmbedUrl(trailer.url);
    } else if (trailer.platform === 'youtube') {
      embedUrl = getYouTubeEmbedUrl(trailer.url);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center p-[var(--safe-area-inset-top)_var(--safe-area-inset-right)_var(--safe-area-inset-bottom)_var(--safe-area-inset-left)] sm:p-xl"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-background w-full max-h-[90vh] max-h-[90dvh] rounded-t-2xl sm:rounded-2xl overflow-hidden relative flex flex-col sm:max-w-[600px] sm:max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-title"
      >
        <button
          className="absolute top-sm right-sm w-10 h-10 border-none bg-black/50 text-white rounded-full cursor-pointer flex items-center justify-center z-10 transition-colors duration-150 hover:bg-black/70"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1">
          {mainImage && (
            <div className="w-full aspect-video bg-surface overflow-hidden">
              <img src={mainImage} alt={film.titre} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-lg">
            <div className="flex items-start justify-between gap-sm">
              <h2 id="film-title" className="flex-1 text-xl font-bold text-foreground mb-sm">{film.titre}</h2>
              {onToggleFavorite && (
                <FavoriteButton
                  isFavorite={isFavorite || false}
                  onToggle={onToggleFavorite}
                  size="large"
                />
              )}
            </div>

            <div className="mb-md">
              {originalTitle && (
                <p className="text-[0.85rem] text-text-muted italic mb-1">Titre original : {originalTitle}</p>
              )}
              {directorDisplay && (
                <p className="text-[0.9rem] text-text-secondary mb-1">Réalisé par {directorDisplay}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {duration && (
                  <span className="inline-block text-[0.75rem] text-text-muted py-[3px] px-2 bg-surface rounded">
                    {duration}
                  </span>
                )}
                {film.selection && (
                  <span className="inline-block text-[0.75rem] text-text-muted py-[3px] px-2 bg-surface rounded">
                    {film.selection}
                  </span>
                )}
              </div>
              {countriesDisplay && (
                <p className="text-[0.85rem] text-text-secondary mt-2">{countriesDisplay}</p>
              )}
              {premiere && (
                <p className="text-[0.8rem] text-theme mt-1">{premiere}</p>
              )}
            </div>

            {allScreenings && allScreenings.length > 0 && (
              <div className="mb-lg">
                <h3 className="text-[0.9rem] font-semibold text-foreground mb-sm">Séances</h3>
                <div className="flex flex-col gap-xs">
                  {allScreenings.map(({ date, seance: s, screeningId, isFavorite: isFav }) => (
                    <div
                      key={screeningId}
                      className={`flex items-center justify-between gap-sm p-sm px-md bg-surface rounded-lg transition-colors duration-150 ${
                        seance && s.heureDebut === seance.heureDebut && s.lieu === seance.lieu
                          ? 'border-2 border-foreground bg-background'
                          : 'border-2 border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8rem] font-semibold text-foreground mb-0.5">{date}</div>
                        <div className="text-[0.85rem] text-text-secondary tabular-nums">
                          <strong>{s.heureDebut} - {s.heureFin}</strong>
                        </div>
                        <div className="text-[0.8rem] text-text-muted">{s.lieu}</div>
                        {s.presence && (
                          <div className="text-[0.75rem] text-theme italic mt-0.5">{s.presence}</div>
                        )}
                      </div>
                      {onToggleScreeningFavorite && (
                        <FavoriteButton
                          isFavorite={isFav}
                          onToggle={() => onToggleScreeningFavorite(screeningId)}
                          size="small"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="mb-lg">
                <div className="h-4 bg-surface rounded w-3/4 animate-pulse mb-2" />
                <div className="h-4 bg-surface rounded w-full animate-pulse mb-2" />
                <div className="h-4 bg-surface rounded w-5/6 animate-pulse" />
              </div>
            ) : synopsis ? (
              <div className="mb-lg">
                <h3 className="text-[0.9rem] font-semibold text-foreground mb-sm">Synopsis</h3>
                <div
                  className="text-[0.9rem] leading-relaxed text-text-secondary [&>p]:mb-3 [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: synopsis }}
                />
              </div>
            ) : null}

            {directorsDetail.length > 0 && (
              <div className="mb-lg">
                <h3 className="text-[0.9rem] font-semibold text-foreground mb-sm">
                  {directorsDetail.length > 1 ? 'Réalisateurs' : 'Réalisateur'}
                </h3>
                <div className="flex flex-col gap-md">
                  {directorsDetail.map((director, index) => (
                    <div key={index} className="flex gap-sm">
                      {director.directors_photo && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                          <img
                            src={director.directors_photo}
                            alt={director.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.9rem] font-semibold text-foreground">{director.name}</p>
                        {director.directors_biography_l1 && (
                          <p className="text-[0.8rem] text-text-secondary mt-1 line-clamp-4">
                            {director.directors_biography_l1}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoFilm && (
              <div className="mb-lg">
                <h3 className="text-[0.9rem] font-semibold text-foreground mb-sm">Voir le film</h3>
                <a
                  href={videoFilm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-md bg-surface rounded-lg text-foreground hover:bg-surface/80 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-[0.9rem] font-medium">Accéder au film sur Vimeo</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                {videoFilmPass && (
                  <div className="flex items-center gap-2 mt-sm p-sm px-md bg-surface/50 rounded-lg">
                    <span className="text-[0.8rem] text-text-muted">Mot de passe :</span>
                    <code className="text-[0.85rem] text-foreground font-mono bg-surface px-2 py-0.5 rounded">
                      {videoFilmPass}
                    </code>
                    <button
                      onClick={() => copyPassword(videoFilmPass)}
                      className="ml-auto p-1.5 text-text-muted hover:text-foreground transition-colors"
                      aria-label="Copier le mot de passe"
                    >
                      {passwordCopied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {embedUrl && (
              <div className="mb-lg">
                <h3 className="text-[0.9rem] font-semibold text-foreground mb-sm">Bande-annonce</h3>
                <div className="video-container rounded-lg bg-surface">
                  <iframe
                    src={embedUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Bande-annonce"
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
