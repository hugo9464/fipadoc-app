'use client';

import { Seance, Film } from '@/lib/types';
import { timeToPixelPosition, durationToPixelHeight } from '@/lib/schedule-utils';

interface CalendarBlockProps {
  seance: Seance;
  film?: Film;
  isFavorite: boolean;
  onClick: () => void;
}

export default function CalendarBlock({ seance, film, isFavorite, onClick }: CalendarBlockProps) {
  const top = timeToPixelPosition(seance.heureDebut);
  const height = durationToPixelHeight(seance.heureDebut, seance.heureFin);

  // Minimum height for touch targets
  const minHeight = 44;
  const displayHeight = Math.max(height, minHeight);

  // Determine what to display based on available height
  const showDirector = displayHeight > 60;

  const title = seance.titre || seance.categorie;
  const director = film?.realisateurs || seance.realisateur;

  return (
    <div
      className={`calendar-block ${isFavorite ? 'favorited' : ''}`}
      style={{
        top: `${top}px`,
        height: `${displayHeight}px`,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${seance.heureDebut} - ${seance.heureFin}: ${title}`}
    >
      {isFavorite && (
        <span className="calendar-block-favorite" aria-hidden="true">
          ♥
        </span>
      )}
      <div className="calendar-block-time">
        {seance.heureDebut} - {seance.heureFin}
      </div>
      <div className="calendar-block-title">
        {title}
      </div>
      {showDirector && director && (
        <div className="calendar-block-director">
          {director}
        </div>
      )}
    </div>
  );
}
