import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/neon/client';
import { users } from '@/lib/neon/schema';
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Find user
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session
    const token = await createToken({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
