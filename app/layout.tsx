import type { Metadata, Viewport } from 'next';
import { Oswald } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FIPADOC Programme',
  description: 'Programme du festival international du documentaire',
  applicationName: 'FIPADOC',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FIPADOC',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={oswald.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
