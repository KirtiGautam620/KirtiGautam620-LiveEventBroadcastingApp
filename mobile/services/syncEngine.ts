import { chatQueueRepository, type PendingMessage } from '@/database/chatQueue.repository';
import { chatRepository } from '@/repositories';

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
}

async function sendMessage(message: PendingMessage): Promise<void> {
  await chatQueueRepository.markSyncing(message.id);
  // Idempotent server-side: ChatRepository.send() upserts on
  // (stream_id, sender_id, client_id), so retrying after an ambiguous
  // failure (e.g. request sent but response lost) safely no-ops instead of
  // creating a duplicate message.
  await chatRepository.send({
    stream_id: message.stream_id,
    sender_id: message.sender_id,
    content: message.content,
    client_id: message.client_id,
    client_created_at: message.client_created_at,
  });
  await chatQueueRepository.markSynced(message.id);
  await chatQueueRepository.deleteSynced();
}

// Resolves retries for one message inline (await backoff, retry, repeat)
// before the caller advances to the next message. This is what guarantees
// ordering: a later message never reaches the server before an earlier one
// has reached a terminal outcome (synced, or given up on).
async function syncMessageWithRetries(message: PendingMessage): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await sendMessage(message);
      return;
    } catch (error) {
      await chatQueueRepository.markFailed(message.id);
      if (attempt === MAX_ATTEMPTS) {
        console.warn(
          `syncEngine: giving up on pending message ${message.id} after ${attempt} attempts`,
          error,
        );
        return;
      }
      await sleep(backoffDelay(attempt));
    }
  }
}

async function runSyncPass(): Promise<void> {
  const pending = await chatQueueRepository.getPendingMessages();
  for (const message of pending) {
    await syncMessageWithRetries(message);
  }
}

// Memoizes the in-flight pass so overlapping callers (e.g. Creator and
// Viewer screens mounted for the same stream, or a double-tap on a retry
// action) share one pass instead of racing to process the same rows.
let inFlightSync: Promise<void> | null = null;

export function syncPendingMessages(): Promise<void> {
  if (!inFlightSync) {
    inFlightSync = runSyncPass().finally(() => {
      inFlightSync = null;
    });
  }
  return inFlightSync;
}
