// New booking requests, read from the public site's Netlify Form.
// Set in Netlify → this project → Environment variables (never in the code):
//   NETLIFY_TOKEN   a personal access token from your Netlify user settings
//   BOOKING_FORM_ID the id of the "booking" form on your public site
export default async () => {
  const { NETLIFY_TOKEN, BOOKING_FORM_ID } = process.env;
  if (!NETLIFY_TOKEN || !BOOKING_FORM_ID) return Response.json({ setup: true, bookings: [] });
  const r = await fetch(`https://api.netlify.com/api/v1/forms/${BOOKING_FORM_ID}/submissions?per_page=100`, { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } });
  if (!r.ok) return Response.json({ error: r.status, bookings: [] }, { status: 502 });
  const bookings = (await r.json()).map(s => ({ sub: s.id, created: s.created_at, ...s.data }));
  return Response.json({ bookings });
};
export const config = { path: "/api/inbox" };
