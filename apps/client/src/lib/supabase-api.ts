import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiRequestHandler } from "@workspace/api-client-react";

const database = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
) as SupabaseClient<any>;

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

const fail = (error: { message?: string }) => {
  throw new Error(error.message || "Supabase request failed");
};

async function currentUser() {
  const { data: sessionData, error: sessionError } = await database.auth.getSession();
  if (sessionError) fail(sessionError);
  const token = sessionData.session?.access_token;
  if (!token) return null;
  const { data, error } = await database.auth.getUser(token);
  if (error) fail(error);
  return data.user;
}

async function legacyUserId() {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await database
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error) fail(error);
  return data?.id ?? null;
}

function mapProfile(row: any) {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    location: row.location ?? undefined,
    subscriberCount: row.subscriber_count,
    totalPhotos: row.total_photos,
    totalVideos: row.total_videos,
    joinedDate: row.joined_date,
  };
}

function mapContent(row: any, categoryName?: string) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    price: Number(row.price),
    previewUrl: row.preview_url,
    isLocked: row.is_locked,
    isFeatured: row.is_featured,
    categoryId: row.category_id ?? undefined,
    categoryName,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    tags: row.tags ?? [],
  };
}

async function mapContentList(rows: any[]) {
  const categoryIds = [...new Set(rows.map((row) => row.category_id).filter(Boolean))];
  const names = new Map<number, string>();
  if (categoryIds.length) {
    const { data, error } = await database
      .from("categories")
      .select("id,name")
      .in("id", categoryIds);
    if (error) fail(error);
    for (const category of data ?? []) names.set(category.id, category.name);
  }
  return rows.map((row) => mapContent(row, names.get(row.category_id)));
}

function mapPost(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? undefined,
    body: row.body,
    mediaUrl: row.media_url ?? undefined,
    createdAt: row.created_at,
  };
}

function mapInquiry(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp ?? undefined,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

async function oneProfile() {
  const { data, error } = await database.from("profile").select("*").limit(1).maybeSingle();
  if (error) fail(error);
  return data;
}

async function siteStats() {
  const { data: content, error } = await database.from("content").select("type");
  if (error) fail(error);
  const { data: profile, error: profileError } = await database
    .from("profile")
    .select("subscriber_count")
    .limit(1)
    .maybeSingle();
  if (profileError) fail(profileError);
  const items = content ?? [];
  const totalPhotos = items.filter((item) => item.type === "photo").length;
  const totalVideos = items.filter((item) => item.type === "video").length;
  const totalBundles = items.filter((item) => item.type === "bundle").length;
  return {
    totalContent: items.length,
    totalPhotos,
    totalVideos,
    totalBundles,
    subscriberCount: profile?.subscriber_count ?? 0,
  };
}

function parseBody(init: RequestInit) {
  if (typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
}

export const supabaseApiRequest: ApiRequestHandler = async (input, init) => {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(rawUrl, window.location.origin);
  const path = url.pathname.replace(/^.*?\/api(?=\/|$)/, "") || "/";
  const method = (init.method || "GET").toUpperCase();
  const body = parseBody(init);

  try {
    if (method === "GET" && path === "/healthz") return jsonResponse({ status: "ok" });

    if (path === "/profile" && method === "GET") {
      const profile = await oneProfile();
      return profile ? jsonResponse(mapProfile(profile)) : jsonResponse({ error: "Profile not found" }, 404);
    }
    if (path === "/profile" && method === "PUT") {
      const profile = await oneProfile();
      if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
      const fields: Record<string, string> = {
        displayName: "display_name", username: "username", bio: "bio",
        avatarUrl: "avatar_url", coverUrl: "cover_url", location: "location",
      };
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([key]) => body[key] !== undefined).map(([key, column]) => [column, body[key]]),
      );
      const { data, error } = await database.from("profile").update(updates).eq("id", profile.id).select("*").single();
      if (error) fail(error);
      return jsonResponse(mapProfile(data));
    }
    if (method === "GET" && path === "/stats") return jsonResponse(await siteStats());

    if (method === "GET" && path === "/categories") {
      const { data, error } = await database.from("categories").select("id,name,slug,item_count");
      if (error) fail(error);
      return jsonResponse((data ?? []).map((item) => ({ id: item.id, name: item.name, slug: item.slug, itemCount: item.item_count })));
    }

    if (method === "GET" && path === "/content") {
      let query = database.from("content").select("*").order("created_at", { ascending: false });
      const categoryId = url.searchParams.get("categoryId");
      const type = url.searchParams.get("type");
      if (categoryId) query = query.eq("category_id", Number(categoryId));
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) fail(error);
      return jsonResponse(await mapContentList(data ?? []));
    }
    if (method === "GET" && path === "/content/featured") {
      const { data, error } = await database.from("content").select("*").eq("is_featured", true).order("created_at", { ascending: false });
      if (error) fail(error);
      return jsonResponse(await mapContentList(data ?? []));
    }

    let match = path.match(/^\/content\/(\d+)(?:\/(comments))?$/);
    if (match) {
      const id = Number(match[1]);
      if (match[2]) {
        if (method === "GET") {
          const { data, error } = await database.from("content_comments").select("id,content_id,author_name,body,created_at").eq("content_id", id).order("created_at", { ascending: false });
          if (error) fail(error);
          return jsonResponse((data ?? []).map((comment) => ({ id: comment.id, contentId: comment.content_id, authorName: comment.author_name, body: comment.body, createdAt: comment.created_at })));
        }
        if (method === "POST") {
          const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
          const commentBody = typeof body.body === "string" ? body.body.trim() : "";
          if (!authorName || authorName.length > 100 || !commentBody || commentBody.length > 2000) {
            return jsonResponse({ error: "Name and comment are required (maximum 100 and 2000 characters)." }, 400);
          }
          const { data, error } = await database.from("content_comments").insert({ content_id: id, author_name: authorName, body: commentBody }).select("id,content_id,author_name,body,created_at").single();
          if (error) fail(error);
          return jsonResponse({ id: data.id, contentId: data.content_id, authorName: data.author_name, body: data.body, createdAt: data.created_at }, 201);
        }
      } else if (method === "GET") {
        const { data, error } = await database.from("content").select("*").eq("id", id).maybeSingle();
        if (error) fail(error);
        if (!data) return jsonResponse({ error: "Not found" }, 404);
        const categories = data.category_id ? await database.from("categories").select("name").eq("id", data.category_id).maybeSingle() : { data: null, error: null };
        if (categories.error) fail(categories.error);
        return jsonResponse(mapContent(data, categories.data?.name));
      } else if (method === "POST" || method === "PUT") {
        const fields: Record<string, string> = {
          title: "title", description: "description", type: "type", price: "price",
          previewUrl: "preview_url", isLocked: "is_locked", isFeatured: "is_featured",
          categoryId: "category_id", tags: "tags",
        };
        const values = Object.fromEntries(Object.entries(fields).filter(([key]) => body[key] !== undefined).map(([key, column]) => [column, key === "price" ? Number(body[key]) : body[key]]));
        if (method === "POST") {
          const { data, error } = await database.from("content").insert(values).select("*").single();
          if (error) fail(error);
          return jsonResponse(mapContent(data), 201);
        }
        const { data, error } = await database.from("content").update(values).eq("id", id).select("*").maybeSingle();
        if (error) fail(error);
        return data ? jsonResponse(mapContent(data)) : jsonResponse({ error: "Not found" }, 404);
      } else if (method === "DELETE") {
        const { data, error } = await database.from("content").delete().eq("id", id).select("id").maybeSingle();
        if (error) fail(error);
        return data ? jsonResponse({ success: true, id }) : jsonResponse({ error: "Not found" }, 404);
      }
    }

    if (method === "GET" && path === "/purchases") {
      const userId = await legacyUserId();
      if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);
      const { data, error } = await database.from("purchases").select("id,content_id,content_title,customer_email,amount,status,created_at").order("created_at", { ascending: false });
      if (error) fail(error);
      return jsonResponse((data ?? []).map((purchase) => ({ id: purchase.id, contentId: purchase.content_id, contentTitle: purchase.content_title, customerEmail: purchase.customer_email, amount: Number(purchase.amount), status: purchase.status, createdAt: purchase.created_at })));
    }

    if (method === "GET" && path === "/posts") {
      const { data, error } = await database.from("posts").select("*").order("created_at", { ascending: false });
      if (error) fail(error);
      return jsonResponse((data ?? []).map(mapPost));
    }
    match = path.match(/^\/posts\/(\d+)(?:\/(comments))?$/);
    if (match) {
      const id = Number(match[1]);
      if (match[2] && method === "GET") {
        const { data, error } = await database.from("comments").select("id,post_id,author_name,body,created_at").eq("post_id", id).order("created_at", { ascending: false });
        if (error) fail(error);
        return jsonResponse((data ?? []).map((comment) => ({ id: comment.id, postId: comment.post_id, authorName: comment.author_name, body: comment.body, createdAt: comment.created_at })));
      }
      if (match[2] && method === "POST") {
        const { data, error } = await database.from("comments").insert({ post_id: id, author_name: body.authorName, body: body.body }).select("id,post_id,author_name,body,created_at").single();
        if (error) fail(error);
        return jsonResponse({ id: data.id, postId: data.post_id, authorName: data.author_name, body: data.body, createdAt: data.created_at }, 201);
      }
      if (method === "GET") {
        const { data, error } = await database.from("posts").select("*").eq("id", id).maybeSingle();
        if (error) fail(error);
        return data ? jsonResponse(mapPost(data)) : jsonResponse({ error: "Not found" }, 404);
      }
    }

    if (method === "POST" && path === "/creator/posts") {
      const { data, error } = await database.from("posts").insert({ type: body.type || "text", title: body.title || null, body: body.body, media_url: body.mediaUrl || null }).select("*").single();
      if (error) fail(error);
      return jsonResponse(mapPost(data), 201);
    }
    match = path.match(/^\/creator\/posts\/(\d+)$/);
    if (match && method === "DELETE") {
      const id = Number(match[1]);
      const { error } = await database.from("posts").delete().eq("id", id);
      if (error) fail(error);
      return jsonResponse({ success: true, id });
    }

    match = path.match(/^\/likes\/(content|post)\/(\d+)$/);
    if (match && (method === "GET" || method === "PUT")) {
      const userId = method === "PUT" ? await legacyUserId() : await legacyUserId();
      if (method === "PUT" && (!userId || typeof body.liked !== "boolean")) return jsonResponse({ error: "Unauthorized" }, 401);
      const { data, error } = await database.rpc("set_like_state", {
        target_kind: match[1],
        target_key: Number(match[2]),
        liked: method === "PUT" ? body.liked : null,
      });
      if (error) fail(error);
      return jsonResponse(data);
    }

    if (path === "/subscriptions/me" && method === "GET") {
      const userId = await legacyUserId();
      if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);
      const { data, error } = await database.from("subscriptions").select("plan,status,created_at").in("status", ["active", "trialing"]).order("created_at", { ascending: false });
      if (error) fail(error);
      return jsonResponse((data ?? []).map((subscription) => ({ plan: subscription.plan, status: subscription.status, createdAt: subscription.created_at })));
    }
    if (path === "/subscriptions/checkout-session" && method === "POST") {
      const { data, error } = await database.functions.invoke("billing", { body: { action: "create-subscription-checkout", plan: body.plan } });
      if (error) fail(error);
      return jsonResponse(data);
    }
    if (path === "/subscriptions/portal" && method === "POST") {
      const { data, error } = await database.functions.invoke("billing", { body: { action: "create-portal" } });
      if (error) fail(error);
      return jsonResponse(data);
    }
    if (path === "/purchases/checkout-session" && method === "POST") {
      const { data, error } = await database.functions.invoke("billing", { body: { action: "create-content-checkout", contentId: body.contentId } });
      if (error) fail(error);
      return jsonResponse(data);
    }
    match = path.match(/^\/purchases\/checkout-session\/([^/]+)$/);
    if (match && method === "GET") {
      const { data, error } = await database.functions.invoke("billing", { body: { action: "verify-checkout", sessionId: decodeURIComponent(match[1]) } });
      if (error) fail(error);
      return jsonResponse(data);
    }

    if (method === "POST" && path === "/inquiries") {
      const { data, error } = await database.from("inquiries").insert({ name: body.name, email: body.email, whatsapp: body.whatsapp || null, message: body.message }).select("*").single();
      if (error) fail(error);
      void database.functions.invoke("inquiry-notification", { body: { inquiryId: data.id } });
      return jsonResponse(mapInquiry(data), 201);
    }
    if (method === "GET" && path === "/creator/inquiries") {
      const { data, error } = await database.from("inquiries").select("*").order("created_at", { ascending: false });
      if (error) fail(error);
      return jsonResponse((data ?? []).map(mapInquiry));
    }
    match = path.match(/^\/creator\/inquiries\/(\d+)\/read$/);
    if (match && method === "PUT") {
      const { data, error } = await database.from("inquiries").update({ is_read: true }).eq("id", Number(match[1])).select("*").maybeSingle();
      if (error) fail(error);
      return data ? jsonResponse(mapInquiry(data)) : jsonResponse({ error: "Not found" }, 404);
    }

    return null;
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Supabase request failed" }, 500);
  }
};

export async function fetchSupabaseApi(path: string, init: RequestInit = {}) {
  const response = await supabaseApiRequest(`${window.location.origin}/api${path}`, init);
  return response ?? jsonResponse({ error: "Unknown Supabase API route" }, 404);
}
