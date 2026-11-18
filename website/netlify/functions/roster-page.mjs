// Fetches a public roster page and returns its readable text, so the builder can read names and numbers.
// Only public http(s) pages; private/local addresses are refused.
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|\[?f[cd])/i;

export default async (req) => {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  let url;
  try { url = new URL(new URL(req.url).searchParams.get("url") || ""); } catch { return json({ error: "That isn't a link." }, 400); }
  if (!/^https?:$/.test(url.protocol) || PRIVATE.test(url.hostname)) return json({ error: "Only public web pages can be read." }, 400);
  const linksOnly = new URL(req.url).searchParams.get("links") === "1";   // an athletics homepage: hand back its roster links only
  if (!linksOnly && !/roster|team|staff|bio/i.test(url.pathname + url.search)) return json({ error: "Paste the team's roster page (its address usually has /roster in it)." }, 400);   // not a general web fetcher
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0 (roster reader)" } });
    if (!r.ok) return json({ error: `That page answered ${r.status}.` }, 502);
    const html = (await r.text()).slice(0, 2_000_000);
    if (linksOnly){
      const links = [...new Set([...html.matchAll(/href="([^"#]*roster[^"#]*)"/gi)].map(m => { try { return new URL(m[1], r.url).href; } catch { return ""; } }).filter(Boolean))].slice(0, 150);
      return json({ links });
    }
    // Table rows become one line each ("0  Dre Thomas  LB  So.  6-1 …"): drop phone-only duplicate cells and "No.:"-style labels,
    // so names split across tags (PrestoSports, Sidearm) stay together.
    const rows = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<tr\b[\s\S]*?<\/tr>/gi, row => row
      .replace(/<(td|th)\b[^>]*class="[^"]*\bd-md-none\b[^"]*"[\s\S]*?<\/\1>/gi, "")
      .replace(/<span\b[^>]*class="[^"]*\blabel\b[^"]*"[\s\S]*?<\/span>/gi, "")
      .replace(/<\/t[dh]>/gi, "\u0001").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/\s*\u0001\s*/g, "\t").trim() + "\n");
    const text = rows
      .replace(/<\/(tr|li|p|div|h\d|br)>|<br\s*\/?>/gi, "\n")
      .replace(/<\/t[dh]>/gi, "\t")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
      .split("\n").map(l => l.replace(/ +/g, " ").replace(/ ?\t ?/g, "\t").replace(/^[\s\t]+|[\s\t]+$/g, "")).filter(Boolean).join("\n");   // keep tabs: they separate the columns
    return json({ text: text.slice(0, 200_000) });
  } catch (e) {
    return json({ error: "Couldn't reach that page. Try a screenshot instead." }, 502);
  }
};
