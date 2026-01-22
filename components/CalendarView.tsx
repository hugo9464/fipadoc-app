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
} from '@/lib/schedule-utils';
import CalendarBlock from './CalendarBlock';

interface CalendarViewProps {
  seances: Seance[];
  date: string;
  filmsIndex: Map<string, Film>;
  favorites: Set<string>;
  getScreeningId: (date: string, seance: Seance) => string;
  onSelectSeance: (seance: Seance, film?: Film) => void;
}

export default function CalendarView({
  seances,
  date,
  filmsIndex,
  favorites,
  getScreeningId,
  onSelectSeance,
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

  // Sync horizontal scroll between header and grid
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const headerScroll = headerScrollRef.current;

    if (!wrapper || !headerScroll) return;

    const handleScroll = () => {
      headerScroll.scrollLeft = wrapper.scrollLeft;
    };

    wrapper.addEventListener('scroll', handleScroll);
    return () => wrapper.removeEventListener('scroll', handleScroll);
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
      <div className="calendar-empty">
        <p>Aucune projection programmée</p>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Fixed header with venue names */}
      <div className="calendar-header">
        <div className="calendar-header-spacer" />
        <div className="calendar-header-scroll" ref={headerScrollRef}>
          {activeVenues.map((venue) => (
            <div key={venue} className="calendar-venue-name" title={venue}>
              {venue}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable area */}
      <div className="calendar-wrapper" ref={wrapperRef}>
        {/* Time axis */}
        <div className="calendar-time-axis" style={{ height: totalHeight }}>
          {timeLabels.map((label) => (
            <div
              key={label}
              className="calendar-time-label"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid with columns */}
        <div className="calendar-grid" style={{ height: totalHeight }}>
          {/* Hour grid lines */}
          {timeLabels.map((_, index) => (
            <div
              key={index}
              className="calendar-hour-line"
              style={{ top: index * HOUR_HEIGHT_PX }}
            />
          ))}

          {/* Now indicator */}
          {nowPosition !== null && (
            <div className="calendar-now-line" style={{ top: nowPosition }} />
          )}

          {/* Venue columns */}
          {activeVenues.map((venue) => {
            const venueSeances = seancesByVenue.get(venue) || [];
            return (
              <div key={venue} className="calendar-column">
                {venueSeances.map((seance, idx) => {
                  const film = findFilm(seance.titre);
                  const screeningId = getScreeningId(date, seance);
                  const isFavorite = favorites.has(screeningId);

                  return (
                    <CalendarBlock
                      key={`${seance.heureDebut}-${idx}`}
                      seance={seance}
                      film={film}
                      isFavorite={isFavorite}
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
