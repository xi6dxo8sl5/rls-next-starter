import type { SupabaseClient } from "@supabase/supabase-js";

import {
  afterFilter,
  decodeCursor,
  encodeCursor,
  readLimit,
  type NoteRow,
} from "./pagination";

const COLUMNS = "id, title, body, created_at, author_id";

export type Feed = {
  notes: NoteRow[];
  nextCursor: string | null;
};

/**
 * Keyset page over the notes feed, newest first. One row past the requested limit is
 * fetched so the caller learns whether another page exists without serving an empty one.
 */
export async function listNotes(
  supabase: SupabaseClient,
  params: { cursor: string | null; limit: string | null },
): Promise<Feed> {
  const limit = readLimit(params.limit);
  const after = afterFilter(decodeCursor(params.cursor));

  let query = supabase
    .from("notes")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (after) {
    query = query.or(after);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as NoteRow[];
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return {
    notes: page,
    nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
  };
}
