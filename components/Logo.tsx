'use client';

import { useTheme } from '@/lib/theme-context';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

export default function Logo({ size = 'md' }: LogoProps) {
  const { isDark } = useTheme();
  const { width, height } = sizes[size];
  // Dark logo on light background, light logo on dark background
  const fillColor = isDark ? '#ffffff' : '#000000';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FIPADOC logo"
    >
      {/* FIPADOC triangle - bottom-right diagonal half of a square */}
      <polygon
        points="100,0 100,100 0,100"
        fill={fillColor}
      />
    </svg>
  );
}
