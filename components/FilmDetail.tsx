'use client';

import { useEffect, useCallback } from 'react';
import { Film, Seance } from '@/lib/types';
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

export default function FilmDetail({
  film,
  seance,
  onClose,
  isFavorite,
  onToggleFavorite,
  allScreenings,
  onToggleScreeningFavorite
}: FilmDetailProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

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

  const mainImage = film.imagePoster || film.imageFilm || film.imageUrl;
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
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="film-title">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="film-detail-scroll">
          {mainImage && (
            <div className="film-poster">
              <img src={mainImage} alt={film.titre} />
            </div>
          )}

          <div className="film-info">
            <div className="film-title-row">
              <h2 id="film-title" className="film-title">{film.titre}</h2>
              {onToggleFavorite && (
                <FavoriteButton
                  isFavorite={isFavorite || false}
                  onToggle={onToggleFavorite}
                  size="large"
                />
              )}
            </div>

            <div className="film-meta">
              {film.realisateurs && (
                <p className="film-director">Réalisé par {film.realisateurs}</p>
              )}
              {film.selection && (
                <span className="film-selection">{film.selection}</span>
              )}
            </div>

            {allScreenings && allScreenings.length > 0 && (
              <div className="film-all-screenings">
                <h3>Séances</h3>
                <div className="screenings-list-detail">
                  {allScreenings.map(({ date, seance: s, screeningId, isFavorite: isFav }) => (
                    <div
                      key={screeningId}
                      className={`screening-item ${seance && s.heureDebut === seance.heureDebut && s.lieu === seance.lieu ? 'current' : ''}`}
                    >
                      <div className="screening-item-info">
                        <div className="screening-item-date">{date}</div>
                        <div className="screening-item-time">
                          <strong>{s.heureDebut} - {s.heureFin}</strong>
                        </div>
                        <div className="screening-item-venue">{s.lieu}</div>
                        {s.presence && (
                          <div className="screening-item-presence">{s.presence}</div>
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

            {film.synopsis && (
              <div className="film-synopsis">
                <h3>Synopsis</h3>
                <p>{film.synopsis}</p>
              </div>
            )}

            {embedUrl && (
              <div className="film-trailer">
                <h3>Bande-annonce</h3>
                <div className="video-container">
                  <iframe
                    src={embedUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Bande-annonce"
                  />
                </div>
              </div>
            )}

            {film.images && film.images.length > 1 && (
              <div className="film-gallery">
                <h3>Images</h3>
                <div className="gallery-grid">
                  {film.images.slice(0, 4).map((img, idx) => (
                    <img key={idx} src={img} alt={`${film.titre} - Image ${idx + 1}`} loading="lazy" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
