// Fetches a public roster page and returns its readable text, so the builder can read names and numbers.
// Only public http(s) pages; private/local addresses are refused.
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|\[?f[cd])/i;

export default async (req) => {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  let url;
  try { url = new URL(new URL(req.url).searchParams.get("url") || ""); } catch { return json({ error: "That isn't a link." }, 400); }
  if (!/^https?:$/.test(url.protocol) || PRIVATE.test(url.hostname)) return json({ error: "Only public web pages can be read." }, 400);
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0 (roster reader)" } });
    if (!r.ok) return json({ error: `That page answered ${r.status}.` }, 502);
    const html = (await r.text()).slice(0, 2_000_000);
    const text = html
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(tr|li|p|div|h\d|br)>|<br\s*\/?>/gi, "\n")
      .replace(/<\/t[dh]>/gi, "\t")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
      .split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
    return json({ text: text.slice(0, 200_000) });
  } catch (e) {
    return json({ error: "Couldn't reach that page. Try a screenshot instead." }, 502);
  }
};
