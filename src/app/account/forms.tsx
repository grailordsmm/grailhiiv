"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { NewsFeed } from "@/lib/news/data";
import { addFeed, changePassword, updateFeed } from "./actions";

export function SubmitButton({
  children,
  pendingText,
  value,
  primary,
  formNoValidate,
  busy,
}: {
  children: string;
  pendingText: string;
  value?: string;
  primary?: boolean;
  formNoValidate?: boolean;
  busy?: boolean;
}) {
  const { pending, data } = useFormStatus();
  const active = pending && (!value || data?.get("operation") === value);
  return (
    <button
      type="submit"
      className={primary ? "primary" : undefined}
      name={value ? "operation" : undefined}
      value={value}
      formNoValidate={formNoValidate}
      disabled={pending || busy}
      aria-busy={active}
    >
      {active ? pendingText : children}
    </button>
  );
}

export function PasswordForm() {
  const [message, action] = useActionState(changePassword, "");
  return (
    <>
      {message && (
        <p className="news-notice account-notice" role="status">
          {message}
        </p>
      )}
      <form
        action={action}
        className="fields account-details-form account-password-form"
      >
        <label>
          New Password
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm New Password
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <div className="invoice-actions">
          <SubmitButton primary pendingText="Changing Password…">
            Change Password
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

export function FeedForms({
  feeds,
  feedError,
}: {
  feeds: NewsFeed[];
  feedError: boolean;
}) {
  const [addMessage, addAction] = useActionState(addFeed, "");
  const [updateMessage, updateAction, updatePending] = useActionState(
    updateFeed,
    "",
  );
  return (
    <>
      {addMessage && (
        <p className="news-notice" role="status">
          {addMessage}
        </p>
      )}
      {updateMessage && (
        <p className="news-notice" role="status">
          {updateMessage}
        </p>
      )}
      <form action={addAction} className="feed-add-form fields">
        <label>
          Feed or Website URL
          <input
            name="url"
            type="url"
            required
            maxLength={2048}
            placeholder="https://example.com/feed.xml"
          />
        </label>
        <label>
          <span>
            Source Name <small>Optional</small>
          </span>
          <input name="name" maxLength={160} placeholder="Example News" />
        </label>
        <div className="invoice-actions">
          <SubmitButton primary pendingText="Adding Feed…">
            Add Feed
          </SubmitButton>
        </div>
      </form>
      <div className="feed-list">
        {feeds.length === 0 && !feedError && (
          <p className="news-empty">
            No Feeds Added Yet. Add Your First Source Above.
          </p>
        )}
        {feeds.map((feed) => (
          <article className="feed-card" key={feed.id}>
            <form action={updateAction} className="feed-edit-form">
              <input type="hidden" name="id" value={feed.id} />
              <div className="feed-card-title">
                <strong>{feed.name}</strong>
                <span
                  className={
                    feed.enabled ? "feed-status" : "feed-status paused"
                  }
                >
                  {feed.enabled ? "Active" : "Paused"}
                </span>
              </div>
              <p className="feed-url">{feed.feed_url}</p>
              <div className="feed-edit-fields fields">
                <label>
                  Name
                  <input
                    name="name"
                    required
                    defaultValue={feed.name}
                    maxLength={160}
                  />
                </label>
                <div className="feed-actions invoice-actions">
                  <SubmitButton
                    primary
                    value="save"
                    busy={updatePending}
                    pendingText="Saving…"
                  >
                    Save Changes
                  </SubmitButton>
                  <SubmitButton
                    value="refresh"
                    busy={updatePending}
                    formNoValidate
                    pendingText="Refreshing…"
                  >
                    Refresh
                  </SubmitButton>
                  <SubmitButton
                    value="delete"
                    busy={updatePending}
                    formNoValidate
                    pendingText="Removing…"
                  >
                    Remove
                  </SubmitButton>
                </div>
              </div>
              <p className="feed-health">
                {feed.last_error
                  ? `Last refresh failed: ${feed.last_error}`
                  : feed.last_success_at
                    ? `Last updated ${new Date(feed.last_success_at).toLocaleString("en-US", { timeZone: "Asia/Taipei", dateStyle: "medium", timeStyle: "short" })} (Taipei)`
                    : "Not refreshed yet"}
              </p>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
