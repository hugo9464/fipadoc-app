import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Disable Turbopack - Serwist requires Webpack
  experimental: {
    turbopack: false,
  },
};

export default withSerwist(nextConfig);
