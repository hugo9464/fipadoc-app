'use client';

import { useEffect, useCallback, useState } from 'react';
import { Film, Seance } from '@/lib/types';
import { buildBookingUrl } from '@/lib/schedule-utils';
import FilmDetail from './FilmDetail';

interface ShortFilmsDetailProps {
  films: Film[];
  seance: Seance;
  date: string;
  onClose: () => void;
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

export default function ShortFilmsDetail({
  films,
  seance,
  date,
  onClose,
}: ShortFilmsDetailProps) {
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [expandedFilm, setExpandedFilm] = useState<string | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedFilm) {
        setSelectedFilm(null);
      } else {
        onClose();
      }
    }
  }, [onClose, selectedFilm]);

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

  const toggleExpanded = (filmTitre: string) => {
    setExpandedFilm(prev => prev === filmTitre ? null : filmTitre);
  };

  const bookingUrl = buildBookingUrl('Courts métrages', date);

  // If a film is selected, show its detail
  if (selectedFilm) {
    return (
      <FilmDetail
        film={selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-[var(--safe-area-inset-top)_var(--safe-area-inset-right)_var(--safe-area-inset-bottom)_var(--safe-area-inset-left)] sm:p-xl"
      onClick={handleBackdropClick}
    >
      <div
        data-theme="dark"
        className="bg-background w-full max-h-[95vh] max-h-[95dvh] rounded-t-2xl sm:rounded-2xl overflow-hidden relative flex flex-col sm:max-w-[700px] sm:max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="short-films-title"
      >
        {/* Close button */}
        <button
          className="absolute top-sm right-sm w-10 h-10 border-none bg-white/10 text-white rounded-full cursor-pointer flex items-center justify-center z-10 transition-colors duration-150 hover:bg-white/20"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="p-lg pb-md">
            <h2
              id="short-films-title"
              className="font-heading text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide leading-tight"
            >
              Courts Metrages
            </h2>
            <p className="text-[0.85rem] text-text-muted mt-1">
              Selection competitive internationale
            </p>

            {/* Session info */}
            <div className="flex flex-wrap items-center gap-2 mt-md">
              <span className="inline-block text-[0.75rem] text-text-secondary py-1 px-2.5 bg-surface rounded-full">
                {date}
              </span>
              <span className="inline-block text-[0.75rem] text-text-secondary py-1 px-2.5 bg-surface rounded-full">
                {seance.heureDebut} - {seance.heureFin}
              </span>
              <span className="inline-block text-[0.75rem] text-text-secondary py-1 px-2.5 bg-surface rounded-full">
                {seance.lieu}
              </span>
            </div>

            {seance.presence && (
              <div className="flex items-center gap-1 text-[0.8rem] text-accent mt-md">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="italic">{seance.presence}</span>
              </div>
            )}

            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mt-md px-4 py-2 text-[0.8rem] font-semibold uppercase tracking-wide bg-accent text-background rounded-md hover:bg-accent/80 transition-colors"
              >
                Reserver cette seance
              </a>
            )}
          </div>

          {/* Films list */}
          <div className="px-lg pb-lg">
            <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wide mb-sm">
              Films de cette selection ({films.length})
            </h3>
            <div className="flex flex-col gap-xs">
              {films.map((film) => {
                const isExpanded = expandedFilm === film.titre;
                const trailer = film.bandesAnnonces?.[0];
                let embedUrl: string | null = null;
                if (trailer) {
                  if (trailer.platform === 'vimeo') {
                    embedUrl = getVimeoEmbedUrl(trailer.url);
                  } else if (trailer.platform === 'youtube') {
                    embedUrl = getYouTubeEmbedUrl(trailer.url);
                  }
                }

                return (
                  <div
                    key={film.titre}
                    className="bg-surface rounded-lg overflow-hidden border border-border"
                  >
                    {/* Film header - always visible */}
                    <button
                      onClick={() => toggleExpanded(film.titre)}
                      className="w-full flex items-center gap-sm p-sm text-left bg-transparent border-none cursor-pointer hover:bg-surface/80 transition-colors"
                    >
                      {film.imageFilm && (
                        <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-border">
                          <img
                            src={film.imageFilm}
                            alt={film.titre}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading text-[0.9rem] font-semibold text-foreground uppercase tracking-wide leading-tight line-clamp-1">
                          {film.titre}
                        </h4>
                        <p className="text-[0.75rem] text-text-muted mt-0.5 line-clamp-1">
                          {film.realisateurs}
                        </p>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-sm pb-sm border-t border-border">
                        {film.synopsis && (
                          <p className="text-[0.8rem] text-text-secondary mt-sm leading-relaxed">
                            {film.synopsis}
                          </p>
                        )}

                        {embedUrl && (
                          <div className="mt-sm">
                            <div className="video-container rounded-lg bg-border overflow-hidden">
                              <iframe
                                src={embedUrl}
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={`Bande-annonce de ${film.titre}`}
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedFilm(film)}
                          className="mt-sm flex items-center gap-1 text-[0.75rem] text-accent font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                          Voir plus de details
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
