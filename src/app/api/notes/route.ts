import { NextResponse } from "next/server";

import { listNotes } from "@/lib/notes/feed";
import { createClient } from "@/lib/supabase/server";

type NoteInput = { title: string; body: string };

function parseNote(value: unknown): NoteInput | null {
  if (typeof value !== "object" || value === null) return null;

  const { title, body } = value as Record<string, unknown>;
  if (typeof title !== "string") return null;

  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return null;
  if (body !== undefined && typeof body !== "string") return null;

  return { title: trimmed, body: typeof body === "string" ? body : "" };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();

  try {
    const feed = await listNotes(supabase, {
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit"),
    });
    return NextResponse.json(feed);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const input = parseNote(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "title of 1-120 characters is required" }, { status: 422 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "sign in first" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({ ...input, author_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
