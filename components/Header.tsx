'use client';

import { useState, useEffect } from 'react';
import Logo from './Logo';
import TicketViewer from './TicketViewer';
import ProfileDropdown from './ProfileDropdown';
import { hasTicket } from '@/lib/ticket-storage';

interface HeaderProps {
  version?: string;
}

export default function Header({ version }: HeaderProps) {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [hasStoredTicket, setHasStoredTicket] = useState(false);

  useEffect(() => {
    hasTicket().then(setHasStoredTicket);
  }, [isTicketOpen]);

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-md py-sm">
          <div className="flex items-center gap-sm">
            <Logo variant="light" size="md" />
            <div className="flex flex-col">
              <h1 className="font-heading text-lg font-bold tracking-wider text-foreground uppercase leading-tight">
                FIPADOC 2026
              </h1>
              <span className="text-[0.7rem] text-text-muted font-medium tracking-wide">
                23 JAN - 31 JAN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-xs">
            {/* Ticket/Pass button */}
            <button
              onClick={() => setIsTicketOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground cursor-pointer rounded-full transition-colors duration-150 hover:bg-border"
              aria-label="Mon billet"
              title="Mon billet"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
              {hasStoredTicket && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-theme rounded-full border-2 border-background" />
              )}
            </button>

            {/* Profile dropdown */}
            <ProfileDropdown />

            {version && (
              <span className="text-[0.65rem] text-text-muted ml-xs">
                v{version}
              </span>
            )}
          </div>
        </div>
      </header>

      <TicketViewer isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />
    </>
  );
}
