// Add-only door to the job board: the builder saves a template here without the passcode.
// It can create a job, fill in a job's blank fields, and add a template or crew template where there is none.
// It never replaces anything already there, and its reply never repeats board data.
import { boardStore, updateBoard, nextRef, bookingToJob } from "../lib/board.mjs";

const same = (x, y) => String(x || "").trim().toLowerCase() === String(y || "").trim().toLowerCase();
const str = v => String(v ?? "").slice(0, 2000);
const FILL = ["type", "name", "org", "date", "venue", "address", "city", "state", "subjects", "keywords", "photographer", "crew"];
const MAX_JOBS = 2000, MAX_NEW_PER_HOUR = 20, MAX_XMP = 200_000;

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  if (raw.length > 1_500_000) return new Response("Too large", { status: 413 });
  let b; try { b = JSON.parse(raw); } catch (e) { return new Response("Bad data", { status: 400 }); }
  const fill = b.fill || {}, want = { date: str(fill.date), org: str(fill.org), name: str(fill.name) };
  if (!b.xmp?.name || !b.xmp?.text || !/^\d{4}-\d{2}-\d{2}$/.test(want.date) || !want.org) return new Response("Bad data", { status: 400 });
  if (String(b.xmp.text).length > MAX_XMP) return new Response("Too large", { status: 413 });

  const store = boardStore();
  // The booking waiting in the inbox for this date and client (only unseen ones are fetched, in parallel).
  const findBooking = async (seen) => {
    const { blobs } = await store.list({ prefix: "inbox/" });
    const keys = blobs.map(x => x.key).filter(k => !seen.includes(k.slice(6))).slice(-200);
    const all = await Promise.all(keys.map(k => store.get(k, { type: "json" }).catch(() => null)));
    return all.find(v => v && same(v.date, want.date) && same(v.org, want.org) && (!want.name || same(v.event_name, want.name))) || null;
  };
  let ref = "", jobId = "", kept = false;   // reserved once, so a retry doesn't burn an extra ASHE number
  try {
    const out = await updateBoard(store, async data => {
      const { jobs, seen } = data;
      let j = jobs.find(x => !x.archived && same(x.date, want.date) && same(x.org, want.org) && (want.name ? same(x.name, want.name) : !x.name));
      if (!j) {
        const hour = Date.now() - 3600e3;
        if (jobs.length >= MAX_JOBS || jobs.filter(x => x.via === "open" && Date.parse(x.created) > hour).length >= MAX_NEW_PER_HOUR) return { full: true, skipWrite: true };
        const bk = await findBooking(seen);
        j = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: "Requested", created: new Date().toISOString(), via: "open", ...(bk ? bookingToJob(bk) : {}) };
        if (bk) seen.push(bk.sub);
        if (!j.ref) j.ref = ref || (ref = await nextRef(store));
        jobs.push(j);
      }
      jobId = j.id; kept = !!j.xmp;
      for (const k of FILL) if (fill[k] && !String(j[k] || "").trim()) j[k] = str(fill[k]);   // only blanks
      if (!j.xmp) { j.xmp = { name: str(b.xmp.name), text: String(b.xmp.text) }; j.draft = !!b.draft; if (b.filename && !j.filename) j.filename = str(b.filename); }   // never replaces a template
      const have = new Set((j.crewFiles || []).map(c => c.name));
      const crew = (Array.isArray(b.crewFiles) ? b.crewFiles : []).slice(0, 12).filter(c => c?.name && !have.has(str(c.name)) && String(c.xmp?.text || "").length <= MAX_XMP)
        .map(c => ({ name: str(c.name), xmp: { name: str(c.xmp?.name), text: String(c.xmp?.text || "") }, filename: str(c.filename) }));
      if (crew.length) j.crewFiles = [...(j.crewFiles || []), ...crew];
      return {};
    });
    if (out?.full) return new Response("Busy, try later", { status: 429 });
    return Response.json({ ok: true, id: jobId, kept });
  } catch (e) { return new Response("Busy, try again", { status: 503 }); }
};
export const config = { path: "/api/jobs-add" };
