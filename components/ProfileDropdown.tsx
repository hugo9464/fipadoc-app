'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '@/lib/theme-context';
import { useAdmin } from '@/lib/admin-context';

const APP_URL = 'https://fipadoc.vercel.app';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const { isAdmin, enableAdminMode, disableAdminMode } = useAdmin();

  const handleAdminClick = () => {
    if (isAdmin) {
      disableAdminMode();
      setIsOpen(false);
    } else {
      setShowPasswordPrompt(true);
      setPassword('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enableAdminMode(password)) {
      setShowPasswordPrompt(false);
      setPassword('');
      setIsOpen(false);
    } else {
      setPasswordError(true);
      setPassword('');
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setPasswordError(false);
  };

  const handleShareClick = () => {
    setShowSharePanel(true);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = APP_URL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FIPADOC',
          text: 'Découvrez le programme du festival FIPADOC',
          url: APP_URL,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  const handleCloseSharePanel = () => {
    setShowSharePanel(false);
    setCopied(false);
  };

  // Focus password input when prompt opens
  useEffect(() => {
    if (showPasswordPrompt && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [showPasswordPrompt]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSharePanel(false);
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

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Share app */}
          {showSharePanel ? (
            <div className="p-md">
              <div className="flex items-center justify-between mb-sm">
                <span className="text-sm font-medium text-foreground">Partager l&apos;app</span>
                <button
                  onClick={handleCloseSharePanel}
                  className="p-1 hover:bg-surface rounded transition-colors cursor-pointer border-none bg-transparent text-foreground"
                  aria-label="Fermer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-sm p-sm bg-white rounded-lg">
                <QRCodeSVG value={APP_URL} size={140} level="M" />
              </div>

              {/* Link with copy button */}
              <div className="flex items-center gap-xs mb-sm">
                <div className="flex-1 px-sm py-xs text-xs bg-surface rounded border border-border truncate text-text-secondary">
                  {APP_URL}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-sm py-xs text-xs border-none rounded font-medium transition-colors cursor-pointer ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-accent text-background hover:bg-accent/80'
                  }`}
                >
                  {copied ? 'Copié!' : 'Copier'}
                </button>
              </div>

              {/* Native share button */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-sm px-sm py-xs text-sm border-none rounded bg-accent text-background font-medium hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Partager
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleShareClick}
              className="w-full flex items-center gap-sm px-md py-sm hover:bg-surface transition-colors duration-150 cursor-pointer border-none bg-transparent text-foreground"
              role="menuitem"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span className="text-sm">Partager l&apos;app</span>
            </button>
          )}

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Admin mode toggle */}
          {showPasswordPrompt ? (
            <form onSubmit={handlePasswordSubmit} className="p-md">
              <label className="block text-sm text-text-secondary mb-xs">
                Mot de passe admin
              </label>
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full px-sm py-xs text-sm border rounded bg-background text-foreground ${
                  passwordError ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Entrez le mot de passe"
              />
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">Mot de passe incorrect</p>
              )}
              <div className="flex gap-xs mt-sm">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="flex-1 px-sm py-xs text-sm border border-border rounded bg-transparent text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-sm py-xs text-sm border-none rounded bg-accent text-background font-medium hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleAdminClick}
              className="w-full flex items-center gap-sm px-md py-sm hover:bg-surface transition-colors duration-150 cursor-pointer border-none bg-transparent text-foreground"
              role="menuitem"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                {isAdmin && <polyline points="9 12 11 14 15 10" />}
              </svg>
              <span className="text-sm">{isAdmin ? 'Desactiver mode admin' : 'Mode admin'}</span>
              {isAdmin && (
                <span className="ml-auto text-xs text-accent font-medium">Actif</span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
