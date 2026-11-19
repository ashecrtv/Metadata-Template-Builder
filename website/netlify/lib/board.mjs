// Shared by the job board's functions: safe read/write of the board data, booking → job, ASHE numbers.
import { getStore } from "@netlify/blobs";

export const boardStore = () => getStore({ name: "board", consistency: "strong" });

// Read the board with its version tag, so a write can refuse if someone else saved in between.
export async function readBoard(store) {
  const r = await store.getWithMetadata("data", { type: "json" });
  return { data: r?.data || { jobs: [], seen: [] }, etag: r?.etag || null };
}
// Write only if the board is still the version we read. Returns false if it changed (caller re-reads and retries).
export async function writeBoard(store, data, etag) {
  const r = etag ? await store.setJSON("data", data, { onlyIfMatch: etag }) : await store.setJSON("data", data, { onlyIfNew: true });
  return r?.modified !== false;
}
// Read → change → write, retrying when another save landed in between.
export async function updateBoard(store, change) {
  for (let i = 0; i < 6; i++) {
    const { data, etag } = await readBoard(store);
    data.jobs = data.jobs || []; data.seen = data.seen || [];
    const out = await change(data);
    if (out?.skipWrite) return out;
    if (await writeBoard(store, data, etag)) return out;
  }
  throw new Error("busy");
}

export async function nextRef(store) {
  for (let tries = 0; tries < 6; tries++) {
    const cur = await store.getWithMetadata("counter", { type: "json" });
    const n = ((cur?.data?.n) || 0) + 1;
    const res = cur ? await store.setJSON("counter", { n }, { onlyIfMatch: cur.etag }) : await store.setJSON("counter", { n }, { onlyIfNew: true });
    if (res?.modified !== false) return "ASHE-" + String(n).padStart(3, "0");
  }
  return "ASHE-" + Date.now().toString(36).toUpperCase();   // very unlikely: still unique
}

const str = v => String(v ?? "").slice(0, 2000);
// A booking request → job fields (same mapping the board uses), including the attached PDF and the themed event.
export function bookingToJob(bk) {
  const j = { sub: bk.sub, ref: str(bk.ref), name: str(bk.event_name), contact: str(bk.name), email: str(bk.email), phone: str(bk.phone), department: str(bk.department),
    start: str(bk.start), end: str(bk.end), duration: str(bk.duration), coverage: str(bk.coverage), deadline: str(bk.deadline), usage: str(bk.usage),
    shotlist: str(bk.shotlist), notes: str(bk.notes), theme: str(bk.theme), dayof: [bk.dayof_name, bk.dayof_phone].filter(Boolean).join(" · ") };
  for (const k of ["type", "org", "date", "venue", "address", "city", "state", "subjects", "keywords", "photographer"]) if (bk[k]) j[k] = str(bk[k]);
  const pdf = bk.team_pdf?.url || (typeof bk.team_pdf === "string" && /^https?:/.test(bk.team_pdf) ? bk.team_pdf : "");
  if (pdf) j.notes = [j.notes, "Attached PDF: " + pdf].filter(Boolean).join("\n");
  return j;
}
