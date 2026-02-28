import { eq, and, or, isNull } from 'drizzle-orm';
import { AppError, type Visibility } from '@innera/shared';
import { db, entries, partnerLinks, circleMemberships } from '@innera/db';

/**
 * Verify that `userId` has access to the given entry based on its visibility.
 * Throws FORBIDDEN if access is denied.
 */
export async function checkEntryAccess(
  userId: string,
  entry: { id: string; authorId: string; visibility: Visibility; circleId?: string | null; createdAt?: Date | string | null },
): Promise<void> {
  if (entry.authorId === userId) return; // author always has access

  if (entry.visibility === 'PRIVATE') {
    throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
  }

  if (entry.visibility === 'PARTNER') {
    // Single query checking both directions of the partner link
    const [link] = await db
      .select({ id: partnerLinks.id })
      .from(partnerLinks)
      .where(
        and(
          eq(partnerLinks.status, 'ACTIVE'),
          or(
            and(
              eq(partnerLinks.initiatorId, entry.authorId),
              eq(partnerLinks.partnerId, userId),
            ),
            and(
              eq(partnerLinks.initiatorId, userId),
              eq(partnerLinks.partnerId, entry.authorId),
            ),
          ),
        ),
      )
      .limit(1);

    if (!link) {
      throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
    }
    return;
  }

  if (entry.visibility === 'CIRCLE' || entry.visibility === 'FUTURE_CIRCLE_ONLY') {
    if (!entry.circleId) {
      throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
    }
    // Verify the requesting user is an active member of the entry's circle
    const [membership] = await db
      .select({ id: circleMemberships.id, joinedAt: circleMemberships.joinedAt })
      .from(circleMemberships)
      .where(
        and(
          eq(circleMemberships.circleId, entry.circleId),
          eq(circleMemberships.userId, userId),
          eq(circleMemberships.status, 'ACTIVE'),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
    }

    // FUTURE_CIRCLE_ONLY: enforce temporal restriction
    if (entry.visibility === 'FUTURE_CIRCLE_ONLY') {
      if (!('createdAt' in entry) || !entry.createdAt || !membership.joinedAt) {
        throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
      }
      // entry must have been created after viewer joined
      if (new Date(entry.createdAt) < new Date(membership.joinedAt)) {
        throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
      }
    }

    return;
  }

  // Unknown visibility — deny by default
  throw new AppError('FORBIDDEN', 403, 'You do not have access to this entry');
}

/**
 * Fetch an entry by ID, verify it exists and is not deleted,
 * then check that the given user has access based on visibility.
 * Returns the entry or throws.
 */
export async function getAndVerifyEntryAccess(
  entryId: string,
  userId: string,
): Promise<typeof entries.$inferSelect> {
  const [entry] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), isNull(entries.deletedAt)))
    .limit(1);

  if (!entry) throw new AppError('NOT_FOUND', 404, 'Entry not found');

  await checkEntryAccess(userId, entry);
  return entry;
}
