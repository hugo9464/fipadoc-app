'use client';

import { useEffect, useRef, useState } from 'react';

interface StickyDateHeaderProps {
  date: string;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export default function StickyDateHeader({ date, scrollContainerRef }: StickyDateHeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      // Calculate progress: 0 at scroll 0, 1 at scroll >= 80px
      const progress = Math.min(scrollTop / 80, 1);
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef]);

  // Interpolate values based on scroll progress
  // Height: 56px -> 40px (reduced by 16px)
  const height = 56 - (scrollProgress * 16);
  // Padding: 16px -> 8px
  const padding = 16 - (scrollProgress * 8);
  // Font size: 1rem -> 0.875rem
  const fontSize = 1 - (scrollProgress * 0.125);
  // Background opacity for subtle effect
  const bgOpacity = 0.95 + (scrollProgress * 0.05);

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-10 bg-surface border-b border-border flex items-center justify-center transition-shadow duration-200"
      style={{
        height: `${height}px`,
        padding: `0 ${padding}px`,
        backgroundColor: `rgba(var(--surface-rgb, 255, 255, 255), ${bgOpacity})`,
        backdropFilter: scrollProgress > 0 ? 'blur(8px)' : 'none',
        boxShadow: scrollProgress > 0.5 ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      <h3
        className="font-heading font-semibold text-foreground uppercase tracking-wide m-0 transition-transform duration-150"
        style={{
          fontSize: `${fontSize}rem`,
          transform: `scale(${1 - scrollProgress * 0.05})`,
        }}
      >
        {date}
      </h3>
    </div>
  );
}
