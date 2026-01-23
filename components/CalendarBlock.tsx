'use client';

import { Seance, Film } from '@/lib/types';
import { timeToPixelPosition, durationToPixelHeight, SeanceLayout } from '@/lib/schedule-utils';

interface CalendarBlockProps {
  seance: Seance;
  film?: Film;
  isFavorite: boolean;
  layout?: SeanceLayout;
  onClick: () => void;
}

function formatDurationShort(minutes: string | undefined): string | null {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return null;
  return `${mins}'`;
}

export default function CalendarBlock({ seance, film, isFavorite, layout, onClick }: CalendarBlockProps) {
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

  // Calculate horizontal position for overlapping screenings
  const column = layout?.column ?? 0;
  const totalColumns = layout?.totalColumns ?? 1;
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;

  return (
    <div
      className={`absolute bg-background rounded-lg p-1.5 px-2 overflow-hidden cursor-pointer transition-all duration-150 z-[1] min-h-[44px] hover:shadow-lg hover:z-[2] active:scale-[0.98] ${
        isFavorite ? 'border-2 border-favorite' : 'border border-border'
      }`}
      style={{
        top: `${top}px`,
        height: `${displayHeight}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
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
        <span className="absolute top-1 right-1 text-favorite text-[0.65rem]" aria-hidden="true">
          ♥
        </span>
      )}
      <div className="text-[0.65rem] font-semibold text-text-secondary tabular-nums mb-0.5">
        {seance.heureDebut} - {seance.heureFin}
        {duration && <span className="text-text-muted font-normal ml-1">({duration})</span>}
      </div>
      <div className="font-heading text-[0.7rem] font-semibold text-foreground line-clamp-2 leading-tight uppercase tracking-wide">
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
