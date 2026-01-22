'use client';

import { Seance, Film } from '@/lib/types';
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

export default function ScreeningCard({ seance, film, onSelect, isFavorite, onToggleFavorite, otherScreenings }: ScreeningCardProps) {
  const hasDetails = !!film?.synopsis || !!film?.bandesAnnonces?.length;

  const handleClick = () => {
    if (onSelect) {
      onSelect(seance, film);
    }
  };

  return (
    <article
      className={`relative flex gap-md p-md border-b border-border bg-background ${
        hasDetails ? 'cursor-pointer transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme focus-visible:-outline-offset-2' : ''
      }`}
      onClick={hasDetails ? handleClick : undefined}
      role={hasDetails ? 'button' : undefined}
      tabIndex={hasDetails ? 0 : undefined}
      onKeyDown={hasDetails ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {seance.image && (
        <div className="flex-shrink-0 w-20 h-[60px] overflow-hidden rounded bg-surface">
          <img src={seance.image} alt={seance.titre || ''} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[0.8rem] font-semibold text-text-secondary mb-0.5 tabular-nums">
          {seance.heureDebut} - {seance.heureFin}
        </div>
        <h3 className="text-[0.95rem] font-semibold text-foreground mb-1 line-clamp-2">
          {seance.titre || 'Programme'}
        </h3>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[0.8rem] text-text-secondary mb-1">
          <span className="font-medium">{seance.lieu}</span>
          {seance.realisateur && (
            <span className="before:content-['·_']">{seance.realisateur}</span>
          )}
        </div>
        <span className="inline-block text-[0.75rem] text-text-muted px-1.5 py-0.5 bg-surface rounded">
          {seance.categorie}
        </span>
        {otherScreenings && otherScreenings.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1.5 text-[0.7rem] text-text-muted">
            <span className="font-medium text-text-secondary">Autres séances :</span>
            {otherScreenings.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface rounded whitespace-nowrap">
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
          <div className="text-[0.75rem] text-theme italic mt-1">{seance.presence}</div>
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
