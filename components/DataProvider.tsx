'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { DbAdapter } from '@/lib/db';
import { getDb } from '@/lib/db';

type DataContextValue = {
  db: DbAdapter | null;
  loading: boolean;
  platform: 'electron' | 'capacitor' | 'memory' | 'unknown';
};

const DataContext = createContext<DataContextValue>({
  db: null,
  loading: true,
  platform: 'unknown',
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DbAdapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .then((adapter) => {
        if (cancelled) return;
        setDb(adapter);
      })
      .catch((e) => {
        console.error('Failed to initialize database', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      db,
      loading,
      platform: db?.platform ?? 'unknown',
    }),
    [db, loading],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

export async function logAction(db: DbAdapter | null, action: string, details = '') {
  if (!db) return;
  try {
    await db.addLog(action, details);
  } catch (e) {
    console.error('Could not write log', e);
  }
}
