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
      className={`screening-card ${hasDetails ? 'clickable' : ''}`}
      onClick={hasDetails ? handleClick : undefined}
      role={hasDetails ? 'button' : undefined}
      tabIndex={hasDetails ? 0 : undefined}
      onKeyDown={hasDetails ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {seance.image && (
        <div className="screening-image">
          <img src={seance.image} alt={seance.titre || ''} loading="lazy" />
        </div>
      )}
      <div className="screening-content">
        <div className="screening-time">
          {seance.heureDebut} - {seance.heureFin}
        </div>
        <h3 className="screening-title">
          {seance.titre || 'Programme'}
        </h3>
        <div className="screening-meta">
          <span className="screening-venue">{seance.lieu}</span>
          {seance.realisateur && (
            <span className="screening-director">{seance.realisateur}</span>
          )}
        </div>
        <div className="screening-category">{seance.categorie}</div>
        {otherScreenings && otherScreenings.length > 0 && (
          <div className="other-screenings">
            <span className="other-screenings-label">Autres séances :</span>
            {otherScreenings.map((s, idx) => (
              <span key={idx} className="other-screening-item">
                <span className="other-screening-date">{s.date}</span>
                <span className="other-screening-time">{s.time}</span>
                {s.isFavorite && (
                  <span className="other-screening-fav" title="Dans vos favoris">♥</span>
                )}
              </span>
            ))}
          </div>
        )}
        {seance.presence && (
          <div className="screening-presence">{seance.presence}</div>
        )}
      </div>
      {film && onToggleFavorite && (
        <div className="screening-card-favorite">
          <FavoriteButton
            isFavorite={isFavorite || false}
            onToggle={onToggleFavorite}
            size="small"
          />
        </div>
      )}
      {hasDetails && (
        <div className="screening-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </article>
  );
}
