import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, communityComments, communityVotes, users } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const [post] = await db
      .select(selector)
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, id));

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await db
      .select({
        id: communityComments.id,
        content: communityComments.content,
        createdAt: communityComments.createdAt,
        user: {
          name: users.name,
          image: users.image,
        },
      })
      .from(communityComments)
      .innerJoin(users, eq(communityComments.userId, users.id))
      .where(eq(communityComments.postId, id))
      .orderBy(asc(communityComments.createdAt));

    return NextResponse.json({ ...post, comments });
  } catch (error) {
    console.error("[POST_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
