import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const posts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        upvotes: communityPosts.upvotes,
        createdAt: communityPosts.createdAt,
        user: {
          name: users.name,
          image: users.image,
        },
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.createdAt));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[COMMUNITY_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const [post] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        title,
        content,
      })
      .returning();

    return NextResponse.json(post);
  } catch (error) {
    console.error("[COMMUNITY_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
