'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Badge, Button, Card, Input, Spinner, EmptyState, Text, XStack, YStack } from '@innera/ui';
import { Lock, Heart, Users, Calendar, MessageCircle, Send } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { useParams, useRouter } from '../navigation';
import { useEntry, useDeleteEntry } from '../hooks/use-entries';
import { useComments, useCreateComment } from '../hooks/use-comments';
import { useReactions, useToggleReaction } from '../hooks/use-reactions';
import { useAuth } from '../auth/use-auth';
import { palette } from '../constants';
import type { Visibility } from '@innera/shared';
import { safeDecodeBase64, encodeBase64 } from '../utils/crypto';
import { formatDate } from '../utils/format';
import { VISIBILITY_CONFIG } from '../utils/visibility';

// Icon lookup keyed by the icon name from VISIBILITY_CONFIG. JSX elements are
// intentionally created at module level since they are simple, stateless icon
// components with no hook dependencies.
const VISIBILITY_ICON: Record<string, React.ReactElement> = {
  Lock: <Lock size={14} color={VISIBILITY_CONFIG.PRIVATE.color} />,
  Heart: <Heart size={14} color={VISIBILITY_CONFIG.PARTNER.color} />,
  Users: <Users size={14} color={VISIBILITY_CONFIG.CIRCLE.color} />,
};

/** Badge variant for visibility display (all use 'brand'). */
const VISIBILITY_BADGE_VARIANT = 'brand' as const;

const EMOJI_OPTIONS = ['❤️', '👍', '😊', '🙏', '✨', '🫂'];

export function EntryDetailScreen() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user } = useAuth();
  const { data: entry, isLoading, isError } = useEntry(id);
  const deleteEntry = useDeleteEntry();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Comments
  const { data: commentsData } = useComments(id ?? '');
  const createComment = useCreateComment(id ?? '');
  const [commentText, setCommentText] = useState('');

  // Reactions
  const { data: reactionsData } = useReactions(id ?? '');
  const toggleReaction = useToggleReaction(id ?? '');

  // Stable refs for mutation functions to avoid re-creating callbacks on every render
  const deleteEntryRef = useRef(deleteEntry.mutateAsync);
  const createCommentRef = useRef(createComment.mutateAsync);
  const toggleReactionRef = useRef(toggleReaction.mutate);
  useEffect(() => {
    deleteEntryRef.current = deleteEntry.mutateAsync;
    createCommentRef.current = createComment.mutateAsync;
    toggleReactionRef.current = toggleReaction.mutate;
  });

  const allComments = useMemo(() => {
    if (!commentsData?.pages) return [];
    return commentsData.pages.flatMap((p) => p.data);
  }, [commentsData]);

  // Group reactions by emoji with count and user's own reaction id
  const reactionGroups = useMemo(() => {
    if (!reactionsData) return [];
    const grouped = new Map<string, { count: number; myReactionId?: string }>();
    for (const r of reactionsData) {
      const existing = grouped.get(r.emoji) ?? { count: 0 };
      existing.count++;
      if (r.userId === user?.id) existing.myReactionId = r.id;
      grouped.set(r.emoji, existing);
    }
    return Array.from(grouped.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  }, [reactionsData, user?.id]);

  const handleEdit = useCallback(() => {
    if (id) router.push(`/entry/edit/${id}`);
  }, [id, router]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    const doDelete = async () => {
      setDeleteError(null);
      try {
        await deleteEntryRef.current(id);
        router.back();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete entry');
      }
    };

    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void doDelete(); } },
    ]);
  }, [id, router]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !id) return;
    try {
      await createCommentRef.current(encodeBase64(commentText.trim()));
      setCommentText('');
    } catch {
      // Error handled via mutation state
    }
  }, [commentText, id]);

  const handleToggleReaction = useCallback((emoji: string) => {
    if (!id) return;
    const existing = reactionGroups.find((r) => r.emoji === emoji);
    toggleReactionRef.current({
      emoji,
      existingReactionId: existing?.myReactionId,
    });
  }, [id, reactionGroups]);

  if (!id) {
    return (
      <ScreenContainer edges={['bottom']} scrollable>
        <EmptyState
          icon={<Calendar size={36} color="$colorSubtle" />}
          title="No entry selected"
          description="Please select an entry to view."
          action={<Button size="md" variant="secondary" onPress={() => router.back()}>Go Back</Button>}
        />
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']} scrollable>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
          <Spinner size="large" />
        </YStack>
      </ScreenContainer>
    );
  }

  if (isError || !entry) {
    return (
      <ScreenContainer edges={['bottom']} scrollable>
        <EmptyState
          icon={<Calendar size={36} color="$colorSubtle" />}
          title="Entry not found"
          description="This entry may have been deleted or doesn't exist."
          action={
            <Button size="md" variant="secondary" onPress={() => router.back()}>
              Go Back
            </Button>
          }
        />
      </ScreenContainer>
    );
  }

  const title = entry.titleEncrypted ? safeDecodeBase64(entry.titleEncrypted, 'Untitled') : 'Untitled';
  const content = safeDecodeBase64(entry.contentEncrypted);
  const visEntry = VISIBILITY_CONFIG[entry.visibility] ?? VISIBILITY_CONFIG.PRIVATE;
  const visIcon = VISIBILITY_ICON[visEntry.icon] ?? VISIBILITY_ICON['Lock']!;
  const createdDate = formatDate(entry.createdAt);
  const canSend = commentText.trim().length > 0 && !createComment.isPending;

  return (
    <ScreenContainer edges={['bottom']} scrollable>
      <XStack justifyContent="space-between" alignItems="center">
        <YStack flex={1}>
          <Text variant="subheading">{title}</Text>
          {entry.mood && <Text variant="caption">Mood: {entry.mood}</Text>}
        </YStack>
        {entry.authorId === user?.id && (
          <Button size="sm" variant="secondary" accessibilityLabel="Edit entry" onPress={handleEdit}>
            Edit
          </Button>
        )}
      </XStack>

      <Card padding="md">
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              {visIcon}
              <Text variant="label">Visibility</Text>
            </XStack>
            <Badge variant={VISIBILITY_BADGE_VARIANT}>{visEntry.label}</Badge>
          </XStack>
          <YStack gap="$1">
            <XStack alignItems="center" gap="$2">
              <Calendar size={14} color="$colorSubtle" />
              <Text variant="caption">Created</Text>
            </XStack>
            <Text variant="label" paddingLeft="$6">{createdDate}</Text>
          </YStack>
        </YStack>
      </Card>

      <Card flex={1} padding="lg" variant="flat">
        <YStack gap="$3" flex={1}>
          <Text variant="label">Content</Text>
          <Text fontSize="$4" color="$color" lineHeight="$7">{content}</Text>
        </YStack>
      </Card>

      {/* Reactions */}
      <YStack gap="$2">
        <Text variant="label">Reactions</Text>
        <XStack gap="$2" flexWrap="wrap">
          {EMOJI_OPTIONS.map((emoji) => {
            const group = reactionGroups.find((r) => r.emoji === emoji);
            const isActive = !!group?.myReactionId;
            return (
              <Button
                key={emoji}
                size="sm"
                variant={isActive ? 'primary' : 'secondary'}
                onPress={() => handleToggleReaction(emoji)}
                accessibilityLabel={`React with ${emoji}`}
              >
                {emoji} {group ? group.count : ''}
              </Button>
            );
          })}
        </XStack>
      </YStack>

      {/* Comments */}
      <YStack gap="$3">
        <XStack alignItems="center" gap="$2">
          <MessageCircle size={16} color="$colorSubtle" />
          <Text variant="label">
            Comments {allComments.length > 0 ? `(${allComments.length})` : ''}
          </Text>
        </XStack>

        {allComments.map((comment) => (
          <MemoizedCommentCard key={comment.id} comment={comment} />
        ))}

        <XStack gap="$2" alignItems="center">
          <Input
            flex={1}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            aria-label="Comment input"
          />
          <Button
            size="sm"
            disabled={!canSend}
            loading={createComment.isPending}
            onPress={handleAddComment}
            accessibilityLabel="Send comment"
          >
            <Send size={16} color={canSend ? palette.white : palette.gray400} />
          </Button>
        </XStack>
      </YStack>

      {deleteError && (
        <Text fontSize="$2" color="$danger" textAlign="center">{deleteError}</Text>
      )}

      <XStack gap="$3">
        {entry.authorId === user?.id && (
          <Button
            flex={1}
            variant="danger"
            accessibilityLabel="Delete entry"
            onPress={handleDelete}
            loading={deleteEntry.isPending}
          >
            Delete
          </Button>
        )}
        <Button flex={1} variant="secondary" accessibilityLabel="Share entry (coming soon)" onPress={() => {/* TODO: implement share */}} disabled>
          Share (Coming Soon)
        </Button>
      </XStack>
    </ScreenContainer>
  );
}

function CommentCard({ comment }: { comment: { id: string; contentEncrypted: string; createdAt: string } }) {
  const content = safeDecodeBase64(comment.contentEncrypted);

  return (
    <Card padding="sm">
      <YStack gap="$1">
        <Text fontSize="$3" color="$color">
          {content}
        </Text>
        <Text variant="caption">
          {formatDate(comment.createdAt)}
        </Text>
      </YStack>
    </Card>
  );
}

const MemoizedCommentCard = React.memo(CommentCard);
