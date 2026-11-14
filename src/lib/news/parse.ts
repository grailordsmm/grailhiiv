import { createHash } from "node:crypto";
import { parseFeed } from "feedsmith";

export type ParsedStory = { external_id: string; title: string; url: string; published_at: string | null; topics: string[] };

function story(title: string | undefined, link: string | undefined, date: string | undefined, id: string | undefined, base: string, topics: (string | undefined)[] = []): ParsedStory | null {
  if (!title?.trim() || !link) return null;
  let url: URL;
  try { url = new URL(link, base); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const time = date ? new Date(date) : null;
  return {
    external_id: createHash("sha256").update(id || url.href).digest("hex"),
    title: title.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500),
    url: url.href,
    topics: normalizeTopics(topics),
    published_at: time && !Number.isNaN(time.valueOf()) ? time.toISOString() : null,
  };
}

export function normalizeTopics(topics: (string | undefined)[]): string[] {
  return [...new Set(topics.map(topic => (topic || "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 80)).filter(Boolean))].slice(0, 20);
}

export function parseStories(content: string, base: string) {
  const result = parseFeed(content, { maxItems: 200 });
  let title = "";
  let category = "";
  let stories: (ParsedStory | null)[];
  if (result.format === "atom") {
    title = result.feed.title?.value || "";
    category = result.feed.categories?.find(item => item.term?.trim())?.term || result.feed.dc?.subjects?.[0] || "";
    stories = (result.feed.entries || []).map(item => story(item.title?.value, item.links?.find(link => !link.rel || link.rel === "alternate")?.href, item.published || item.updated, item.id, base, [...(item.categories || []).map(category => category.term), ...(item.dc?.subjects || [])]));
  } else if (result.format === "json") {
    title = result.feed.title || "";
    stories = (result.feed.items || []).map(item => story(item.title, item.url || item.external_url, item.date_published || item.date_modified, item.id, base, item.tags || []));
  } else if (result.format === "rdf") {
    title = result.feed.title || "";
    category = result.feed.dc?.subjects?.[0] || "";
    stories = (result.feed.items || []).map(item => story(item.title, item.link, item.dc?.dates?.[0], item.rdf?.about, base, item.dc?.subjects || []));
  } else {
    title = result.feed.title || "";
    category = result.feed.categories?.find(item => item.name?.trim())?.name || result.feed.dc?.subjects?.[0] || "";
    stories = (result.feed.items || []).map(item => story(item.title, item.link, item.pubDate || item.dc?.dates?.[0], item.guid?.value, base, [...(item.categories || []).map(category => category.name), ...(item.dc?.subjects || [])]));
  }
  return { title: title.trim().slice(0, 160), category: category.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 80), stories: stories.filter((item): item is ParsedStory => !!item && !!item.title) };
}
