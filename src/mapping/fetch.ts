/** Turvaline lehe allalaadimine Workers'ist. */

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[::1\]|169\.254\.)/i;
const MAX_BYTES = 2_000_000;

export type FetchResult =
  | { ok: true; status: number; html: string; finalUrl: string; contentType: string }
  | { ok: false; status: number; error: string; finalUrl: string };

export function isAllowedUrl(url: string, allowPrivate: boolean): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(u.protocol)) return false;
  if (!allowPrivate && (PRIVATE_HOST.test(u.hostname) || !u.hostname.includes("."))) return false;
  return true;
}

export async function fetchPage(url: string, opts: { userAgent: string; allowPrivate: boolean; timeoutMs?: number }): Promise<FetchResult> {
  if (!isAllowedUrl(url, opts.allowPrivate)) return { ok: false, status: 0, error: "URL ei ole lubatud", finalUrl: url };
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": opts.userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
        "accept-language": "et,en;q=0.8,fi;q=0.7,sv;q=0.7,de;q=0.6",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, finalUrl: res.url || url };
    if (!/html|xml|text/i.test(contentType)) return { ok: false, status: res.status, error: `Sobimatu sisutüüp: ${contentType}`, finalUrl: res.url || url };
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, MAX_BYTES));
    return { ok: true, status: res.status, html, finalUrl: res.url || url, contentType };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e), finalUrl: url };
  }
}
