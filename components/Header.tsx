'use client';

import Logo from './Logo';

interface HeaderProps {
  version?: string;
}

export default function Header({ version }: HeaderProps) {
  return (
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
        {version && (
          <span className="text-[0.65rem] text-text-muted">
            v{version}
          </span>
        )}
      </div>
    </header>
  );
}
