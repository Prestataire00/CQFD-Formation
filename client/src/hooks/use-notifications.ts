import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InAppNotification } from "@shared/schema";

// Task alert types
export interface TaskAlertItem {
  stepId: number;
  stepTitle: string;
  stepStatus: string;
  dueDate: string | null;
  missionId: number;
  missionTitle: string;
  assigneeId: string;
  assigneeFirstName: string | null;
  assigneeLastName: string | null;
  assigneeRole: string;
  daysOverdue: number;
}

export interface MissingDocumentAlert {
  documentId: number;
  documentTitle: string;
  documentType: string;
  missionId: number;
  missionTitle: string;
  trainerId: string;
  trainerFirstName: string | null;
  trainerLastName: string | null;
  templateTitle: string;
}

export interface TaskAlerts {
  lateTasks: TaskAlertItem[];
  priorityTasks: TaskAlertItem[];
  missingDocuments: MissingDocumentAlert[];
}

// Get task alerts for admin dashboard (late + priority tasks + missing docs)
export function useTaskAlerts(enabled: boolean = true) {
  return useQuery<TaskAlerts>({
    queryKey: ["taskAlerts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/task-alerts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch task alerts");
      return res.json();
    },
    refetchInterval: 60000,
    enabled,
  });
}

// Trainer delays types
export interface TrainerDelay {
  lateSteps: Array<{
    stepId: number;
    stepTitle: string;
    missionId: number;
    missionTitle: string;
      trainerId: string;
    trainerFirstName: string | null;
    trainerLastName: string | null;
    dueDate: string;
    daysOverdue: number;
  }>;
  missingDocuments: Array<{
    documentId: number;
    documentTitle: string;
    documentType: string;
    missionId: number;
    missionTitle: string;
      trainerId: string;
    trainerFirstName: string | null;
    trainerLastName: string | null;
    templateTitle: string;
  }>;
}

// Get trainer delays for admin dashboard
export function useTrainerDelays() {
  return useQuery<TrainerDelay>({
    queryKey: ["trainerDelays"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trainer-delays", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch trainer delays");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}

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
