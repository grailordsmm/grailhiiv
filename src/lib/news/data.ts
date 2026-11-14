import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { fetchFeed } from "./fetch";
import { parseStories, normalizeTopics, type ParsedStory } from "./parse";
import { Parser } from "htmlparser2";

export type NewsFeed = { id: string; name: string; feed_url: string; category: string; enabled: boolean; last_checked_at: string | null; last_success_at: string | null; last_error: string | null };
export type NewsStory = ParsedStory & { feed_id: string; feed_category: string };

export function publicClient() { return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) } }); }

// Social Media Today omits article topics from its RSS feed.
export function socialMediaTodayTopics(html: string): string[] {
  let depth = 0, linkDepth = 0, label = "";
  const topics: string[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      if (depth) depth++;
      else if (attributes.class?.split(/\s+/).includes("post-article-topics")) depth = 1;
      if (depth && name === "a" && attributes.class?.split(/\s+/).includes("t-article-end-topic")) { linkDepth = depth; label = ""; }
    },
    ontext(text) { if (linkDepth) label += text; },
    onclosetag() {
      if (!depth) return;
      if (linkDepth === depth) { topics.push(label); linkDepth = 0; }
      depth--;
    },
  });
  parser.end(html);
  return normalizeTopics(topics);
}

// Short-lived process memory only; no article records are written to Supabase.
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.value as Promise<T>;
  if (cache.size >= 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  const value = load().catch(error => { cache.delete(key); throw error; });
  cache.set(key, { expires: Date.now() + 2 * 60 * 1000, value });
  return value;
}

export async function liveStories(feeds: Pick<NewsFeed, "id" | "feed_url" | "category">[]) {
  const stories: NewsStory[] = [];
  let failures = 0;
  for (let i = 0; i < feeds.length; i += 5) {
    const results = await Promise.allSettled(feeds.slice(i, i + 5).map(async feed => {
      const parsed = await cached(`feed:${feed.feed_url}`, async () => {
        const fetched = await fetchFeed(feed.feed_url);
        return parseStories(fetched.content, fetched.url);
      });
      return [...new Map(parsed.stories.map(item => [item.external_id, item])).values()].map(item => ({ ...item, feed_id: feed.id, feed_category: feed.category || parsed.category }));
    }));
    for (const result of results) {
      if (result.status === "fulfilled") stories.push(...result.value);
      else failures++;
    }
  }
  stories.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || "") || a.url.localeCompare(b.url) || a.feed_id.localeCompare(b.feed_id));
  return { stories, failures };
}

export async function enrichTopics(stories: NewsStory[]) {
  for (let i = 0; i < stories.length; i += 5) {
    await Promise.all(stories.slice(i, i + 5).map(async story => {
      if (story.topics.length || !["socialmediatoday.com", "www.socialmediatoday.com"].includes(new URL(story.url).hostname)) return;
      try {
        story.topics = await cached(`topics:${story.url}`, async () => socialMediaTodayTopics((await fetchFeed(story.url, { article: true })).content));
      } catch { /* Show the article even if its categories are unavailable. */ }
    }));
  }
}

export async function refreshFeed(client: SupabaseClient, feed: Pick<NewsFeed, "id" | "feed_url">) {
  const now = new Date().toISOString();
  try {
    const fetched = await fetchFeed(feed.feed_url);
    const parsed = parseStories(fetched.content, fetched.url);
    if (parsed.category) {
      const { error } = await client.from("news_feeds").update({ category: parsed.category }).eq("id", feed.id).eq("category", "");
      if (error) throw error;
    }
    cache.delete(`feed:${feed.feed_url}`);
    const { error } = await client.from("news_feeds").update({ last_checked_at: now, last_success_at: now, last_error: null }).eq("id", feed.id);
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Unable to refresh feed.";
    await client.from("news_feeds").update({ last_checked_at: now, last_error: message }).eq("id", feed.id);
    return { ok: false as const, error: message };
  }
}
