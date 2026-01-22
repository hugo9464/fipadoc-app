'use client';

export type ViewMode = 'list' | 'calendar';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex bg-border rounded-lg p-0.5 gap-0.5">
      <button
        className={`flex items-center justify-center w-9 h-8 border-none bg-transparent cursor-pointer rounded-md transition-all duration-150 ${
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-text-muted hover:text-foreground'
        }`}
        onClick={() => onViewModeChange('list')}
        aria-label="Vue liste"
        title="Vue liste"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
      <button
        className={`flex items-center justify-center w-9 h-8 border-none bg-transparent cursor-pointer rounded-md transition-all duration-150 ${
          viewMode === 'calendar'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-text-muted hover:text-foreground'
        }`}
        onClick={() => onViewModeChange('calendar')}
        aria-label="Vue calendrier"
        title="Vue calendrier"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>
  );
}
