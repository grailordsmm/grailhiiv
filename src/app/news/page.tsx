import type { Metadata } from "next";
import Link from "next/link";
import { publicClient, liveStories, enrichTopics } from "@/lib/news/data";
import "./news.css";

export const metadata: Metadata = { title: "News", description: "A curated feed of stories from around the web.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(Math.max(Number.parseInt(params.page || "1", 10) || 1, 1), 1000);
  const client = publicClient();
  const pageSize = 20;
  const result = await client.from("news_feeds").select("id,feed_url,category").eq("enabled", true);
  const live = result.error ? { stories: [], failures: 0 } : await liveStories(result.data || []);
  const items = live.stories.slice((page - 1) * pageSize, page * pageSize);
  await enrichTopics(items);
  const link = (number: number) => number > 1 ? `/news?page=${number}` : "/news";
  return <main id="main-content" className="news-shell news-page">
    <div className="max-w-5xl mx-auto">
    <h1 className="sr-only">News</h1>
    {result.error || (live.failures > 0 && !live.stories.length) ? <p className="news-empty" role="status">News is temporarily unavailable. Please try again later.</p> : items.length === 0 ? <p className="news-empty">No stories here yet. Check back soon.</p> : <ul className="news-stories">{items.map(item => <li className="news-story" key={`${item.feed_id}:${item.external_id}`}>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-story-title">{item.title}</a>{" "}
      {(item.topics.length ? item.topics : item.feed_category ? [item.feed_category.trim().toLowerCase()] : []).map(topic => <span className="news-story-category" key={topic}>{topic}</span>)}{" "}
      <span className="news-story-domain">{new URL(item.url).hostname.replace(/^www\./, "")}</span>
    </li>)}</ul>}
    {live.failures > 0 && live.stories.length > 0 && <p className="news-empty" role="status">Some sources are temporarily unavailable.</p>}
    <div className="news-pagination">{page > 1 && <Link href={link(page - 1)}>← Newer stories</Link>}{live.stories.length > page * pageSize && <Link href={link(page + 1)}>More stories →</Link>}</div>
    </div>
  </main>;
}
