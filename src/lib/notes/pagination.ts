export type NoteRow = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  author_id: string;
};

export type NoteCursor = { id: number; createdAt: string };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function readLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export function encodeCursor(note: Pick<NoteRow, "id" | "created_at">): string {
  return Buffer.from(`${note.created_at}|${note.id}`, "utf8").toString("base64url");
}

export function decodeCursor(raw: string | null): NoteCursor | null {
  if (!raw) return null;

  const [createdAt, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
  const parsedId = Number(id);
  if (!createdAt || Number.isNaN(Date.parse(createdAt)) || !Number.isInteger(parsedId)) {
    return null;
  }

  return { id: parsedId, createdAt };
}

/**
 * PostgREST filter for keyset pagination over `order by created_at desc, id desc`.
 * Ties on created_at fall back to the id so a page boundary cannot repeat a row.
 */
export function afterFilter(cursor: NoteCursor | null): string | null {
  if (!cursor) return null;
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}
