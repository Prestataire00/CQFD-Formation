import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentTemplate } from "@shared/schema";

// Get all templates (admin only)
export function useDocumentTemplates() {
  return useQuery<DocumentTemplate[]>({
    queryKey: ["documentTemplates"],
    queryFn: async () => {
      const res = await fetch("/api/document-templates", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

// Get single template
export function useDocumentTemplate(id: number) {
  return useQuery<DocumentTemplate>({
    queryKey: ["documentTemplate", id],
    queryFn: async () => {
      const res = await fetch(`/api/document-templates/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
    enabled: !!id,
  });
}

// Create template
export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/document-templates", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
    },
  });
}

// Update template
export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const res = await fetch(`/api/document-templates/${id}`, {
        method: "PUT",
        credentials: "include",
        body: data,
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
    },
  });
}

// Delete template
export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/document-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
    },
  });
}

// Get template versions
export function useTemplateVersions(templateId: number) {
  return useQuery({
    queryKey: ["templateVersions", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/document-templates/${templateId}/versions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!templateId,
  });
}

// Get template notifications (for trainers)
export function useTemplateNotifications() {
  return useQuery({
    queryKey: ["templateNotifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/templates", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateNotifications"] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateNotifications"] });
    },
  });
}
