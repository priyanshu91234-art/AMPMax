import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeFace } from "@/lib/gemini";
import { db } from "@/lib/db";
import { scanResults } from "@/lib/db/schema";
import { canScan, incrementScanCount, FREE_SCAN_LIMIT } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ─── Subscription / free-tier gate ───────────────────────
    const allowed = await canScan(userId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "FREE_LIMIT_REACHED",
          message: `You've used all ${FREE_SCAN_LIMIT} free scans. Upgrade to Premium for unlimited scans.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { frontImage, sideImage } = body;
    console.log("Front image length:", frontImage?.length);
    console.log("Side image length:", sideImage?.length);

    if (!frontImage) {
      return NextResponse.json(
        { error: "Front profile image is required" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const frontBase64 = frontImage.replace(/^data:image\/\w+;base64,/, "");
    const sideBase64 = sideImage ? sideImage.replace(/^data:image\/\w+;base64,/, "") : undefined;

    const result = await analyzeFace(frontBase64, sideBase64);

    // Save to database
    const [saved] = await db
      .insert(scanResults)
      .values({
        userId,
        rating: result.rating,
        label: result.label,
        analysis: result.analysis,
        roadmap: result.roadmap,
        products: result.products,
      })
      .returning({ id: scanResults.id });

    // Increment scan count for free-tier tracking
    await incrementScanCount(userId);

    return NextResponse.json({ id: saved.id, ...result });
  } catch (error) {
    console.error("[SCAN ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
