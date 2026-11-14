-- Feeds are always shown now that the pause control has been removed.
update public.news_feeds set enabled = true where not enabled;
