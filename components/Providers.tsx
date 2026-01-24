'use client';

import { ThemeProvider } from '@/lib/theme-context';
import { AdminProvider } from '@/lib/admin-context';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AdminProvider>{children}</AdminProvider>
    </ThemeProvider>
  );
}
