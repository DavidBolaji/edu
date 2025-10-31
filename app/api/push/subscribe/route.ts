
import { NextResponse } from 'next/server';
import { validate } from '@/app/dashboard/_services/user.services';
import { cookies } from 'next/headers';
import db from '@/prisma';
import { SESSION_COOKIE } from '@/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription } = body;
    if (!subscription) return NextResponse.json({ error: 'missing' }, { status: 400 });

    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sessionId) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

    const session = await validate(sessionId);
    if (!session) return NextResponse.json({ error: 'invalid session' }, { status: 401 });

    // upsert (one push entry per user, or allow multiple endpoints per user)
    await db.webPush.upsert({
      where: { userId: session.userId },
      update: { pushUrl: JSON.stringify(subscription) },
      create: { userId: session.userId, pushUrl: JSON.stringify(subscription) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
