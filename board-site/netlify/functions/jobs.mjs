// Saves the board (jobs + which bookings were already pulled in) in this site's Netlify Blobs store.
// The board site sits behind Netlify team login, so only you can reach it.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("board");
  if (req.method === "GET") return Response.json((await store.get("data", { type: "json" })) || { jobs: [], seen: [] });
  if (req.method === "PUT") {
    const body = await req.json();
    if (!Array.isArray(body.jobs)) return new Response("Bad data", { status: 400 });
    await store.setJSON("data", { jobs: body.jobs, seen: body.seen || [] });
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
};
export const config = { path: "/api/jobs" };
