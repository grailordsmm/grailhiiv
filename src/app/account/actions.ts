"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import { discoverFeed } from "@/lib/news/fetch";
import { parseStories } from "@/lib/news/parse";
import { refreshFeed } from "@/lib/news/data";

async function admin() {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || user.email?.toLowerCase() !== ADMIN_EMAIL || !user.email_confirmed_at) redirect("/login");
  return client;
}

function done(message: string): string { revalidatePath("/news"); revalidatePath("/account"); return message; }

export async function changePassword(_state: string, form: FormData): Promise<string> {
  const client = await admin();
  const password = String(form.get("newPassword") || "");
  const confirmation = String(form.get("confirmPassword") || "");
  const finish = (message: string) => message;
  if (password.length < 8) return finish("Enter a New Password of at Least 8 Characters.");
  if (password !== confirmation) return finish("The New Passwords Do Not Match.");
  const { error } = await client.auth.updateUser({ password });
  if (error?.code === "reauthentication_needed") return finish("Please Sign Out and Sign In Again Before Changing Your Password.");
  if (error?.code === "same_password") return finish("Choose a Password Different From Your Current Password.");
  if (error) return finish("Could Not Change Your Password. Check Your Password Meets the Account Requirements and Try Again.");
  revalidatePath("/account");
  return finish("Password Changed Successfully.");
}

export async function addFeed(_state: string, form: FormData): Promise<string> {
  const client = await admin();
  const url = String(form.get("url") || "").trim();
  const customName = String(form.get("name") || "").trim().slice(0, 160);
  if (url.length > 2048) return done("That Feed URL Is Too Long.");
  let message = "Feed Added Successfully.";
  try {
    const fetched = await discoverFeed(url);
    const parsed = parseStories(fetched.content, fetched.url);
    const name = customName || parsed.title || new URL(fetched.url).hostname;
    const { data, error } = await client.from("news_feeds").insert({ name, feed_url: fetched.url, category: parsed.category, enabled: true }).select("id,feed_url").single();
    if (error) throw new Error(error.code === "23505" ? "That Feed Is Already Added." : "Could Not Save the Feed.");
    const result = await refreshFeed(client, data);
    if (!result.ok) message = `Feed Added, but Refresh Failed: ${result.error}`;
  } catch (error) { message = error instanceof Error ? error.message : "Could Not Add the Feed."; }
  return done(message);
}

export async function updateFeed(_state: string, form: FormData): Promise<string> {
  const client = await admin();
  const id = String(form.get("id") || "");
  const operation = String(form.get("operation") || "");
  if (operation === "refresh") {
    const { data, error } = await client.from("news_feeds").select("id,feed_url").eq("id", id).single();
    if (error || !data) return done("Feed Not Found.");
    const result = await refreshFeed(client, data);
    return done(result.ok ? "Feed Refreshed." : `Refresh Failed: ${result.error}`);
  }
  if (operation === "delete") {
    const { error } = await client.from("news_feeds").delete().eq("id", id);
    return done(error ? "Could Not Remove the Feed." : "Feed Removed.");
  }
  if (operation === "save") {
    const name = String(form.get("name") || "").trim().slice(0, 160);
    if (!name) return done("A Source Name Is Required.");
    const { error } = await client.from("news_feeds").update({ name, enabled: true }).eq("id", id);
    return done(error ? "Could Not Update the Feed." : "Feed Updated.");
  }
  return done("Unknown Action.");
}
