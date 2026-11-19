// Booking reference numbers: ASHE-001, ASHE-002, ... One counter for the whole site, kept with the job board's data.
// The booking form asks for the next number just before it sends, so the number is in the email.
import { getStore } from "@netlify/blobs";

export async function nextRef(store) {
  for (let tries = 0; tries < 5; tries++) {
    const cur = await store.getWithMetadata("counter", { type: "json" });
    const n = ((cur?.data?.n) || 0) + 1;
    // Only write if nobody else took this number in the meantime (two bookings at the same moment).
    const res = cur ? await store.setJSON("counter", { n }, { onlyIfMatch: cur.etag }) : await store.setJSON("counter", { n }, { onlyIfNew: true });
    if (res?.modified !== false) return "ASHE-" + String(n).padStart(3, "0");
  }
  return "ASHE-" + Date.now().toString(36).toUpperCase();   // very unlikely: still unique
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const ref = await nextRef(getStore({ name: "board", consistency: "strong" }));
  return Response.json({ ref });
};
export const config = { path: "/api/next-ref" };
