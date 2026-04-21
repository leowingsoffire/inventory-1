import { NextResponse } from 'next/server';
import { getSession, type SessionPayload } from '@/lib/session';
import { DEFAULT_PERMISSIONS, type Resource, type RoleKey, ROLES } from '@/lib/rbac';

export interface AuthenticatedRequest {
  session: SessionPayload;
}

/**
 * Validates the session and returns the session payload, or a 401 response.
 */
export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return session;
}

/**
 * Validates the session and checks if the user has the required role.
 */
export async function requireRole(...roles: string[]): Promise<SessionPayload | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  return result;
}

/**
 * Validates the session and checks RBAC permission for a resource+action.
 */
export async function requirePermission(
  resource: Resource,
  action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete'
): Promise<SessionPayload | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  const roleKey = result.role as RoleKey;
  const permissions = DEFAULT_PERMISSIONS[roleKey];

  if (!permissions) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  }

  const resourcePerms = permissions[resource];
  if (!resourcePerms || !resourcePerms[action]) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  return result;
}

/**
 * Helper: returns true if result is a NextResponse (error), false if it's a valid session.
 */
export function isAuthError(result: SessionPayload | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
