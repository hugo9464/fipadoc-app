'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, isDark } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:bg-border"
        aria-label="Menu profil"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50"
          role="menu"
        >
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-md py-sm hover:bg-surface transition-colors duration-150 cursor-pointer border-none bg-transparent text-foreground"
            role="menuitem"
          >
            <div className="flex items-center gap-sm">
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
              <span className="text-sm">Mode {isDark ? 'clair' : 'sombre'}</span>
            </div>

            {/* Toggle switch */}
            <div
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                isDark ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-background rounded-full shadow-sm transition-transform duration-200 ${
                  isDark ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* External account link */}
          <a
            href="https://site-fipadoc.festicine.fr/fr/account/ticket"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-sm px-md py-sm hover:bg-surface transition-colors duration-150 text-foreground no-underline"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="text-sm">Mon compte FIPADOC</span>
          </a>
        </div>
      )}
    </div>
  );
}
