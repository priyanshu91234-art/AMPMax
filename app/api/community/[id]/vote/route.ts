import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityVotes, communityPosts, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!dbUser) {
      return NextResponse.json({ error: "User record not found" }, { status: 403 });
    }

    const { id: postId } = await params;
    const { value } = await req.json(); // 1 or -1

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(communityVotes)
      .where(
        and(
          eq(communityVotes.userId, session.user.id),
          eq(communityVotes.postId, postId)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      const currentVote = existingVote[0];
      
      if (currentVote.value === value) {
        // Remove vote if clicking the same button
        await db
          .delete(communityVotes)
          .where(
            and(
              eq(communityVotes.userId, session.user.id),
              eq(communityVotes.postId, postId)
            )
          );
          
        await db
          .update(communityPosts)
          .set({
            upvotes: sql`${communityPosts.upvotes} - ${value}`
          })
          .where(eq(communityPosts.id, postId));
          
        return NextResponse.json({ success: true, removed: true });
      } else {
        // Change vote
        await db
          .update(communityVotes)
          .set({ value })
          .where(
            and(
              eq(communityVotes.userId, session.user.id),
              eq(communityVotes.postId, postId)
            )
          );
          
        await db
          .update(communityPosts)
          .set({
            upvotes: sql`${communityPosts.upvotes} + ${2 * value}`
          })
          .where(eq(communityPosts.id, postId));
          
        return NextResponse.json({ success: true, changed: true });
      }
    }

    // New vote
    await db.insert(communityVotes).values({
      userId: session.user.id,
      postId,
      value,
    });

    await db
      .update(communityPosts)
      .set({
        upvotes: sql`${communityPosts.upvotes} + ${value}`
      })
      .where(eq(communityPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VOTE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
