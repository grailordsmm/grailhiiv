create table public.news_feeds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  feed_url text not null unique check (char_length(feed_url) <= 2048),
  category text not null default '' check (char_length(category) <= 80),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text
);

create table public.news_stories (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.news_feeds(id) on delete cascade,
  external_id text not null,
  title text not null check (char_length(title) between 1 and 500),
  url text not null,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  unique (feed_id, external_id)
);

create index news_stories_published_idx on public.news_stories (published_at desc nulls last, first_seen_at desc, id desc);
create index news_stories_feed_idx on public.news_stories (feed_id);
alter table public.news_feeds enable row level security;
alter table public.news_stories enable row level security;
revoke all on public.news_feeds, public.news_stories from anon, authenticated;
grant select on public.news_feeds, public.news_stories to anon;
grant select, insert, update, delete on public.news_feeds, public.news_stories to authenticated;
grant all on public.news_feeds, public.news_stories to service_role;

create policy "Public can read active news feeds" on public.news_feeds for select to anon, authenticated using (enabled);
create policy "Public can read active news stories" on public.news_stories for select to anon, authenticated using (exists (select 1 from public.news_feeds where news_feeds.id = feed_id and news_feeds.enabled));
-- Restrict management to this project's verified administrator, not all signed-in users.
create policy "Administrator manages news feeds" on public.news_feeds for all to authenticated using ((select auth.uid()) = 'dfca1897-93ed-410f-9c74-3aba585d5b70'::uuid) with check ((select auth.uid()) = 'dfca1897-93ed-410f-9c74-3aba585d5b70'::uuid);
create policy "Administrator manages news stories" on public.news_stories for all to authenticated using ((select auth.uid()) = 'dfca1897-93ed-410f-9c74-3aba585d5b70'::uuid) with check ((select auth.uid()) = 'dfca1897-93ed-410f-9c74-3aba585d5b70'::uuid);
