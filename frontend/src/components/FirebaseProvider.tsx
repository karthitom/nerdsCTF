'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebase';

/**
 * FirebaseProvider
 * ─────────────────
 * Initializes Firebase Analytics on the client side only.
 * Must be rendered inside a 'use client' boundary so it never
 * runs during Next.js SSR.
 *
 * Usage: Wrap your layout body with <FirebaseProvider>
 */
export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics once when the app mounts in the browser
    initAnalytics().catch(() => {
      // Analytics may not be supported in all environments — fail silently
    });
  }, []);

  return <>{children}</>;
}
