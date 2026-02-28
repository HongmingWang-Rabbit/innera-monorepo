import {
  Visibility,
  CircleRole,
  HistoryPolicy,
  MembershipStatus,
  PartnerLinkStatus,
} from '../types/index';
import type {
  Visibility as VisibilityType,
  CircleRole as CircleRoleType,
  HistoryPolicy as HistoryPolicyType,
  MembershipStatus as MembershipStatusType,
} from '../types/index';

export interface EntryAccess {
  authorId: string;
  visibility: VisibilityType;
  circleId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface ViewerContext {
  userId: string;
  /**
   * The partner's userId. Must only be set when an ACTIVE partner link exists
   * between the viewer and this user. Null if no active partnership.
   */
  partnerId: string | null;
  /**
   * Status of the partner link. Must only be 'ACTIVE' when both parties have
   * accepted the partnership. Null if no partner link exists.
   */
  partnerStatus: PartnerLinkStatus | null;
  circleMemberships: Array<{
    circleId: string;
    role: CircleRoleType;
    status: MembershipStatusType;
    historyPolicy: HistoryPolicyType;
    joinedAt: Date;
  }>;
}

/** Find the active membership for a circle, or null. */
function findActiveMembership(
  circleMemberships: ViewerContext['circleMemberships'],
  circleId: string,
) {
  return circleMemberships.find(
    (m) => m.circleId === circleId && m.status === MembershipStatus.ACTIVE,
  ) ?? null;
}

/**
 * Determines whether a viewer is allowed to read an entry based on
 * visibility, circle membership, partner relationship, and history policy.
 */
export function canViewEntry(entry: EntryAccess, viewer: ViewerContext): boolean {
  // Author can always view their own entries
  if (entry.authorId === viewer.userId) return true;

  // Non-authors cannot view soft-deleted entries
  if (entry.deletedAt) return false;

  switch (entry.visibility) {
    case Visibility.PRIVATE:
      return false;

    case Visibility.PARTNER:
      return viewer.partnerId === entry.authorId && viewer.partnerStatus === 'ACTIVE';

    case Visibility.CIRCLE: {
      if (!entry.circleId) return false;
      const membership = findActiveMembership(viewer.circleMemberships, entry.circleId);
      if (!membership) return false;
      // CIRCLE visibility respects history policy
      if (membership.historyPolicy === HistoryPolicy.ALL) return true;
      return entry.createdAt >= membership.joinedAt;
    }

    case Visibility.FUTURE_CIRCLE_ONLY: {
      if (!entry.circleId) return false;
      const membership = findActiveMembership(viewer.circleMemberships, entry.circleId);
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
  if (entry.deletedAt) return false;
  // Only the author can edit their own entries
  return entry.authorId === viewer.userId;
}

/**
 * Determines whether a viewer can delete an entry. Authors can always
 * delete their own entries; circle OWNER/ADMIN members with ACTIVE status
 * can delete entries posted to their circle.
 */
export function canDeleteEntry(entry: EntryAccess, viewer: ViewerContext): boolean {
  if (entry.deletedAt) return false;
  // Author can always delete their own entries
  if (entry.authorId === viewer.userId) return true;

  // Circle admins/owners can delete entries posted to their circle
  if (entry.circleId && (entry.visibility === Visibility.CIRCLE || entry.visibility === Visibility.FUTURE_CIRCLE_ONLY)) {
    const membership = findActiveMembership(viewer.circleMemberships, entry.circleId);
    if (membership && (membership.role === CircleRole.OWNER || membership.role === CircleRole.ADMIN)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if the given circle role has permission to manage circle
 * settings (currently restricted to the OWNER role).
 */
export function canManageCircle(role: CircleRoleType): boolean {
  return role === CircleRole.OWNER;
}

/**
 * Determines whether an actor with the given role can kick a target member
 * with the given role. OWNERs can kick anyone except other OWNERs; ADMINs
 * can only kick MEMBERs.
 */
export function canKickMember(actorRole: CircleRoleType, targetRole: CircleRoleType): boolean {
  // Only OWNER and ADMIN can kick members
  if (actorRole === CircleRole.OWNER) {
    // OWNER can kick anyone except another OWNER (there shouldn't be multiple, but guard anyway)
    return targetRole !== CircleRole.OWNER;
  }
  if (actorRole === CircleRole.ADMIN) {
    // ADMIN can kick MEMBERs only, not OWNER or other ADMINs
    return targetRole === CircleRole.MEMBER;
  }
  return false;
}
