import "server-only";

import { randomUUID } from "node:crypto";
import type { Value } from "@libsql/client";

import { communityExecute, communityOne, communityRows, rowNullableString, rowNumber, rowString, type CommunityDbRow } from "@/lib/community-db";

export const discussionTopics = ["prompt-design", "governance", "funding", "safety", "evidence", "meta"] as const;
export type DiscussionTopic = (typeof discussionTopics)[number];
export type SavableItemType = "ken" | "discussion-post" | "discussion-comment";

export interface DiscussionPostSummary {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  topic: DiscussionTopic;
  tags: string[];
  linkedTaskId: string | null;
  linkedTaskSlug: string | null;
  linkedTaskTitle: string | null;
  authorProfileId: string;
  authorName: string;
  authorUsername: string | null;
  authorRole: string;
  score: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote: number;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  locked: boolean;
}

export interface DiscussionCommentSummary {
  id: string;
  postId: string;
  parentId: string | null;
  authorProfileId: string;
  authorName: string;
  authorUsername: string | null;
  authorRole: string;
  body: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  depth: number;
  replies: DiscussionCommentSummary[];
}

export interface DiscussionPostDetail extends DiscussionPostSummary {
  comments: DiscussionCommentSummary[];
}

export interface SavedCommunityItems {
  posts: DiscussionPostSummary[];
  comments: Array<DiscussionCommentSummary & { postSlug: string; postTitle: string }>;
}

function parseTags(value: Value): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function serializeTags(tags: string[]) {
  return JSON.stringify(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8));
}

function excerpt(body: string) {
  return body.length > 220 ? `${body.slice(0, 218).trim()}…` : body;
}

function toTopic(value: string): DiscussionTopic {
  return discussionTopics.includes(value as DiscussionTopic) ? (value as DiscussionTopic) : "meta";
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84) || "discussion";
}

async function uniqueDiscussionSlug(title: string) {
  const base = normalizeSlug(title);
  let slug = base;
  let suffix = 2;
  while (await communityOne("SELECT id FROM discussion_posts WHERE slug = ?", [slug])) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function mapPost(row: CommunityDbRow): DiscussionPostSummary {
  const body = rowString(row, "body");
  const upvotes = rowNumber(row, "upvotes");
  const downvotes = rowNumber(row, "downvotes");
  return {
    id: rowString(row, "id"),
    slug: rowString(row, "slug"),
    title: rowString(row, "title"),
    body,
    excerpt: excerpt(body),
    topic: toTopic(rowString(row, "topic")),
    tags: parseTags(row.tags),
    linkedTaskId: rowNullableString(row, "linkedTaskId"),
    linkedTaskSlug: rowNullableString(row, "linkedTaskSlug"),
    linkedTaskTitle: rowNullableString(row, "linkedTaskTitle"),
    authorProfileId: rowString(row, "authorProfileId"),
    authorName: rowString(row, "authorName"),
    authorUsername: rowNullableString(row, "authorUsername"),
    authorRole: rowString(row, "authorRole"),
    score: upvotes - downvotes,
    upvotes,
    downvotes,
    commentCount: rowNumber(row, "commentCount"),
    userVote: rowNumber(row, "userVote"),
    saved: rowNumber(row, "saved") > 0,
    createdAt: rowString(row, "createdAt"),
    updatedAt: rowString(row, "updatedAt"),
    pinned: rowNumber(row, "pinned") > 0,
    locked: rowNumber(row, "locked") > 0,
  };
}

function mapComment(row: CommunityDbRow): DiscussionCommentSummary {
  const upvotes = rowNumber(row, "upvotes");
  const downvotes = rowNumber(row, "downvotes");
  return {
    id: rowString(row, "id"),
    postId: rowString(row, "postId"),
    parentId: rowNullableString(row, "parentId"),
    authorProfileId: rowString(row, "authorProfileId"),
    authorName: rowString(row, "authorName"),
    authorUsername: rowNullableString(row, "authorUsername"),
    authorRole: rowString(row, "authorRole"),
    body: rowString(row, "body"),
    score: upvotes - downvotes,
    upvotes,
    downvotes,
    userVote: rowNumber(row, "userVote"),
    saved: rowNumber(row, "saved") > 0,
    createdAt: rowString(row, "createdAt"),
    updatedAt: rowString(row, "updatedAt"),
    depth: 0,
    replies: [],
  };
}

export async function listDiscussionPosts(options: { profileId?: string | null; topic?: string | null; sort?: string | null } = {}) {
  const profileId = options.profileId ?? "";
  const topic = options.topic && options.topic !== "all" ? toTopic(options.topic) : null;
  const where = topic ? "WHERE p.topic = ?" : "";
  const args: Value[] = topic ? [profileId, profileId, topic] : [profileId, profileId];
  const order = options.sort === "new" ? "p.createdAt DESC" : options.sort === "comments" ? "commentCount DESC, p.updatedAt DESC" : "p.pinned DESC, score DESC, p.updatedAt DESC";
  const rows = await communityRows(`SELECT p.*, a.name AS authorName, a.username AS authorUsername, a.role AS authorRole, t.slug AS linkedTaskSlug, t.title AS linkedTaskTitle, COALESCE(SUM(CASE WHEN pv.value > 0 THEN pv.value ELSE 0 END), 0) AS upvotes, COALESCE(SUM(CASE WHEN pv.value < 0 THEN ABS(pv.value) ELSE 0 END), 0) AS downvotes, COALESCE(MAX(CASE WHEN pv.profileId = ? THEN pv.value ELSE 0 END), 0) AS userVote, COUNT(DISTINCT c.id) AS commentCount, COUNT(DISTINCT s.id) AS saved, COALESCE(SUM(pv.value), 0) AS score FROM discussion_posts p JOIN profiles a ON a.id = p.authorProfileId LEFT JOIN tasks t ON t.id = p.linkedTaskId LEFT JOIN discussion_post_votes pv ON pv.postId = p.id LEFT JOIN discussion_comments c ON c.postId = p.id LEFT JOIN saved_items s ON s.itemType = 'discussion-post' AND s.itemId = p.id AND s.profileId = ? ${where} GROUP BY p.id ORDER BY ${order} LIMIT 80`, args);
  return rows.map(mapPost);
}

export async function getDiscussionPostBySlug(slug: string, profileId?: string | null): Promise<DiscussionPostDetail | null> {
  const rows = await communityRows(`SELECT p.*, a.name AS authorName, a.username AS authorUsername, a.role AS authorRole, t.slug AS linkedTaskSlug, t.title AS linkedTaskTitle, COALESCE(SUM(CASE WHEN pv.value > 0 THEN pv.value ELSE 0 END), 0) AS upvotes, COALESCE(SUM(CASE WHEN pv.value < 0 THEN ABS(pv.value) ELSE 0 END), 0) AS downvotes, COALESCE(MAX(CASE WHEN pv.profileId = ? THEN pv.value ELSE 0 END), 0) AS userVote, COUNT(DISTINCT c.id) AS commentCount, COUNT(DISTINCT s.id) AS saved FROM discussion_posts p JOIN profiles a ON a.id = p.authorProfileId LEFT JOIN tasks t ON t.id = p.linkedTaskId LEFT JOIN discussion_post_votes pv ON pv.postId = p.id LEFT JOIN discussion_comments c ON c.postId = p.id LEFT JOIN saved_items s ON s.itemType = 'discussion-post' AND s.itemId = p.id AND s.profileId = ? WHERE p.slug = ? GROUP BY p.id`, [profileId ?? "", profileId ?? "", slug]);
  const post = rows[0] ? mapPost(rows[0]) : null;
  if (!post) return null;
  return { ...post, comments: await listDiscussionComments(post.id, profileId) };
}

export async function listDiscussionComments(postId: string, profileId?: string | null) {
  const rows = await communityRows(`SELECT c.*, a.name AS authorName, a.username AS authorUsername, a.role AS authorRole, COALESCE(SUM(CASE WHEN cv.value > 0 THEN cv.value ELSE 0 END), 0) AS upvotes, COALESCE(SUM(CASE WHEN cv.value < 0 THEN ABS(cv.value) ELSE 0 END), 0) AS downvotes, COALESCE(MAX(CASE WHEN cv.profileId = ? THEN cv.value ELSE 0 END), 0) AS userVote, COUNT(DISTINCT s.id) AS saved FROM discussion_comments c JOIN profiles a ON a.id = c.authorProfileId LEFT JOIN discussion_comment_votes cv ON cv.commentId = c.id LEFT JOIN saved_items s ON s.itemType = 'discussion-comment' AND s.itemId = c.id AND s.profileId = ? WHERE c.postId = ? GROUP BY c.id ORDER BY c.createdAt ASC`, [profileId ?? "", profileId ?? "", postId]);
  const byId = new Map(rows.map((row) => [rowString(row, "id"), mapComment(row)]));
  const roots: DiscussionCommentSummary[] = [];
  for (const comment of byId.values()) {
    const parent = comment.parentId ? byId.get(comment.parentId) : null;
    if (parent) {
      comment.depth = Math.min(parent.depth + 1, 6);
      parent.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }
  return roots;
}

export async function createDiscussionPost(input: { profileId: string; title: string; body: string; topic: string; tags: string[]; linkedTaskSlug?: string | null; }) {
  const now = new Date().toISOString();
  const linkedTask = input.linkedTaskSlug ? await communityOne("SELECT id FROM tasks WHERE slug = ?", [normalizeSlug(input.linkedTaskSlug)]) : null;
  const id = randomUUID();
  const slug = await uniqueDiscussionSlug(input.title);
  await communityExecute(`INSERT INTO discussion_posts (id, slug, authorProfileId, title, body, topic, tags, linkedTaskId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, slug, input.profileId, input.title.trim(), input.body.trim(), toTopic(input.topic), serializeTags(input.tags), linkedTask ? rowString(linkedTask, "id") : null, now, now]);
  return { id, slug };
}

export async function createDiscussionComment(input: { profileId: string; postId: string; parentId?: string | null; body: string }) {
  const post = await communityOne("SELECT id, locked FROM discussion_posts WHERE id = ?", [input.postId]);
  if (!post) throw new Error("Discussion post not found.");
  if (rowNumber(post, "locked") > 0) throw new Error("This discussion is locked.");
  if (input.parentId) {
    const parent = await communityOne("SELECT id FROM discussion_comments WHERE id = ? AND postId = ?", [input.parentId, input.postId]);
    if (!parent) throw new Error("Parent comment not found.");
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  await communityExecute(`INSERT INTO discussion_comments (id, postId, parentId, authorProfileId, body, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, input.postId, input.parentId || null, input.profileId, input.body.trim(), now, now]);
  await communityExecute("UPDATE discussion_posts SET updatedAt = ? WHERE id = ?", [now, input.postId]);
  return id;
}

export async function saveDiscussionVote(input: { profileId: string; itemType: "post" | "comment"; itemId: string; value: number }) {
  const value = input.value > 0 ? 1 : input.value < 0 ? -1 : 0;
  const now = new Date().toISOString();
  if (input.itemType === "post") {
    if (value === 0) {
      await communityExecute("DELETE FROM discussion_post_votes WHERE postId = ? AND profileId = ?", [input.itemId, input.profileId]);
      return;
    }
    await communityExecute(`INSERT INTO discussion_post_votes (id, postId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(postId, profileId) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`, [randomUUID(), input.itemId, input.profileId, value, now]);
    return;
  }
  if (value === 0) {
    await communityExecute("DELETE FROM discussion_comment_votes WHERE commentId = ? AND profileId = ?", [input.itemId, input.profileId]);
    return;
  }
  await communityExecute(`INSERT INTO discussion_comment_votes (id, commentId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(commentId, profileId) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`, [randomUUID(), input.itemId, input.profileId, value, now]);
}

export async function toggleSavedItem(profileId: string, itemType: SavableItemType, itemId: string) {
  if (itemType === "ken") throw new Error("Ken saves use the existing Ken bookmark workflow.");
  const existing = await communityOne("SELECT id FROM saved_items WHERE profileId = ? AND itemType = ? AND itemId = ?", [profileId, itemType, itemId]);
  if (existing) {
    await communityExecute("DELETE FROM saved_items WHERE id = ?", [rowString(existing, "id")]);
    return false;
  }
  await communityExecute("INSERT INTO saved_items (id, profileId, itemType, itemId, createdAt) VALUES (?, ?, ?, ?, ?)", [randomUUID(), profileId, itemType, itemId, new Date().toISOString()]);
  return true;
}

export async function getSavedCommunityItems(profileId: string): Promise<SavedCommunityItems> {
  const posts = (await communityRows(`SELECT p.*, a.name AS authorName, a.username AS authorUsername, a.role AS authorRole, t.slug AS linkedTaskSlug, t.title AS linkedTaskTitle, COALESCE(SUM(CASE WHEN pv.value > 0 THEN pv.value ELSE 0 END), 0) AS upvotes, COALESCE(SUM(CASE WHEN pv.value < 0 THEN ABS(pv.value) ELSE 0 END), 0) AS downvotes, COALESCE(MAX(CASE WHEN pv.profileId = ? THEN pv.value ELSE 0 END), 0) AS userVote, COUNT(DISTINCT c.id) AS commentCount, 1 AS saved FROM saved_items s JOIN discussion_posts p ON p.id = s.itemId AND s.itemType = 'discussion-post' JOIN profiles a ON a.id = p.authorProfileId LEFT JOIN tasks t ON t.id = p.linkedTaskId LEFT JOIN discussion_post_votes pv ON pv.postId = p.id LEFT JOIN discussion_comments c ON c.postId = p.id WHERE s.profileId = ? GROUP BY p.id ORDER BY s.createdAt DESC LIMIT 30`, [profileId, profileId])).map(mapPost);
  const comments = (await communityRows(`SELECT c.*, p.slug AS postSlug, p.title AS postTitle, a.name AS authorName, a.username AS authorUsername, a.role AS authorRole, COALESCE(SUM(CASE WHEN cv.value > 0 THEN cv.value ELSE 0 END), 0) AS upvotes, COALESCE(SUM(CASE WHEN cv.value < 0 THEN ABS(cv.value) ELSE 0 END), 0) AS downvotes, COALESCE(MAX(CASE WHEN cv.profileId = ? THEN cv.value ELSE 0 END), 0) AS userVote, 1 AS saved FROM saved_items s JOIN discussion_comments c ON c.id = s.itemId AND s.itemType = 'discussion-comment' JOIN discussion_posts p ON p.id = c.postId JOIN profiles a ON a.id = c.authorProfileId LEFT JOIN discussion_comment_votes cv ON cv.commentId = c.id WHERE s.profileId = ? GROUP BY c.id ORDER BY s.createdAt DESC LIMIT 30`, [profileId, profileId])).map((row) => ({ ...mapComment(row), postSlug: rowString(row, "postSlug"), postTitle: rowString(row, "postTitle") }));
  return { posts, comments };
}
