import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, communityVotes, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    
    // Base selector
    const selector: any = {
      id: communityPosts.id,
      title: communityPosts.title,
      content: communityPosts.content,
      upvotes: communityPosts.upvotes,
      createdAt: communityPosts.createdAt,
      user: {
        name: users.name,
        image: users.image,
      },
    };

    // If user is logged in, also fetch their vote
    if (session?.user?.id) {
      selector.userVote = sql<number>`(
        SELECT value FROM ${communityVotes} 
        WHERE ${communityVotes.postId} = ${communityPosts.id} 
        AND ${communityVotes.userId} = ${session.user.id}
        LIMIT 1
      )`;
    }

    const posts = await db
      .select(selector)
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.createdAt));

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("[COMMUNITY_GET]", error);
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    console.log("[COMMUNITY_POST] Request received:", { title, userId: session.user.id });

    try {
      const [post] = await db
        .insert(communityPosts)
        .values({
          userId: session.user.id,
          title: title.trim(),
          content: content.trim(),
        })
        .returning();

      if (!post) {
        throw new Error("No data returned from insert");
      }

      console.log("[COMMUNITY_POST] Success:", post.id);
      return NextResponse.json(post);
    } catch (dbError: any) {
      console.error("[COMMUNITY_POST_DB_ERROR]", dbError);
      
      // Check if table is missing
      if (dbError.message.includes("relation \"community_posts\" does not exist")) {
        return NextResponse.json({ 
          error: "Community system not initialized. Please run database migrations.", 
          code: "MIGRATION_REQUIRED"
        }, { status: 503 });
      }

      return NextResponse.json({ 
        error: "Database error occurred while posting", 
        details: dbError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[COMMUNITY_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
