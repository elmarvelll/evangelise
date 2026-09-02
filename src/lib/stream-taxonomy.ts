/**
 * Category and genre are two distinct concepts for a livestream — e.g.
 * category "Music" with genre "Worship". Both are Prisma enums
 * (`StreamCategory`/`StreamGenre` in prisma/schema.prisma) rather than
 * database-backed tables: there is no admin UI in this app to manage a
 * dynamic taxonomy, and a fixed set of values is exactly what an enum is
 * for — adding a new one is a migration, the same way adding a new
 * `livestream_status` value already is.
 *
 * This file is the ONE place the human-readable label list lives — the
 * Prisma enum is the source of truth for which values are valid, this
 * module is the source of truth for what the frontend renders. Keep the
 * two in sync: adding a value here without adding it to the enum (or vice
 * versa) is a bug.
 */
import type { StreamCategory, StreamGenre } from "@prisma/client";

export const STREAM_CATEGORIES: StreamCategory[] = [
  "Music",
  "Ministry",
  "Teaching",
  "Discussion",
  "Prayer",
  "Gospel",
  "Other",
];

export const STREAM_GENRES: StreamGenre[] = [
  "Ministering",
  "Worship",
  "Prayer",
  "BibleStudy",
  "Teaching",
  "Testimony",
  "GospelMusic",
  "Evangelism",
  "Fellowship",
  "Other",
];

const CATEGORY_LABELS: Record<StreamCategory, string> = {
  Music: "Music",
  Ministry: "Ministry",
  Teaching: "Teaching",
  Discussion: "Discussion",
  Prayer: "Prayer",
  Gospel: "Gospel",
  Other: "Other",
};

const GENRE_LABELS: Record<StreamGenre, string> = {
  Ministering: "Ministering",
  Worship: "Worship",
  Prayer: "Prayer",
  BibleStudy: "Bible Study",
  Teaching: "Teaching",
  Testimony: "Testimony",
  GospelMusic: "Gospel Music",
  Evangelism: "Evangelism",
  Fellowship: "Fellowship",
  Other: "Other",
};

export function isStreamCategory(value: unknown): value is StreamCategory {
  return typeof value === "string" && (STREAM_CATEGORIES as string[]).includes(value);
}

export function isStreamGenre(value: unknown): value is StreamGenre {
  return typeof value === "string" && (STREAM_GENRES as string[]).includes(value);
}

export function getCategoryLabel(category: StreamCategory): string {
  return CATEGORY_LABELS[category];
}

export function getGenreLabel(genre: StreamGenre): string {
  return GENRE_LABELS[genre];
}
