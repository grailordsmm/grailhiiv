import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStories } from '../src/lib/news/parse.ts';
import { discoverFeed, fetchFeed } from '../src/lib/news/fetch.ts';

test('RSS, Atom, RDF, and JSON feeds become safe news links', () => {
  const cases = [
    ['<rss version="2.0"><channel><title>News</title><link>https://example.com</link><description>News</description><item><title>Story</title><link>/story</link><guid>rss-1</guid><pubDate>Mon, 15 Jan 2024 12:00:00 GMT</pubDate></item></channel></rss>', 'rss-1'],
    ['<feed xmlns="http://www.w3.org/2005/Atom"><title>News</title><id>news</id><updated>2024-01-15T12:00:00Z</updated><entry><title>Story</title><id>atom-1</id><link href="/story"/><updated>2024-01-15T12:00:00Z</updated></entry></feed>', 'atom-1'],
    ['<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/"><channel rdf:about="https://example.com"><title>News</title><link>https://example.com</link><description>News</description></channel><item rdf:about="rdf-1"><title>Story</title><link>/story</link></item></rdf:RDF>', 'rdf-1'],
    [JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'News', items: [{ id: 'json-1', title: 'Story', url: '/story', date_published: '2024-01-15T12:00:00Z' }] }), 'json-1'],
  ];
  for (const [input] of cases) {
    const parsed = parseStories(input, 'https://example.com/feed');
    assert.equal(parsed.title, 'News');
    assert.equal(parsed.stories.length, 1);
    assert.equal(parsed.stories[0].url, 'https://example.com/story');
    assert.equal(parsed.stories[0].title, 'Story');
  }
});

test('extracts feed-level categories in lowercase without guessing from stories', () => {
  const rss = '<rss version="2.0"><channel><title>News</title><link>https://example.com</link><description>News</description><category>Social Media</category><item><title>Story</title><link>/story</link><category>Other</category></item></channel></rss>';
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><title>News</title><id>news</id><updated>2024-01-15T12:00:00Z</updated><category term="TECHNOLOGY"/><entry><title>Story</title><id>1</id><link href="/story"/><updated>2024-01-15T12:00:00Z</updated></entry></feed>';
  const json = JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'News', items: [{ id: '1', title: 'Story', url: '/story', tags: ['Social'] }] });
  assert.equal(parseStories(rss, 'https://example.com').category, 'social media');
  assert.equal(parseStories(atom, 'https://example.com').category, 'technology');
  assert.equal(parseStories(json, 'https://example.com').category, '');
  assert.deepEqual(parseStories(rss, 'https://example.com').stories[0].topics, ['other']);
  assert.deepEqual(parseStories(json, 'https://example.com').stories[0].topics, ['social']);
  const atomItem = atom.replace('<entry><title>', '<entry><category term="Reddit"/><category term="Social Media"/><title>');
  assert.deepEqual(parseStories(atomItem, 'https://example.com').stories[0].topics, ['reddit', 'social media']);
});

test('rejects unsafe article and private feed URLs', async () => {
  const json = JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'News', items: [{ id: '1', title: 'Bad', url: 'javascript:alert(1)' }] });
  assert.equal(parseStories(json, 'https://example.com/feed').stories.length, 0);
  await assert.rejects(fetchFeed('http://127.0.0.1:80/feed'), /public/);
  await assert.rejects(fetchFeed('http://[::1]/feed'), /public/);
  await assert.rejects(fetchFeed('http://169.254.169.254/feed'), /public/);
});

test('discovers an advertised feed and validates it before returning', async () => {
  const rss = '<rss version="2.0"><channel><title>News</title><link>https://example.com</link><description>News</description></channel></rss>';
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    if (calls.length === 1) return { url: 'https://example.com/news/', content: '<html><head><link type="application/atom+xml" rel="alternate" href="/broken"><link href="feed.xml?x=1&amp;y=2" rel="alternate" type="application/rss+xml"></head></html>' };
    if (url.endsWith('/broken')) return { url, content: '<html>Not a feed</html>' };
    return { url, content: rss };
  };
  const result = await discoverFeed('https://example.com', fetcher);
  assert.equal(result.url, 'https://example.com/news/feed.xml?x=1&y=2');
  assert.equal(calls.length, 3);
  assert.equal((await discoverFeed('https://example.com/feed', async url => ({ url, content: rss }))).content, rss);
  await assert.rejects(discoverFeed('https://example.com', async url => ({ url, content: '<html>No feed</html>' })), /No supported feed found/);
});
