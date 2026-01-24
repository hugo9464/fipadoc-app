'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  enableAdminMode: (password: string) => boolean;
  disableAdminMode: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const STORAGE_KEY = 'fipadoc-admin';
const ADMIN_PASSWORD = 'biarritz';

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load saved admin state on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem(STORAGE_KEY);
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
    setMounted(true);
  }, []);

  // Persist admin state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, isAdmin ? 'true' : 'false');
    }
  }, [isAdmin, mounted]);

  const enableAdminMode = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const disableAdminMode = () => {
    setIsAdmin(false);
  };

  // Prevent flash during hydration
  if (!mounted) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ isAdmin, enableAdminMode, disableAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
