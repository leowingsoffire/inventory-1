'use client';

import { useAuth } from '@/lib/auth-context';

/**
 * Returns true when the app is in demo mode (hardcoded sample data visible).
 * Production users (logged-in via real auth) never see demo data.
 */
export function useAppMode() {
  const { user } = useAuth();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && !user;
  return { isDemo, isProduction: !isDemo };
}
