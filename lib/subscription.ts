import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const FREE_SCAN_LIMIT = 2;

/**
 * Check if a user has an active premium subscription.
 */
export async function getUserSubscription(userId: string) {
  const now = new Date();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.stripeCurrentPeriodEnd, now)
      )
    )
    .limit(1);
  return sub ?? null;
}

/**
 * Returns true if the user is on premium (has active subscription).
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  return sub !== null;
}

/**
 * Returns the number of scans a user has used.
 */
export async function getUserScanCount(userId: string): Promise<number> {
  const [user] = await db
    .select({ scanCount: users.scanCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.scanCount ?? 0;
}

/**
 * Increment scan count for a user.
 */
export async function incrementScanCount(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ scanCount: (await getUserScanCount(userId)) + 1 })
    .where(eq(users.id, userId));
}

/**
 * Check if a free user can perform a scan (under the limit).
 */
export async function canScan(userId: string): Promise<boolean> {
  const premium = await isPremiumUser(userId);
  if (premium) return true;
  const count = await getUserScanCount(userId);
  return count < FREE_SCAN_LIMIT;
}

/**
 * Returns subscription status info for a user (for client display).
 */
export async function getSubscriptionStatus(userId: string) {
  const premium = await isPremiumUser(userId);
  const scanCount = await getUserScanCount(userId);
  const sub = premium ? await getUserSubscription(userId) : null;

  return {
    isPremium: premium,
    scanCount,
    scansRemaining: premium ? Infinity : Math.max(0, FREE_SCAN_LIMIT - scanCount),
    scanLimit: FREE_SCAN_LIMIT,
    currentPeriodEnd: sub?.stripeCurrentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}
