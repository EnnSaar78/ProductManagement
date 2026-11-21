/** HTML -> puhastatud tekst ja lingid. Töötab Workers'is ilma DOM-ita (regex-põhine). */

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", pound: "£", copy: "©", reg: "®", trade: "™",
  hellip: "…", mdash: "—", ndash: "–", laquo: "«", raquo: "»", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", middot: "·",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m);
}

const BLOCK_TAGS = "p|div|section|article|header|footer|main|aside|nav|h1|h2|h3|h4|h5|h6|ul|ol|li|table|thead|tbody|tr|td|th|dl|dt|dd|blockquote|pre|form|fieldset|figure|figcaption|details|summary|br|hr";

export function htmlToText(html: string): { title: string; text: string; description: string } {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim());
  const description = decodeEntities(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "").trim();
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|svg|template|iframe|canvas|video|audio)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<head[\s\S]*?<\/head>/i, " ");
  // Struktuur: pealkirjad ja loendid säilitavad vihje
  s = s.replace(/<h([1-6])[^>]*>/gi, (_, l) => `\n${"#".repeat(Number(l))} `);
  s = s.replace(/<li[^>]*>/gi, "\n- ");
  s = s.replace(/<(td|th)[^>]*>/gi, " | ");
  s = s.replace(new RegExp(`</?(${BLOCK_TAGS})[^>]*>`, "gi"), "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  s = s.replace(/[ \t ]+/g, " ");
  s = s.replace(/ *\n */g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return { title, text: s.trim(), description };
}

const SKIP_EXT = /\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|css|js|json|xml|zip|rar|mp4|mp3|avi|mov|woff2?|ttf|eot|docx?|xlsx?|pptx?)(\?.*)?$/i;

export function extractLinks(html: string, baseUrl: string): { url: string; text: string }[] {
  const base = new URL(baseUrl);
  const out = new Map<string, string>();
  const re = /<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) continue;
    let u: URL;
    try {
      u = new URL(decodeEntities(raw), base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol)) continue;
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (SKIP_EXT.test(u.pathname)) continue;
    u.hash = "";
    u.search = "";
    const key = u.toString().replace(/\/$/, "");
    const text = decodeEntities(m[4].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 120);
    if (!out.has(key) || (!out.get(key) && text)) out.set(key, text);
  }
  return [...out.entries()].map(([url, text]) => ({ url, text }));
}

export function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) urls.push(decodeEntities(m[1]));
  return urls;
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
