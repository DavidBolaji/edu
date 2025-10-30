import { validate } from "@/app/dashboard/_services/user.services";
import db from "@/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { endpoint } = body;
    const sessionId = (await cookies()).get('SESSION_COOKIE')?.value;
    const session = await validate(sessionId);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });
    if (endpoint) {
        await db.webPush.deleteMany({ where: { pushUrl: { contains: endpoint } } });
    } else {
        await db.webPush.deleteMany({ where: { userId: session.userId } });
    }
    return NextResponse.json({ ok: true });
}
