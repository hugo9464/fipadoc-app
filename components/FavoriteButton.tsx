'use client';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'small' | 'large';
}

export default function FavoriteButton({ isFavorite, onToggle, size = 'small' }: FavoriteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const iconSize = size === 'large' ? 24 : 20;
  const buttonSize = size === 'large' ? 'w-11 h-11' : 'w-9 h-9';

  return (
    <button
      className={`flex items-center justify-center border-none bg-transparent cursor-pointer p-xs rounded-full transition-all duration-150 ${buttonSize} ${
        isFavorite ? 'text-favorite' : 'text-text-muted'
      } hover:text-favorite hover:scale-110`}
      onClick={handleClick}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      type="button"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
