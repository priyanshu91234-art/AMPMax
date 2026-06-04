import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db
      .select({
        id: scanResults.id,
        rating: scanResults.rating,
        label: scanResults.label,
        createdAt: scanResults.createdAt,
      })
      .from(scanResults)
      .where(eq(scanResults.userId, session.user.id))
      .orderBy(desc(scanResults.createdAt))
      .limit(30);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[HISTORY ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
