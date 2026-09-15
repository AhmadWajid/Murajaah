/** Normalize session responses from both current and older deployments. */
export interface AuthUser {
  id: string;
  email: string;
}

export function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;
  const user = value as { id?: unknown; userId?: unknown; email?: unknown };
  const id = typeof user.id === 'string' && user.id ? user.id : user.userId;
  if (typeof id !== 'string' || !id || typeof user.email !== 'string') return null;
  return { id, email: user.email };
}
