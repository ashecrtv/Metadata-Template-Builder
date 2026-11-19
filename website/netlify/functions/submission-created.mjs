// Netlify runs this by itself after each verified form submission (the name is what triggers it).
// Booking requests are saved for the job board, which adds them as "Requested" jobs.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const { payload } = await req.json();
  if (payload?.form_name !== "booking") return new Response("ok");
  await getStore({ name: "board", consistency: "strong" }).setJSON("inbox/" + payload.id, { sub: payload.id, created: payload.created_at, ...payload.data });
  return new Response("ok");
};
