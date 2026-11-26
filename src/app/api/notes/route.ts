import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

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

function readLimit(request: Request): number {
  const raw = Number(new URL(request.url).searchParams.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(raw), MAX_LIMIT);
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, body, created_at, author_id")
    .order("created_at", { ascending: false })
    .limit(readLimit(request));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ notes: data });
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
