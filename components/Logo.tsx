'use client';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

export default function Logo({ variant = 'light', size = 'md' }: LogoProps) {
  const { width, height } = sizes[size];
  const fillColor = variant === 'light' ? '#000000' : '#ffffff';

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
