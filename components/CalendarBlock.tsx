'use client';

import { Seance, Film } from '@/lib/types';
import {
  timeToPixelPosition,
  durationToPixelHeight,
  SeanceLayout,
  getCategoryColorVar,
  getCategoryShortLabel,
  formatDurationFrench,
  calculateFilmDuration,
} from '@/lib/schedule-utils';

interface CalendarBlockProps {
  seance: Seance;
  film?: Film;
  isFavorite: boolean;
  layout?: SeanceLayout;
  onClick: () => void;
}

export default function CalendarBlock({ seance, film, isFavorite, layout, onClick }: CalendarBlockProps) {
  const top = timeToPixelPosition(seance.heureDebut);
  const height = durationToPixelHeight(seance.heureDebut, seance.heureFin);

  // Minimum height for touch targets
  const minHeight = 44;
  const displayHeight = Math.max(height, minHeight);

  // Determine what to display based on available height
  const showDuration = displayHeight > 50;
  const showPresence = displayHeight > 70;

  const title = seance.titre || seance.categorie;
  const categoryColor = getCategoryColorVar(seance.categorie);
  const categoryLabel = getCategoryShortLabel(seance.categorie);
  const duration = formatDurationFrench(seance._duration);
  const presence = seance.presence;

  // Calculate film vs session duration for visual representation
  const filmDurationInfo = calculateFilmDuration(
    seance.heureDebut,
    seance.heureFin,
    seance._duration
  );
  const showExtraTime = filmDurationInfo.hasExtraTime && displayHeight > 50;

  // Calculate horizontal position for overlapping screenings
  const column = layout?.column ?? 0;
  const totalColumns = layout?.totalColumns ?? 1;
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;

  return (
    <div
      className={`absolute bg-background overflow-hidden cursor-pointer transition-all duration-150 z-[1] min-h-[44px] hover:shadow-lg hover:z-[2] active:scale-[0.98] ${
        isFavorite ? 'ring-2 ring-favorite' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${displayHeight}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
        borderRadius: '2px',
        borderLeft: `4px solid ${categoryColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
      aria-label={`${seance.heureDebut} - ${title}`}
    >
      {/* Extra time indicator - diagonal stripes at the bottom of the block */}
      {showExtraTime && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: `${100 - filmDurationInfo.filmPercent}%`,
            background: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.06) 3px,
              rgba(0,0,0,0.06) 6px
            )`,
            borderTop: '1px dashed rgba(0,0,0,0.15)',
          }}
          title={`Fin du film + ${filmDurationInfo.extraMinutes} min (débat/échange)`}
        />
      )}

      {/* Top-right indicators */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5">
        {presence && (
          <span className="text-theme text-[0.6rem]" aria-label="Équipe présente" title="Équipe présente">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </span>
        )}
        {isFavorite && (
          <span className="text-favorite text-[0.65rem]" aria-hidden="true">
            ♥
          </span>
        )}
      </div>

      <div className="p-1.5 pr-4">
        {/* Time + Category line */}
        <div className="text-[0.6rem] mb-0.5 flex items-baseline gap-1">
          <span className="font-semibold text-foreground tabular-nums">{seance.heureDebut}</span>
          <span className="font-bold" style={{ color: categoryColor }}>
            {categoryLabel}
          </span>
        </div>

        {/* Title */}
        <div className="font-heading text-[0.7rem] font-bold text-foreground line-clamp-2 leading-tight uppercase tracking-wide">
          {title}
        </div>

        {/* Duration */}
        {showDuration && duration && (
          <div className="text-[0.55rem] text-text-muted mt-0.5">
            {duration}
          </div>
        )}

        {/* Presence info */}
        {showPresence && presence && (
          <div className="text-[0.55rem] text-theme italic mt-0.5 line-clamp-1">
            {presence}
          </div>
        )}
      </div>
    </div>
  );
}
