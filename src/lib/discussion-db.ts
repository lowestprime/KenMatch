import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import { createClient, type Client, type Value } from "@libsql/client";

import { ensureDatabaseReady } from "@/lib/db";
import { env } from "@/lib/env";

export type DiscussionTargetType = "post" | "comment";
export type SavedItemType = "ken" | "discussion_post" | "discussion_comment";

export interface DiscussionPostSummary {
  id: string;
  slug: string;
  profileId: string;
  profileName: string;
  profileUsername: string | null;
  title: string;
  bodyMarkdown: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  commentCount: number;
  userVote: number;
  saved: boolean;
}

export interface DiscussionCommentSummary {
  id: string;
  postId: string;
  profileId: string;
  profileName: string;
  profileUsername: string | null;
  parentId: string | null;
  bodyMarkdown: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  userVote: number;
  saved: boolean;
  replies: DiscussionCommentSummary[];
}

export interface DiscussionDetail extends DiscussionPostSummary {
  comments: DiscussionCommentSummary[];
}

export interface SavedDiscussionItem {
  id: string;
  itemType: SavedItemType;
  itemId: string;
  title: string;
  subtitle: string;
  url: string;
  createdAt: string;
}

type DbRow = Record<string, Value>;

const databaseFilePath = isAbsolute(env.KENMATCH_DB_FILE)
  ? env.KENMATCH_DB_FILE
  : join(process.cwd(), env.KENMATCH_DB_FILE);
const databaseUrl = env.DATABASE_URL?.trim() || `file:${databaseFilePath.replace(/\\/g, "/")}`;

declare global {
  var __kenmatchDiscussionDbClient: Client | undefined;
  var __kenmatchDiscussionDbReady: Promise<void> | undefined;
}

function ensureDatabaseDirectory() {
  if (!databaseUrl.startsWith("file:")) return;
  const directory = dirname(databaseFilePath);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
}

function getClient() {
  if (!globalThis.__kenmatchDiscussionDbClient) {
    ensureDatabaseDirectory();
    globalThis.__kenmatchDiscussionDbClient = createClient({
      url: databaseUrl,
      authToken: env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return globalThis.__kenmatchDiscussionDbClient;
}

async function ensureDiscussionSchema() {
  if (!globalThis.__kenmatchDiscussionDbReady) {
    globalThis.__kenmatchDiscussionDbReady = (async () => {
      await ensureDatabaseReady();
      const client = getClient();
      await client.batch(
        [
          `CREATE TABLE IF NOT EXISTS discussion_posts (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            profileId TEXT NOT NULL,
            title TEXT NOT NULL,
            bodyMarkdown TEXT NOT NULL,
            topic TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`,
          `CREATE TABLE IF NOT EXISTS discussion_comments (
            id TEXT PRIMARY KEY,
            postId TEXT NOT NULL,
            profileId TEXT NOT NULL,
            parentId TEXT,
            bodyMarkdown TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`,
          `CREATE TABLE IF NOT EXISTS discussion_votes (
            id TEXT PRIMARY KEY,
            targetType TEXT NOT NULL,
            targetId TEXT NOT NULL,
            profileId TEXT NOT NULL,
            value INTEGER NOT NULL,
            updatedAt TEXT NOT NULL,
            UNIQUE(targetType, targetId, profileId)
          )`,
          `CREATE TABLE IF NOT EXISTS saved_items (
            id TEXT PRIMARY KEY,
            profileId TEXT NOT NULL,
            itemType TEXT NOT NULL,
            itemId TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            UNIQUE(profileId, itemType, itemId)
          )`,
          "CREATE INDEX IF NOT EXISTS idx_discussion_posts_createdAt ON discussion_posts(createdAt)",
          "CREATE INDEX IF NOT EXISTS idx_discussion_posts_topic ON discussion_posts(topic)",
          "CREATE INDEX IF NOT EXISTS idx_discussion_comments_postId ON discussion_comments(postId)",
          "CREATE INDEX IF NOT EXISTS idx_discussion_comments_parentId ON discussion_comments(parentId)",
          "CREATE INDEX IF NOT EXISTS idx_discussion_votes_target ON discussion_votes(targetType, targetId)",
          "CREATE INDEX IF NOT EXISTS idx_saved_items_profile ON saved_items(profileId, itemType, createdAt)",
        ],
        "write",
      );
    })();
  }
  await globalThis.__kenmatchDiscussionDbReady;
}

async function execute(sql: string, args: Value[] = []) {
  await ensureDiscussionSchema();
  return getClient().execute({ sql, args });
}

async function rows(sql: string, args: Value[] = []) {
  const result = await execute(sql, args);
  return result.rows as DbRow[];
}

async function one(sql: string, args: Value[] = []) {
  const result = await rows(sql, args);
  return result[0] ?? null;
}

function getString(row: DbRow, key: string) {
  const value = row[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

function getNullableString(row: DbRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? null : getString(row, key);
}

function getNumber(row: DbRow, key: string) {
  const value = row[key];
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "discussion";
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  for (let index = 0; index < 50; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await one("SELECT id FROM discussion_posts WHERE slug = ?", [slug]);
    if (!existing) return slug;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function mapPost(row: DbRow): DiscussionPostSummary {
  return {
    id: getString(row, "id"),
    slug: getString(row, "slug"),
    profileId: getString(row, "profileId"),
    profileName: getString(row, "profileName"),
    profileUsername: getNullableString(row, "profileUsername"),
    title: getString(row, "title"),
    bodyMarkdown: getString(row, "bodyMarkdown"),
    topic: getString(row, "topic"),
    createdAt: getString(row, "createdAt"),
    updatedAt: getString(row, "updatedAt"),
    score: getNumber(row, "score"),
    commentCount: getNumber(row, "commentCount"),
    userVote: getNumber(row, "userVote"),
    saved: getNumber(row, "saved") > 0,
  };
}

function mapComment(row: DbRow): DiscussionCommentSummary {
  return {
    id: getString(row, "id"),
    postId: getString(row, "postId"),
    profileId: getString(row, "profileId"),
    profileName: getString(row, "profileName"),
    profileUsername: getNullableString(row, "profileUsername"),
    parentId: getNullableString(row, "parentId"),
    bodyMarkdown: getString(row, "bodyMarkdown"),
    createdAt: getString(row, "createdAt"),
    updatedAt: getString(row, "updatedAt"),
    score: getNumber(row, "score"),
    userVote: getNumber(row, "userVote"),
    saved: getNumber(row, "saved") > 0,
    replies: [],
  };
}

const postSelect = `
  SELECT
    p.*,
    pr.name AS profileName,
    pr.username AS profileUsername,
    COALESCE((SELECT SUM(value) FROM discussion_votes WHERE targetType = 'post' AND targetId = p.id), 0) AS score,
    COALESCE((SELECT COUNT(*) FROM discussion_comments WHERE postId = p.id), 0) AS commentCount,
    COALESCE((SELECT value FROM discussion_votes WHERE targetType = 'post' AND targetId = p.id AND profileId = ?), 0) AS userVote,
    COALESCE((SELECT COUNT(*) FROM saved_items WHERE itemType = 'discussion_post' AND itemId = p.id AND profileId = ?), 0) AS saved
  FROM discussion_posts p
  JOIN profiles pr ON pr.id = p.profileId
`;

export async function listDiscussionPosts({
  profileId,
  query,
  topic,
  sort = "hot",
}: {
  profileId?: string | null;
  query?: string;
  topic?: string;
  sort?: "hot" | "new" | "comments" | "saved";
}) {
  const viewerId = profileId ?? "";
  const where: string[] = [];
  const args: Value[] = [viewerId, viewerId];
  if (query?.trim()) {
    where.push("(p.title LIKE ? OR p.bodyMarkdown LIKE ? OR p.topic LIKE ?)");
    const like = `%${query.trim()}%`;
    args.push(like, like, like);
  }
  if (topic?.trim()) {
    where.push("p.topic = ?");
    args.push(topic.trim());
  }
  if (sort === "saved" && profileId) {
    where.push("EXISTS (SELECT 1 FROM saved_items WHERE profileId = ? AND itemType = 'discussion_post' AND itemId = p.id)");
    args.push(profileId);
  }
  const orderBy = sort === "new"
    ? "p.createdAt DESC"
    : sort === "comments"
      ? "commentCount DESC, p.updatedAt DESC"
      : "score DESC, commentCount DESC, p.updatedAt DESC";
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return (await rows(`${postSelect} ${whereSql} ORDER BY ${orderBy} LIMIT 80`, args)).map(mapPost);
}

export async function getDiscussionPost(slug: string, profileId?: string | null): Promise<DiscussionDetail | null> {
  const viewerId = profileId ?? "";
  const postRow = await one(`${postSelect} WHERE p.slug = ?`, [viewerId, viewerId, slug]);
  if (!postRow) return null;
  const post = mapPost(postRow);
  const commentRows = await rows(
    `SELECT
      c.*,
      pr.name AS profileName,
      pr.username AS profileUsername,
      COALESCE((SELECT SUM(value) FROM discussion_votes WHERE targetType = 'comment' AND targetId = c.id), 0) AS score,
      COALESCE((SELECT value FROM discussion_votes WHERE targetType = 'comment' AND targetId = c.id AND profileId = ?), 0) AS userVote,
      COALESCE((SELECT COUNT(*) FROM saved_items WHERE itemType = 'discussion_comment' AND itemId = c.id AND profileId = ?), 0) AS saved
    FROM discussion_comments c
    JOIN profiles pr ON pr.id = c.profileId
    WHERE c.postId = ?
    ORDER BY c.createdAt ASC`,
    [viewerId, viewerId, post.id],
  );
  const comments = commentRows.map(mapComment);
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const roots: DiscussionCommentSummary[] = [];
  for (const comment of comments) {
    const parent = comment.parentId ? byId.get(comment.parentId) : null;
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  }
  return { ...post, comments: roots };
}

export async function createDiscussionPost(input: { profileId: string; title: string; bodyMarkdown: string; topic: string }) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const slug = await uniqueSlug(input.title);
  await execute(
    "INSERT INTO discussion_posts (id, slug, profileId, title, bodyMarkdown, topic, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, slug, input.profileId, input.title, input.bodyMarkdown, input.topic, now, now],
  );
  return { id, slug };
}

export async function createDiscussionComment(input: { profileId: string; postId: string; parentId?: string | null; bodyMarkdown: string }) {
  const now = new Date().toISOString();
  const id = randomUUID();
  await execute(
    "INSERT INTO discussion_comments (id, postId, profileId, parentId, bodyMarkdown, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, input.postId, input.profileId, input.parentId ?? null, input.bodyMarkdown, now, now],
  );
  await execute("UPDATE discussion_posts SET updatedAt = ? WHERE id = ?", [now, input.postId]);
  return id;
}

export async function saveDiscussionVote(input: { profileId: string; targetType: DiscussionTargetType; targetId: string; value: -1 | 0 | 1 }) {
  if (input.value === 0) {
    await execute("DELETE FROM discussion_votes WHERE targetType = ? AND targetId = ? AND profileId = ?", [input.targetType, input.targetId, input.profileId]);
    return;
  }
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO discussion_votes (id, targetType, targetId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(targetType, targetId, profileId) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    [randomUUID(), input.targetType, input.targetId, input.profileId, input.value, now],
  );
}

export async function toggleSavedItem(input: { profileId: string; itemType: SavedItemType; itemId: string }) {
  const existing = await one("SELECT id FROM saved_items WHERE profileId = ? AND itemType = ? AND itemId = ?", [input.profileId, input.itemType, input.itemId]);
  if (existing) {
    await execute("DELETE FROM saved_items WHERE id = ?", [getString(existing, "id")]);
    return false;
  }
  await execute(
    "INSERT INTO saved_items (id, profileId, itemType, itemId, createdAt) VALUES (?, ?, ?, ?, ?)",
    [randomUUID(), input.profileId, input.itemType, input.itemId, new Date().toISOString()],
  );
  return true;
}

export async function listSavedDiscussionItems(profileId: string): Promise<SavedDiscussionItem[]> {
  const postItems = (await rows(
    `SELECT s.id, s.itemType, s.itemId, s.createdAt, p.title, p.topic, p.slug
     FROM saved_items s
     JOIN discussion_posts p ON p.id = s.itemId
     WHERE s.profileId = ? AND s.itemType = 'discussion_post'
     ORDER BY s.createdAt DESC`,
    [profileId],
  )).map((row) => ({
    id: getString(row, "id"),
    itemType: "discussion_post" as SavedItemType,
    itemId: getString(row, "itemId"),
    title: getString(row, "title"),
    subtitle: `Discussion post · ${getString(row, "topic")}`,
    url: `/discuss/${getString(row, "slug")}`,
    createdAt: getString(row, "createdAt"),
  }));

  const commentItems = (await rows(
    `SELECT s.id, s.itemType, s.itemId, s.createdAt, c.bodyMarkdown, p.title, p.slug
     FROM saved_items s
     JOIN discussion_comments c ON c.id = s.itemId
     JOIN discussion_posts p ON p.id = c.postId
     WHERE s.profileId = ? AND s.itemType = 'discussion_comment'
     ORDER BY s.createdAt DESC`,
    [profileId],
  )).map((row) => ({
    id: getString(row, "id"),
    itemType: "discussion_comment" as SavedItemType,
    itemId: getString(row, "itemId"),
    title: getString(row, "bodyMarkdown").slice(0, 96),
    subtitle: `Comment on ${getString(row, "title")}`,
    url: `/discuss/${getString(row, "slug")}#comment-${getString(row, "itemId")}`,
    createdAt: getString(row, "createdAt"),
  }));

  return [...postItems, ...commentItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
