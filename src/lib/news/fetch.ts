import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { Parser } from "htmlparser2";
import { parseFeed } from "feedsmith";

const MAX_BYTES = 2 * 1024 * 1024;

// Resolve and pin each connection, including redirects, to prevent feed URLs from reaching private services.
export async function fetchFeed(input: string, options?: { article?: boolean }): Promise<{ content: string; url: string }> {
  let url = new URL(input);
  for (let redirects = 0; redirects <= 4; redirects++) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw new Error("Use a public HTTP or HTTPS feed URL.");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !ipaddr.isValid(address) || ipaddr.process(address).range() !== "unicast")) throw new Error("Feed address must be public.");
    const selected = addresses[0];
    const result = await new Promise<{ status: number; location?: string; content: string }>((resolve, reject) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        headers: options?.article ? { "User-Agent": "node", Accept: "text/html" } : { "User-Agent": "GrailHiivNews/1.0", Accept: "application/rss+xml, application/atom+xml, application/feed+json, application/xml, text/xml, application/json;q=0.9, */*;q=0.1" },
        ...{ autoSelectFamily: false },
        lookup: (_host, _options, callback) => callback(null, selected.address, selected.family),
      }, response => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400) { response.resume(); resolve({ status, location: response.headers.location, content: "" }); return; }
        if (status !== 200) { response.resume(); reject(new Error(`Feed returned HTTP ${status}.`)); return; }
        const chunks: Buffer[] = []; let size = 0;
        response.on("data", (chunk: Buffer) => { size += chunk.length; if (size > MAX_BYTES) response.destroy(new Error("Feed is too large.")); else chunks.push(chunk); });
        response.on("end", () => resolve({ status, content: Buffer.concat(chunks).toString("utf8") }));
        response.on("error", reject);
      });
      request.setTimeout(12000, () => request.destroy(new Error("Feed request timed out.")));
      request.on("error", reject);
      request.end();
    });
    if (result.status >= 300 && result.status < 400) {
      if (!result.location || redirects === 4) throw new Error("Too many feed redirects.");
      url = new URL(result.location, url); continue;
    }
    return { content: result.content, url: url.href };
  }
  throw new Error("Too many feed redirects.");
}

// Accept a feed directly or discover feeds advertised in a site's HTML.
export async function discoverFeed(input: string, fetcher = fetchFeed): Promise<{ content: string; url: string }> {
  const page = await fetcher(input);
  try { parseFeed(page.content, { maxItems: 1 }); return page; } catch { /* Look for advertised feeds. */ }
  const candidates: string[] = [];
  const parser = new Parser({ onopentag(name, attributes) {
    if (name !== "link" || !attributes.rel?.toLowerCase().split(/\s+/).includes("alternate") || !attributes.href) return;
    const type = attributes.type?.toLowerCase().split(";")[0].trim();
    if (!type || !["application/rss+xml", "application/atom+xml", "application/rdf+xml", "application/xml", "text/xml", "application/feed+json"].includes(type)) return;
    try {
      const url = new URL(attributes.href, page.url).href;
      if (url.length <= 2048 && !candidates.includes(url)) candidates.push(url);
    } catch { /* Ignore malformed links. */ }
  } });
  parser.end(page.content);
  for (const candidate of candidates.slice(0, 5)) {
    try {
      const feed = await fetcher(candidate);
      parseFeed(feed.content, { maxItems: 1 });
      return feed;
    } catch { /* Try the next advertised feed. */ }
  }
  throw new Error("No supported feed found. Enter a direct RSS, Atom, RDF, or JSON Feed URL, or a website that advertises one.");
}
