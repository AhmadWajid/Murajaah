/**
 * Auth utilities — email/password authentication with JWT sessions.
 * Server-side only.
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE = 'murajaah_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
}

// ─── Password hashing ───
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ───
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// ─── Cookie helpers (server-side) ───
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Client-side helpers ───
export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export async function getTokenFromRequest(request: Request): Promise<SessionPayload | null> {
  // Try cookie first
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = tokenMatch?.[1];
  if (!token) return null;
  return verifyToken(token);
}

// Generate a UUID
export function generateId(): string {
  return crypto.randomUUID();
}
