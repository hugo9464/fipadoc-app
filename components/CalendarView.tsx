'use client';

import { useRef, useEffect, useState } from 'react';
import { Seance, Film } from '@/lib/types';
import {
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  HOUR_HEIGHT_PX,
  getActiveVenues,
  groupSeancesByVenue,
  getCurrentTimePosition,
  getTimelineLabels,
  isToday,
  calculateOverlapLayout,
} from '@/lib/schedule-utils';
import CalendarBlock from './CalendarBlock';

interface CalendarViewProps {
  seances: Seance[];
  date: string;
  filmsIndex: Map<string, Film>;
  favorites: Set<string>;
  getScreeningId: (date: string, seance: Seance) => string;
  onSelectSeance: (seance: Seance, film?: Film) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function CalendarView({
  seances,
  date,
  filmsIndex,
  favorites,
  getScreeningId,
  onSelectSeance,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}: CalendarViewProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nowPosition, setNowPosition] = useState<number | null>(null);

  // Get active venues for this day
  const activeVenues = getActiveVenues(seances);
  const seancesByVenue = groupSeancesByVenue(seances);

  // Calculate total height
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
  const totalHeight = totalHours * HOUR_HEIGHT_PX;

  // Generate time labels
  const timeLabels = getTimelineLabels();

  // Improved sync horizontal scroll between header and grid
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const headerScroll = headerScrollRef.current;
    if (!wrapper || !headerScroll) return;

    let isScrolling = false;

    const handleWrapperScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      headerScroll.scrollLeft = wrapper.scrollLeft;
      requestAnimationFrame(() => { isScrolling = false; });
    };

    const handleHeaderScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      wrapper.scrollLeft = headerScroll.scrollLeft;
      requestAnimationFrame(() => { isScrolling = false; });
    };

    wrapper.addEventListener('scroll', handleWrapperScroll, { passive: true });
    headerScroll.addEventListener('scroll', handleHeaderScroll, { passive: true });

    return () => {
      wrapper.removeEventListener('scroll', handleWrapperScroll);
      headerScroll.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  // Update now indicator
  useEffect(() => {
    const updateNowPosition = () => {
      if (isToday(date)) {
        setNowPosition(getCurrentTimePosition());
      } else {
        setNowPosition(null);
      }
    };

    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  // Find film for a seance
  const findFilm = (titre?: string): Film | undefined => {
    if (!titre) return undefined;
    return filmsIndex.get(titre.toLowerCase());
  };

  if (activeVenues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-xl text-center text-text-secondary min-h-[200px]">
        <p className="font-heading uppercase tracking-wide">Aucune projection programmee</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Date header with navigation arrows */}
      <div className="bg-surface border-b border-border py-sm px-md flex items-center justify-center">
        {onPrevious && (
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Jour precedent"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h3 className="font-heading font-semibold text-foreground uppercase tracking-wide m-0 text-center flex-1">
          {date}
        </h3>
        {onNext && (
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:enabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Jour suivant"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
      {/* Fixed header with venue names */}
      <div className="flex bg-surface border-b border-border sticky top-0 z-[5]">
        <div className="flex-shrink-0 w-[50px] border-r border-border" />
        <div className="flex overflow-x-auto scrollbar-hide" ref={headerScrollRef}>
          {activeVenues.map((venue) => (
            <div
              key={venue}
              className="flex-shrink-0 w-[120px] md:w-[160px] p-sm px-xs font-heading text-[0.7rem] md:text-[0.75rem] font-semibold text-center text-text-secondary border-r border-border last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-wide"
              title={venue}
            >
              {venue}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable area - using min-h-0 instead of overflow-hidden */}
      <div className="flex-1 flex overflow-auto relative bg-background" ref={wrapperRef}>
        {/* Time axis */}
        <div
          className="flex-shrink-0 w-[50px] bg-surface border-r border-border sticky left-0 z-[3]"
          style={{ height: totalHeight }}
        >
          {timeLabels.map((label) => (
            <div
              key={label}
              className="calendar-time-label h-[60px] flex items-start justify-center pt-0 text-[0.7rem] font-medium text-text-muted tabular-nums relative"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid with columns */}
        <div className="flex flex-1 relative" style={{ height: totalHeight }}>
          {/* Hour grid lines */}
          {timeLabels.map((_, index) => (
            <div
              key={index}
              className="absolute left-0 right-0 h-px bg-border pointer-events-none"
              style={{ top: index * HOUR_HEIGHT_PX }}
            />
          ))}

          {/* Now indicator */}
          {nowPosition !== null && (
            <div
              className="calendar-now-line absolute left-0 right-0 h-0.5 bg-favorite z-[4] pointer-events-none"
              style={{ top: nowPosition }}
            />
          )}

          {/* Venue columns */}
          {activeVenues.map((venue) => {
            const venueSeances = seancesByVenue.get(venue) || [];
            const layouts = calculateOverlapLayout(venueSeances);
            return (
              <div
                key={venue}
                className="flex-shrink-0 w-[120px] md:w-[160px] relative border-r border-border last:border-r-0"
              >
                {venueSeances.map((seance, idx) => {
                  const film = findFilm(seance.titre);
                  const screeningId = getScreeningId(date, seance);
                  const isFavorite = favorites.has(screeningId);
                  const layout = layouts.get(idx);

                  return (
                    <CalendarBlock
                      key={`${seance.heureDebut}-${idx}`}
                      seance={seance}
                      film={film}
                      isFavorite={isFavorite}
                      layout={layout}
                      onClick={() => onSelectSeance(seance, film)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
