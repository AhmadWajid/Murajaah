'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { DataMigration } from './DataMigration';

/** The simulator must not mount auth/settings synchronization or migration UI. */
export function AppDataBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/review-simulator') return children;
  return <AuthProvider>{children}<DataMigration /></AuthProvider>;
}
