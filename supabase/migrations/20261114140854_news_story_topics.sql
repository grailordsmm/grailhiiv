alter table public.news_stories add column topics text[] not null default '{}';
