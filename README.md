# rls-next-starter

A small Next.js App Router starter wired to Supabase where **row level security is the
authorization layer**, not an afterthought. Notes are public to signed-in users; only the
author can insert, edit, or delete their own rows. No API route does permission checks by hand.

I put this together for demos and workshops: it is small enough to read in one sitting and
opinionated enough to copy into a real project.

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- The Supabase SQL editor, or the Supabase CLI if you prefer migrations

## Install

```bash
git clone https://github.com/xi6dxo8sl5/rls-next-starter
cd rls-next-starter
npm install
cp .env.example .env.local   # fill in the two values below
npm run dev
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Then paste `db/schema.sql` into the SQL editor and run it once. It creates the `profiles`
and `notes` tables, enables RLS, adds the policies, and installs the trigger that mirrors new
`auth.users` rows into `profiles`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xi6dxo8sl5/rls-next-starter)

## Usage

- `GET /api/notes?limit=20` returns the newest notes visible to the caller.
- `POST /api/notes` with `{"title": "...", "body": "..."}` inserts a note for the signed-in user.
- The browser client in `src/lib/supabase/client.ts` is for authenticated components and
  optional realtime subscriptions; the server client reads the session cookie.

Because every policy compares against `auth.uid()`, a leaked anon key is not enough to write
to another user's rows.

## Layout

```
db/schema.sql                 tables, RLS policies, profile trigger
src/lib/supabase/client.ts    browser client factory
src/lib/supabase/server.ts    server client bound to request cookies
src/app/api/notes/route.ts    GET/POST handler that relies on RLS
```

## Notes on the policies

- `select` is open to `authenticated` only, so the anon role sees nothing.
- `insert`/`update`/`delete` on `notes` check `author_id = auth.uid()`.
- `profiles` is readable by signed-in users and writable only by its owner.
- Handles are generated as `user_<id prefix>`; rename them in the trigger if you want
  something friendlier.

## License

MIT, see `LICENSE`.
