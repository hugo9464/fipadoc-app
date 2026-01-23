'use client';

import { Seance, Film } from '@/lib/types';
import { timeToPixelPosition, durationToPixelHeight } from '@/lib/schedule-utils';

interface CalendarBlockProps {
  seance: Seance;
  film?: Film;
  isFavorite: boolean;
  onClick: () => void;
}

function formatDurationShort(minutes: string | undefined): string | null {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return null;
  return `${mins}'`;
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
  const duration = formatDurationShort(seance._duration);

  return (
    <div
      className={`absolute left-1 right-1 bg-background rounded p-1 px-1.5 overflow-hidden cursor-pointer transition-shadow duration-150 z-[1] min-h-[44px] hover:shadow-lg hover:z-[2] active:scale-[0.98] ${
        isFavorite ? 'border-2 border-favorite' : 'border border-border'
      }`}
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
        <span className="absolute top-0.5 right-0.5 text-favorite text-[0.65rem]" aria-hidden="true">
          ♥
        </span>
      )}
      <div className="text-[0.65rem] font-semibold text-text-secondary tabular-nums mb-0.5">
        {seance.heureDebut} - {seance.heureFin}
        {duration && <span className="text-text-muted font-normal ml-1">({duration})</span>}
      </div>
      <div className="text-[0.7rem] font-semibold text-foreground line-clamp-2 leading-tight">
        {title}
      </div>
      {showDirector && director && (
        <div className="text-[0.6rem] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
          {director}
        </div>
      )}
    </div>
  );
}
