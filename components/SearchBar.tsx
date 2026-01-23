'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Rechercher un film..." }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (isExpanded && value === '') {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const handleBlur = () => {
    if (value === '') {
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex items-center gap-xs">
      <div
        className={`flex items-center transition-all duration-200 overflow-hidden ${
          isExpanded ? 'w-48 sm:w-64 bg-surface border border-border rounded-full' : 'w-10'
        }`}
      >
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:bg-border flex-shrink-0"
          aria-label={isExpanded ? "Fermer la recherche" : "Ouvrir la recherche"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {isExpanded && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="flex-1 min-w-0 py-xs px-0 border-none bg-transparent text-foreground text-sm placeholder:text-text-muted focus:outline-none"
            />
            {value && (
              <button
                onClick={handleClear}
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-text-muted cursor-pointer rounded-full transition-colors duration-150 hover:text-foreground hover:bg-border flex-shrink-0 mr-xs"
                aria-label="Effacer la recherche"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
