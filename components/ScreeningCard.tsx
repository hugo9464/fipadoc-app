'use client';

import { Seance, Film } from '@/lib/types';
import { getCategoryColorVar } from '@/lib/schedule-utils';
import FavoriteButton from './FavoriteButton';

interface OtherScreening {
  date: string;
  time: string;
  isFavorite: boolean;
}

interface ScreeningCardProps {
  seance: Seance;
  film?: Film;
  onSelect?: (seance: Seance, film?: Film) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  otherScreenings?: OtherScreening[];
}

function formatDuration(minutes: string | undefined): string | null {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return null;
  return `${mins} min`;
}

/**
 * Check if a seance is a short films session.
 * Short films sessions have multiple film IDs separated by commas in _id_film.
 */
function isShortFilmsSession(seance: Seance): boolean {
  // Short films sessions have multiple film IDs (comma-separated)
  if (seance._id_film && seance._id_film.includes(',')) {
    return true;
  }
  return false;
}

export default function ScreeningCard({ seance, film, onSelect, isFavorite, onToggleFavorite, otherScreenings }: ScreeningCardProps) {
  const isShortFilms = isShortFilmsSession(seance);
  const hasDetails = !!film?.synopsis || !!film?.bandesAnnonces?.length || !!seance._id_film || isShortFilms;
  const duration = formatDuration(seance._duration);

  const handleClick = () => {
    if (onSelect) {
      onSelect(seance, film);
    }
  };

  return (
    <article
      className={`relative flex gap-md p-md border-b border-border bg-background ${
        hasDetails ? 'cursor-pointer transition-all duration-150 hover:bg-surface hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme focus-visible:-outline-offset-2' : ''
      }`}
      onClick={hasDetails ? handleClick : undefined}
      role={hasDetails ? 'button' : undefined}
      tabIndex={hasDetails ? 0 : undefined}
      onKeyDown={hasDetails ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {seance.image && (
        <div className="flex-shrink-0 w-[100px] h-[75px] overflow-hidden rounded-lg bg-surface">
          <img src={seance.image} alt={seance.titre || ''} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[0.8rem] font-semibold text-text-secondary mb-1 tabular-nums">
          {seance.heureDebut} - {seance.heureFin}
          {duration && <span className="text-text-muted font-normal ml-1.5">({duration})</span>}
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-1.5 line-clamp-2 uppercase tracking-wide leading-tight">
          {seance.titre || (isShortFilms ? 'Courts Metrages' : 'Programme')}
        </h3>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[0.8rem] text-text-secondary mb-1.5">
          <span className="font-medium">{seance.lieu}</span>
          {seance.realisateur && (
            <span className="before:content-['·_'] text-text-muted">{seance.realisateur}</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-text-muted px-2 py-0.5 bg-surface rounded-full font-medium">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColorVar(seance.categorie) }}
            aria-hidden="true"
          />
          {seance.categorie}
        </span>
        {otherScreenings && otherScreenings.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-2 text-[0.7rem] text-text-muted">
            <span className="font-medium text-text-secondary">Autres seances :</span>
            {otherScreenings.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface rounded-full whitespace-nowrap">
                <span className="font-medium">{s.date}</span>
                <span className="tabular-nums">{s.time}</span>
                {s.isFavorite && (
                  <span className="text-favorite text-[0.65rem] ml-0.5" title="Dans vos favoris">♥</span>
                )}
              </span>
            ))}
          </div>
        )}
        {seance.presence && (
          <div className="flex items-center gap-1 text-[0.75rem] text-theme mt-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="italic">{seance.presence}</span>
          </div>
        )}
      </div>
      {film && onToggleFavorite && (
        <div className="absolute top-sm right-sm z-[5]">
          <FavoriteButton
            isFavorite={isFavorite || false}
            onToggle={onToggleFavorite}
            size="small"
          />
        </div>
      )}
      {hasDetails && (
        <div className="flex items-center text-text-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </article>
  );
}
