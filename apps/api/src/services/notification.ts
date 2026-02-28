import { type NotificationType, AppError } from '@innera/shared';
import { db, notifications } from '@innera/db';

export async function createNotification(
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  },
  tx: Pick<typeof db, 'insert'> = db,
): Promise<string> {
  const [row] = await tx.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? null,
  }).returning({ id: notifications.id });
  if (!row) throw new AppError('INTERNAL_ERROR', 500, 'Failed to create notification');
  return row.id;
}
