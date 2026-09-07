import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/neon/client';
import { users } from '@/lib/neon/schema';
import { hashPassword, createToken, setSessionCookie, generateId } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create user
    const userId = generateId();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
    });

    // Create session
    const token = await createToken({ userId, email: email.toLowerCase() });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: userId, email: email.toLowerCase() } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
