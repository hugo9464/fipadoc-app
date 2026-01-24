'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
      setCanShare(!!navigator.share);
    }
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FIPADOC Programme',
          text: 'Découvrez le programme du festival FIPADOC',
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-lg shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-md py-sm border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Partager l&apos;app</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors border-none bg-transparent text-foreground cursor-pointer"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-md flex flex-col items-center gap-md">
          {/* QR Code */}
          <div className="bg-white p-md rounded-lg">
            {appUrl && (
              <QRCodeSVG
                value={appUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary text-center">
            Scannez ce QR code pour accéder à l&apos;app
          </p>

          {/* Link with copy button */}
          <div className="w-full flex items-center gap-xs bg-surface rounded-lg p-xs">
            <input
              type="text"
              value={appUrl}
              readOnly
              className="flex-1 bg-transparent border-none text-sm text-foreground px-sm py-xs outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-xs px-sm py-xs rounded bg-background border border-border text-sm text-foreground hover:bg-border transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          {/* Native share button */}
          {canShare && (
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-sm px-md py-sm rounded-lg bg-accent text-background font-medium hover:bg-accent/80 transition-colors cursor-pointer border-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Partager</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
