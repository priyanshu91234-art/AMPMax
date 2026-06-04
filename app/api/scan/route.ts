import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeFace } from "@/lib/gemini";
import { db } from "@/lib/db";
import { scanResults } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { frontImage, sideImage } = body;

    if (!frontImage || !sideImage) {
      return NextResponse.json(
        { error: "Both front and side profile images are required" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const frontBase64 = frontImage.replace(/^data:image\/\w+;base64,/, "");
    const sideBase64 = sideImage.replace(/^data:image\/\w+;base64,/, "");

    const result = await analyzeFace(frontBase64, sideBase64);

    // Save to database
    const [saved] = await db
      .insert(scanResults)
      .values({
        userId: session.user.id,
        rating: result.rating,
        label: result.label,
        analysis: result.analysis,
        roadmap: result.roadmap,
        products: result.products,
      })
      .returning({ id: scanResults.id });

    return NextResponse.json({ id: saved.id, ...result });
  } catch (error) {
    console.error("[SCAN ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
