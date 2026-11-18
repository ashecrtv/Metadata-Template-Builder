// The job board's data: your jobs, plus booking requests the form has saved (see submission-created.mjs).
// Locked with a passcode you set in Netlify → Project configuration → Environment variables → BOARD_KEY.
// Without the passcode nobody can read or change anything, even though board.html itself is public.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const key = process.env.BOARD_KEY;
  if (!key) return Response.json({ error: "setup" }, { status: 503 });
  if (req.headers.get("x-board-key") !== key) return Response.json({ error: "locked" }, { status: 401 });
  const store = getStore("board");
  if (req.method === "GET") {
    const data = (await store.get("data", { type: "json" })) || { jobs: [], seen: [] };
    const { blobs } = await store.list({ prefix: "inbox/" });
    const bookings = await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })));
    return Response.json({ ...data, bookings: bookings.filter(Boolean) });
  }
  if (req.method === "PUT") {
    const body = await req.json();
    if (!Array.isArray(body.jobs)) return new Response("Bad data", { status: 400 });
    await store.setJSON("data", { jobs: body.jobs, seen: body.seen || [] });
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
};
export const config = { path: "/api/jobs" };
