import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

/** Health probe used by Docker (and any uptime monitor): checks the app and its database. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
