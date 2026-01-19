import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InAppNotification } from "@shared/schema";

// Get all in-app notifications for current user
export function useInAppNotifications() {
  return useQuery<InAppNotification[]>({
    queryKey: ["inAppNotifications"],
    queryFn: async () => {
      const res = await fetch("/api/in-app-notifications", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread in-app notifications only
export function useUnreadInAppNotifications() {
  return useQuery<InAppNotification[]>({
    queryKey: ["inAppNotifications", "unread"],
    queryFn: async () => {
      const res = await fetch("/api/in-app-notifications/unread", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread notification count for badge
export function useUnreadInAppNotificationCount() {
  return useQuery<{ count: number }>({
    queryKey: ["inAppNotifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/in-app-notifications/unread-count", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notification count");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark a notification as read
export function useMarkInAppNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/in-app-notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inAppNotifications"] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllInAppNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/in-app-notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inAppNotifications"] });
    },
  });
}
