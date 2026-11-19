// Add-only door to the job board: the builder saves a template here without the passcode.
// It can create a job or fill in a job's blank fields and attach templates. It can't read, list, change or delete anything else.
import { getStore } from "@netlify/blobs";
import { nextRef } from "./next-ref.mjs";

const same = (x, y) => String(x || "").trim().toLowerCase() === String(y || "").trim().toLowerCase();
const str = v => String(v ?? "").slice(0, 2000);
const FILL = ["type", "name", "org", "date", "venue", "address", "city", "state", "subjects", "keywords", "photographer", "crew"];

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  if (raw.length > 3_000_000) return new Response("Too large", { status: 413 });
  let b; try { b = JSON.parse(raw); } catch (e) { return new Response("Bad data", { status: 400 }); }
  const fill = b.fill || {}, want = { date: str(fill.date), org: str(fill.org), name: str(fill.name) };
  if (!b.xmp?.name || !b.xmp?.text || !want.date) return new Response("Bad data", { status: 400 });

  const store = getStore({ name: "board", consistency: "strong" });
  const data = (await store.get("data", { type: "json" })) || { jobs: [], seen: [] };
  const jobs = data.jobs || [], seen = data.seen || [];
  let j = jobs.find(x => same(x.date, want.date) && same(x.org, want.org) && (!want.name || !x.name || same(x.name, want.name)));
  if (b.draft && j && j.xmp) return Response.json({ ok: true, kept: true, name: j.name || j.org });   // never overwrite a template that's already there
  if (!j) {   // a booking waiting in the inbox becomes the job, with its contact details
    const { blobs } = await store.list({ prefix: "inbox/" });
    let bk = null;
    for (const x of blobs) { const v = await store.get(x.key, { type: "json" }); if (v && !seen.includes(v.sub) && same(v.date, want.date) && same(v.org, want.org)) { bk = v; break; } }
    j = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: "Requested", created: new Date().toISOString() };
    if (bk) {
      Object.assign(j, { sub: bk.sub, name: bk.event_name || "", contact: bk.name || "", email: bk.email || "", phone: bk.phone || "", department: bk.department || "",
        start: bk.start || "", end: bk.end || "", duration: bk.duration || "", coverage: bk.coverage || "", deadline: bk.deadline || "", usage: bk.usage || "",
        shotlist: bk.shotlist || "", notes: bk.notes || "", theme: bk.theme || "", dayof: [bk.dayof_name, bk.dayof_phone].filter(Boolean).join(" · ") });
      for (const k of ["type", "venue", "address", "city", "state", "subjects", "keywords", "photographer"]) if (bk[k]) j[k] = str(bk[k]);
      seen.push(bk.sub);
    }
    if (!j.ref) j.ref = (bk && bk.ref) || await nextRef(store);
    jobs.push(j);
  }
  for (const k of FILL) if (fill[k] && !String(j[k] || "").trim()) j[k] = str(fill[k]);   // only blanks: what the booking or you typed stays
  j.xmp = { name: str(b.xmp.name), text: String(b.xmp.text).slice(0, 500000) };
  j.draft = !!b.draft;
  if (b.filename) j.filename = str(b.filename);
  const crew = (Array.isArray(b.crewFiles) ? b.crewFiles : []).slice(0, 20).map(c => ({ name: str(c.name), xmp: { name: str(c.xmp?.name), text: String(c.xmp?.text || "").slice(0, 500000) }, filename: str(c.filename) }));
  if (crew.length) j.crewFiles = [...(j.crewFiles || []).filter(x => !crew.some(c => c.name === x.name)), ...crew];
  await store.setJSON("data", { jobs, seen });
  return Response.json({ ok: true, name: j.name || j.org, crew: (j.crewFiles || []).map(c => c.name) });
};
export const config = { path: "/api/jobs-add" };
