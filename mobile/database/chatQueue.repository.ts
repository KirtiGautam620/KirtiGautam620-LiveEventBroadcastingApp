import { getDatabase } from './database';

export type PendingMessageStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface PendingMessage {
  id: number;
  stream_id: string;
  sender_id: string;
  client_id: string;
  content: string;
  client_created_at: string;
  status: PendingMessageStatus;
  retry_count: number;
  created_at: string;
}

export interface EnqueueMessageInput {
  stream_id: string;
  sender_id: string;
  client_id: string;
  content: string;
  client_created_at: string;
}

export interface ChatQueueRepository {
  enqueueMessage(input: EnqueueMessageInput): Promise<PendingMessage>;
  getPendingMessages(): Promise<PendingMessage[]>;
  markSyncing(id: number): Promise<void>;
  markSynced(id: number): Promise<void>;
  markFailed(id: number): Promise<void>;
  deleteSynced(): Promise<void>;
}

export const chatQueueRepository: ChatQueueRepository = {
  async enqueueMessage(input) {
    const db = await getDatabase();
    const createdAt = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO pending_messages
        (stream_id, sender_id, client_id, content, client_created_at, status, retry_count, created_at)
       VALUES ($stream_id, $sender_id, $client_id, $content, $client_created_at, 'pending', 0, $created_at)`,
      {
        $stream_id: input.stream_id,
        $sender_id: input.sender_id,
        $client_id: input.client_id,
        $content: input.content,
        $client_created_at: input.client_created_at,
        $created_at: createdAt,
      },
    );
    return {
      id: result.lastInsertRowId,
      stream_id: input.stream_id,
      sender_id: input.sender_id,
      client_id: input.client_id,
      content: input.content,
      client_created_at: input.client_created_at,
      status: 'pending',
      retry_count: 0,
      created_at: createdAt,
    };
  },

  async getPendingMessages() {
    const db = await getDatabase();
    // AUTOINCREMENT guarantees strictly increasing ids, so ordering by id
    // preserves insertion order.
    return db.getAllAsync<PendingMessage>(
      `SELECT * FROM pending_messages WHERE status = $status ORDER BY id ASC`,
      { $status: 'pending' },
    );
  },

  async markSyncing(id) {
    const db = await getDatabase();
    await db.runAsync(`UPDATE pending_messages SET status = 'syncing' WHERE id = $id`, {
      $id: id,
    });
  },

  async markSynced(id) {
    const db = await getDatabase();
    await db.runAsync(`UPDATE pending_messages SET status = 'synced' WHERE id = $id`, {
      $id: id,
    });
  },

  async markFailed(id) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE pending_messages SET status = 'failed', retry_count = retry_count + 1 WHERE id = $id`,
      { $id: id },
    );
  },

  async deleteSynced() {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM pending_messages WHERE status = $status`, {
      $status: 'synced',
    });
  },
};
