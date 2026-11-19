// The job board's data: your jobs, plus booking requests the form has saved (see submission-created.mjs).
// Locked with a passcode you set in Netlify → Project configuration → Environment variables → BOARD_KEY.
// Without the passcode nobody can read or change anything, even though board.html itself is public.
// Saves carry the version they started from ("base"); if someone else saved in between, the save is refused (409)
// with the current data, and the page merges its own changes in and tries again, so nothing is overwritten.
import { boardStore, readBoard, writeBoard } from "../lib/board.mjs";

export default async (req) => {
  const key = process.env.BOARD_KEY;
  if (!key) return Response.json({ error: "setup" }, { status: 503 });
  if (req.headers.get("x-board-key") !== key) return Response.json({ error: "locked" }, { status: 401 });
  const store = boardStore();
  if (req.method === "GET") {
    const { data, etag } = await readBoard(store);
    const seen = new Set(data.seen || []);
    const { blobs } = await store.list({ prefix: "inbox/" });
    const keys = blobs.map(b => b.key).filter(k => !seen.has(k.slice(6)));   // only bookings not on the board yet
    const bookings = await Promise.all(keys.map(k => store.get(k, { type: "json" }).catch(() => null)));
    return Response.json({ ...data, etag, bookings: bookings.filter(Boolean) });
  }
  if (req.method === "PUT") {
    const body = await req.json();
    if (Number.isInteger(body.counter) && body.counter >= 0 && !body.jobs) { await store.setJSON("counter", { n: body.counter }); return Response.json({ ok: true }); }   // owner only: reset the ASHE number
    if (!Array.isArray(body.jobs)) return new Response("Bad data", { status: 400 });
    const cur = await readBoard(store);
    if (body.base !== undefined && body.base !== cur.etag) return Response.json({ conflict: true, ...cur.data, etag: cur.etag }, { status: 409 });
    if (!(await writeBoard(store, { jobs: body.jobs, seen: body.seen || [] }, cur.etag))) {
      const now = await readBoard(store); return Response.json({ conflict: true, ...now.data, etag: now.etag }, { status: 409 });
    }
    const after = await readBoard(store);
    return Response.json({ ok: true, etag: after.etag });
  }
  return new Response("Method not allowed", { status: 405 });
};
export const config = { path: "/api/jobs" };
