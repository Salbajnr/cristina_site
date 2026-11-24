import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetContentQueryKey,
  getGetFeaturedContentQueryKey,
  getGetSiteStatsQueryKey,
  getListContentQueryKey,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

const NOTIFICATIONS_ENABLED_KEY = "cristina_desktop_notifications";

export default function LiveUpdateNotifications() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id ?? null);
    });

    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!active) return;
      if (error) {
        console.error("Unable to load the Supabase session for live updates.", error);
      } else {
        setUserId(sessionData.session?.user.id ?? null);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const refreshLikes = (resourceId: string) => {
      const [targetType, targetIdText] = resourceId.split(":");
      const targetId = Number(targetIdText);
      if (!Number.isSafeInteger(targetId) || targetId <= 0) return;

      if (targetType === "content") {
        void queryClient.invalidateQueries({ queryKey: ["likes", "content", targetId] });
        void queryClient.invalidateQueries({ queryKey: getGetContentQueryKey(targetId) });
        void queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetFeaturedContentQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      } else if (targetType === "post") {
        void queryClient.invalidateQueries({ queryKey: ["likes", "post", targetId] });
        void queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      }
    };

    const refreshContent = () => {
      void queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetFeaturedContentQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
    };
    const refreshPosts = () => {
      void queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
    };

    const channel = supabase
      .channel("public-feed-live-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_events" },
        ({ new: event }) => {
          if (event.resource_type === "content") {
            refreshContent();
          } else if (event.resource_type === "post") {
            refreshPosts();
          } else if (event.resource_type === "comment") {
            const contentId = Number(event.resource_id);
            if (Number.isSafeInteger(contentId) && contentId > 0) {
              void queryClient.invalidateQueries({ queryKey: ["content-comments", contentId] });
              void queryClient.invalidateQueries({ queryKey: getGetContentQueryKey(contentId) });
              void queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
            }
          } else if (event.resource_type === "like") {
            refreshLikes(event.resource_id);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Unable to subscribe to live feed and engagement updates.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: notification }) => {
          if (
            document.visibilityState !== "hidden" ||
            localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== "true" ||
            !("Notification" in window) ||
            Notification.permission !== "granted"
          ) {
            return;
          }

          try {
            new Notification(notification.title, {
              body: notification.body,
              icon: "/favicon.svg",
              tag: notification.id,
            });
          } catch (error) {
            console.error("Unable to display a desktop notification.", error);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Unable to subscribe to private notification updates.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
