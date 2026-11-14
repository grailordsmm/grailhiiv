import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import type { NewsFeed } from "@/lib/news/data";
import { logout } from "@/app/login/actions";
import { FeedForms, PasswordForm, SubmitButton } from "./forms";
import "../invoice/invoice.css";
import "../news/news.css";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const client = await supabaseServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (
    error ||
    !user ||
    user.email?.toLowerCase() !== ADMIN_EMAIL ||
    !user.email_confirmed_at
  )
    redirect("/login?next=account");
  const { data, error: feedError } = await client
    .from("news_feeds")
    .select(
      "id,name,feed_url,category,enabled,last_checked_at,last_success_at,last_error",
    )
    .order("name");
  const feeds = (data || []) as NewsFeed[];
  return (
    <main id="main-content" className="invoice-page account-page">
      <div className="invoice-shell">
        <nav
          className="invoice-workspace-nav"
          aria-label="Workspace navigation"
        >
          <Link href="/account" aria-current="page">
            Account
          </Link>
          <Link href="/invoice">Invoice</Link>
          <Link href="/news">News</Link>
          <form action={logout}>
            <SubmitButton pendingText="Signing Out…">Sign Out</SubmitButton>
          </form>
        </nav>
        <div className="invoice-title">
          <div>
            <h1>
              Manage <span>Account.</span>
            </h1>
          </div>
        </div>
        <section
          id="account-details"
          className="account-section account-details"
        >
          <div className="section-heading">
            <h2>Account Details</h2>
          </div>
          <PasswordForm />
        </section>
        <section id="feeds" className="account-section">
          <div className="section-heading">
            <h2>News Feeds</h2>
            <p>
              {feeds.length} {feeds.length === 1 ? "source" : "sources"}
            </p>
          </div>
          {feedError && (
            <p className="news-notice" role="alert">
              Feed Storage Is Unavailable. Check the Database Setup.
            </p>
          )}
          <FeedForms feeds={feeds} feedError={!!feedError} />
        </section>
      </div>
    </main>
  );
}
