import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { refreshFeed, type NewsFeed } from "@/lib/news/data";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.NEWS_CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) return Response.json({ error: "Refresh is not configured." }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") || "");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const client = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await client.from("news_feeds").select("id,feed_url").eq("enabled", true).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(10);
  if (error) return Response.json({ error: "Unable to load feeds." }, { status: 500 });
  const results = await Promise.all((data as NewsFeed[]).map(feed => refreshFeed(client, feed)));
  return Response.json({ checked: results.length, failed: results.filter(result => !result.ok).length });
}
