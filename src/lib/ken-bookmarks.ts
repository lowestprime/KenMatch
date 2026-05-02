import "server-only";

import { randomUUID } from "node:crypto";

import { communityExecute, communityOne, rowString } from "@/lib/community-db";

export async function toggleKenBookmark(input: { profileId: string; taskId: string }) {
  const task = await communityOne("SELECT id FROM tasks WHERE id = ?", [input.taskId]);
  if (!task) throw new Error("Ken not found.");
  const existing = await communityOne("SELECT id FROM bookmarks WHERE profileId = ? AND taskId = ?", [input.profileId, input.taskId]);
  if (existing) {
    await communityExecute("DELETE FROM bookmarks WHERE id = ?", [rowString(existing, "id")]);
    return false;
  }
  await communityExecute(
    "INSERT INTO bookmarks (id, profileId, taskId, createdAt) VALUES (?, ?, ?, ?)",
    [randomUUID(), input.profileId, input.taskId, new Date().toISOString()],
  );
  return true;
}
