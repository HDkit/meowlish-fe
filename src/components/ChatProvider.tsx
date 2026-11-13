'use client';

/**
 * Used to poll the chat log of every room every 30 s (one request per room) just to show list
 * previews, and its first page is the OLDEST messages, so previews went stale. The room list now
 * returns each room's newest message, and a room view loads its own log, so there is nothing left to
 * poll here. Kept as a pass-through so the app layout doesn't change.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
