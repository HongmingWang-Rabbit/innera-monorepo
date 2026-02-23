import type { Visibility, CircleRole, HistoryPolicy, MembershipStatus } from '../types/index.js';

interface EntryAccess {
  authorId: string;
  visibility: Visibility;
  circleId: string | null;
  createdAt: Date;
}

interface ViewerContext {
  userId: string;
  partnerId: string | null; // active partner's userId, or null
  circleMemberships: Array<{
    circleId: string;
    role: CircleRole;
    status: MembershipStatus;
    historyPolicy: HistoryPolicy;
    joinedAt: Date;
  }>;
}

/**
 * Determines whether a viewer is allowed to read an entry based on
 * visibility, circle membership, partner relationship, and history policy.
 */
export function canViewEntry(entry: EntryAccess, viewer: ViewerContext): boolean {
  // Author can always view their own entries
  if (entry.authorId === viewer.userId) return true;

  switch (entry.visibility) {
    case 'PRIVATE':
      return false;

    case 'PARTNER':
      return viewer.partnerId === entry.authorId;

    case 'CIRCLE': {
      if (!entry.circleId) return false;
      const membership = viewer.circleMemberships.find(
        (m) => m.circleId === entry.circleId && m.status === 'ACTIVE',
      );
      if (!membership) return false;
      // CIRCLE visibility respects history policy
      if (membership.historyPolicy === 'ALL') return true;
      return entry.createdAt >= membership.joinedAt;
    }

    case 'FUTURE_CIRCLE_ONLY': {
      if (!entry.circleId) return false;
      const membership = viewer.circleMemberships.find(
        (m) => m.circleId === entry.circleId && m.status === 'ACTIVE',
      );
      if (!membership) return false;
      // FUTURE_CIRCLE_ONLY: always enforce temporal restriction regardless of history policy.
      // Only entries created after the viewer joined are visible.
      return entry.createdAt >= membership.joinedAt;
    }

    default:
      return false;
  }
}

/**
 * Determines whether a viewer can edit an entry. Only the original author
 * is allowed to modify their own entries.
 */
export function canEditEntry(entry: EntryAccess, viewer: ViewerContext): boolean {
  // Only the author can edit their own entries
  return entry.authorId === viewer.userId;
}

/**
 * Determines whether a viewer can delete an entry. Authors can always
 * delete their own entries; circle OWNER/ADMIN members with ACTIVE status
 * can delete entries posted to their circle.
 */
export function canDeleteEntry(entry: EntryAccess, viewer: ViewerContext): boolean {
  // Author can always delete their own entries
  if (entry.authorId === viewer.userId) return true;

  // Circle admins/owners can delete entries posted to their circle
  if (entry.circleId && (entry.visibility === 'CIRCLE' || entry.visibility === 'FUTURE_CIRCLE_ONLY')) {
    const membership = viewer.circleMemberships.find((m) => m.circleId === entry.circleId);
    if (
      membership &&
      membership.status === 'ACTIVE' &&
      (membership.role === 'OWNER' || membership.role === 'ADMIN')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if the given circle role has permission to manage circle
 * settings (currently restricted to the OWNER role).
 */
export function canManageCircle(role: CircleRole): boolean {
  return role === 'OWNER';
}

/**
 * Determines whether an actor with the given role can kick a target member
 * with the given role. OWNERs can kick anyone except other OWNERs; ADMINs
 * can only kick MEMBERs.
 */
export function canKickMember(actorRole: CircleRole, targetRole: CircleRole): boolean {
  // Only OWNER and ADMIN can kick members
  if (actorRole === 'OWNER') {
    // OWNER can kick anyone except another OWNER (there shouldn't be multiple, but guard anyway)
    return targetRole !== 'OWNER';
  }
  if (actorRole === 'ADMIN') {
    // ADMIN can kick MEMBERs only, not OWNER or other ADMINs
    return targetRole === 'MEMBER';
  }
  return false;
}
