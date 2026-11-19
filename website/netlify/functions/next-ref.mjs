// Booking reference numbers: ASHE-001, ASHE-002, ... One counter for the whole site, kept with the job board's data.
// The booking form asks for the next number just before it sends, so the number is in the email.
import { boardStore, nextRef } from "../lib/board.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return Response.json({ ref: await nextRef(boardStore()) });
};
export const config = { path: "/api/next-ref" };
