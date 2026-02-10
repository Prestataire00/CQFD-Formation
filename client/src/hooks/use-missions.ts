import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMission, InsertClient, InsertParticipant, InsertInvoice, MissionStatus } from "@shared/schema";

// ==========================================
// Stats
// ==========================================
export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

// ==========================================
// Missions
// ==========================================
export function useMissions() {
  return useQuery({
    queryKey: [api.missions.list.path],
    queryFn: async () => {
      const res = await fetch(api.missions.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch missions");
      return res.json();
    },
  });
}

export function useMission(id: number) {
  return useQuery({
    queryKey: [api.missions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.missions.get.path, { id });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMission) => {
      const res = await fetch(api.missions.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(errorData.message || "Failed to create mission");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMission> }) => {
      const url = buildUrl(api.missions.update.path, { id });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update mission");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.missions.get.path, id] });
    },
  });
}

export function useUpdateMissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MissionStatus }) => {
      const url = buildUrl(api.missions.updateStatus.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err: any = new Error(data.message || "Failed to update mission status");
        err.data = data;
        throw err;
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.missions.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

// Mission Participants
export function useMissionParticipants(missionId: number) {
  return useQuery({
    queryKey: [api.missions.participants.list.path, missionId],
    queryFn: async () => {
      const url = buildUrl(api.missions.participants.list.path, { id: missionId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission participants");
      return res.json();
    },
    enabled: !!missionId,
  });
}

export function useAddParticipantToMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, participantId }: { missionId: number; participantId: number }) => {
      const url = buildUrl(api.missions.participants.add.path, { id: missionId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) throw new Error("Failed to add participant");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.participants.list.path, missionId] });
    },
  });
}

export function useUpdateMissionParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, participantId, data }: {
      missionId: number;
      participantId: number;
      data: {
        status?: string;
        convocationSentAt?: string | null;
        attendanceValidated?: boolean;
        certificateGeneratedAt?: string | null;
        positioningQuestionnaireSentAt?: string | null;
        positioningQuestionnaireReceivedAt?: string | null;
        evaluationSentAt?: string | null;
        evaluationReceivedAt?: string | null;
      }
    }) => {
      const url = buildUrl(api.missions.participants.update.path, { missionId, participantId });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update participant");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.participants.list.path, missionId] });
    },
  });
}

export function useRemoveParticipantFromMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, participantId }: { missionId: number; participantId: number }) => {
      const url = buildUrl(api.missions.participants.remove.path, { missionId, participantId });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to remove participant");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.participants.list.path, missionId] });
    },
  });
}

// Mission Trainers (multi-trainers support)
export function useMissionTrainers(missionId: number) {
  return useQuery({
    queryKey: ['mission-trainers', missionId],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${missionId}/trainers`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission trainers");
      return res.json();
    },
    enabled: !!missionId,
  });
}

export function useAddTrainerToMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, trainerId, isPrimary }: { missionId: number; trainerId: string; isPrimary?: boolean }) => {
      const res = await fetch(`/api/missions/${missionId}/trainers`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ trainerId, isPrimary }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add trainer");
      }
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: ['mission-trainers', missionId] });
    },
  });
}

export function useRemoveTrainerFromMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, trainerId }: { missionId: number; trainerId: string }) => {
      const res = await fetch(`/api/missions/${missionId}/trainers/${trainerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to remove trainer");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: ['mission-trainers', missionId] });
    },
  });
}

export function useSetMissionPrimaryTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, trainerId }: { missionId: number; trainerId: string }) => {
      const res = await fetch(`/api/missions/${missionId}/trainers/${trainerId}/primary`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to set primary trainer");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: ['mission-trainers', missionId] });
    },
  });
}

// ==========================================
// Multi-Trainer Assignment (sans duplication)
// ==========================================
export function useAssignMultipleTrainers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, trainerIds }: { missionId: number; trainerIds: string[] }) => {
      const res = await fetch(`/api/missions/${missionId}/assign-trainers`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ trainerIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign trainers");
      }
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: ['mission-trainers', missionId] });
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
    },
  });
}

// ==========================================
// Multi-Trainer Duplication (legacy)
// ==========================================
export function useDuplicateMissionMulti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, trainerIds }: { missionId: number; trainerIds: string[] }) => {
      const res = await fetch(`/api/missions/${missionId}/duplicate-multi`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ trainerIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to duplicate mission");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useChildMissions(parentMissionId: number) {
  return useQuery({
    queryKey: ['mission-children', parentMissionId],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${parentMissionId}/children`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch child missions");
      return res.json();
    },
    enabled: !!parentMissionId,
  });
}

export function useParentMission(missionId: number, hasParent: boolean) {
  return useQuery({
    queryKey: ['mission-parent', missionId],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${missionId}/parent`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch parent mission");
      }
      return res.json();
    },
    enabled: !!missionId && hasParent,
  });
}

export function useSyncMissionChildren() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, fields }: { missionId: number; fields?: string[] }) => {
      const res = await fetch(`/api/missions/${missionId}/sync-children`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error("Failed to sync missions");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: ['mission-children', missionId] });
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
    },
  });
}

// Mission Steps (étapes chronologiques)
export function useMissionSteps(missionId: number) {
  return useQuery({
    queryKey: [api.missions.steps.list.path, missionId],
    queryFn: async () => {
      const url = buildUrl(api.missions.steps.list.path, { id: missionId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission steps");
      return res.json();
    },
    enabled: !!missionId,
  });
}

export function useCreateMissionStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, data }: { missionId: number; data: { title: string; status: string; order: number; dueDate?: string | null; lateDate?: string | null; assigneeId?: string | null } }) => {
      const url = buildUrl(api.missions.steps.create.path, { id: missionId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create step");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.list.path, missionId] });
    },
  });
}

export function useUpdateMissionStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, stepId, data }: { missionId: number; stepId: number; data: { title?: string; status?: string; order?: number; dueDate?: string | null; lateDate?: string | null } }) => {
      const url = buildUrl(api.missions.steps.update.path, { missionId, stepId });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update step");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.list.path, missionId] });
    },
  });
}

export function useDeleteMissionStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, stepId }: { missionId: number; stepId: number }) => {
      const url = buildUrl(api.missions.steps.delete.path, { missionId, stepId });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete step");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.list.path, missionId] });
    },
  });
}

// Step Tasks (taches des etapes)
export function useStepTasks(stepId: number) {
  return useQuery({
    queryKey: [api.missions.steps.tasks.list.path, stepId],
    queryFn: async () => {
      const url = buildUrl(api.missions.steps.tasks.list.path, { stepId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch step tasks");
      return res.json();
    },
    enabled: !!stepId,
  });
}

export function useCreateStepTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, data }: { stepId: number; data: { title: string; order: number; comment?: string | null } }) => {
      const url = buildUrl(api.missions.steps.tasks.create.path, { stepId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.tasks.list.path, stepId] });
    },
  });
}

export function useUpdateStepTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, taskId, data }: { stepId: number; taskId: number; data: { title?: string; isCompleted?: boolean; comment?: string | null; order?: number } }) => {
      const url = buildUrl(api.missions.steps.tasks.update.path, { stepId, taskId });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.tasks.list.path, stepId] });
    },
  });
}

export function useDeleteStepTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, taskId }: { stepId: number; taskId: number }) => {
      const url = buildUrl(api.missions.steps.tasks.delete.path, { stepId, taskId });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.steps.tasks.list.path, stepId] });
    },
  });
}

// All Mission Sessions (for calendar & cards)
export function useAllSessions() {
  return useQuery({
    queryKey: ['/api/sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch all sessions");
      return res.json();
    },
  });
}

// Mission Sessions
export function useMissionSessions(missionId: number) {
  return useQuery({
    queryKey: [api.missions.sessions.list.path, missionId],
    queryFn: async () => {
      const url = buildUrl(api.missions.sessions.list.path, { id: missionId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission sessions");
      return res.json();
    },
    enabled: !!missionId,
  });
}

export function useCreateMissionSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, data }: { missionId: number; data: { sessionDate: string; startTime?: string; endTime?: string; location?: string } }) => {
      const url = buildUrl(api.missions.sessions.create.path, { id: missionId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.sessions.list.path, missionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.missions.get.path, missionId] });
    },
  });
}

export function useUpdateMissionSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, sessionId, data }: { missionId: number; sessionId: number; data: { sessionDate?: string; startTime?: string; endTime?: string; location?: string } }) => {
      const url = buildUrl(api.missions.sessions.update.path, { id: missionId, sessionId });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update session");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.sessions.list.path, missionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.missions.get.path, missionId] });
    },
  });
}

export function useDeleteMissionSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, sessionId }: { missionId: number; sessionId: number }) => {
      const url = buildUrl(api.missions.sessions.delete.path, { id: missionId, sessionId });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete session");
      return res.json();
    },
    onSuccess: (_, { missionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.missions.sessions.list.path, missionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: [api.missions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.missions.get.path, missionId] });
    },
  });
}

// Mission Attendance
export function useMissionAttendance(missionId: number) {
  return useQuery({
    queryKey: [api.missions.attendance.list.path, missionId],
    queryFn: async () => {
      const url = buildUrl(api.missions.attendance.list.path, { id: missionId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch attendance records");
      return res.json();
    },
    enabled: !!missionId,
  });
}

// Mission Documents
export function useMissionDocuments(missionId: number) {
  return useQuery({
    queryKey: [api.missions.documents.list.path, missionId],
    queryFn: async () => {
      const url = buildUrl(api.missions.documents.list.path, { id: missionId });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch mission documents");
      return res.json();
    },
    enabled: !!missionId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, data }: { missionId: number; data: any }) => {
      const res = await fetch(api.documents.create.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, missionId }),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.missions.documents.list.path, variables.missionId]
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, missionId }: { id: number; missionId: number }) => {
      const url = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.missions.documents.list.path, variables.missionId]
      });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file, missionId }: { id: number; file: File; missionId: number }) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/documents/${id}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.missions.documents.list.path, variables.missionId]
      });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, missionId }: { id: number; data: any; missionId: number }) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.missions.documents.list.path, variables.missionId]
      });
    },
  });
}

// ==========================================
// Clients
// ==========================================
export function useClients() {
  return useQuery({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      const res = await fetch(api.clients.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await fetch(api.clients.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create client");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    },
  });
}

// ==========================================
// Training Programs
// ==========================================
export function usePrograms() {
  return useQuery({
    queryKey: [api.programs.list.path],
    queryFn: async () => {
      const res = await fetch(api.programs.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });
}

// ==========================================
// Participants
// ==========================================
export function useParticipants() {
  return useQuery({
    queryKey: [api.participants.list.path],
    queryFn: async () => {
      const res = await fetch(api.participants.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertParticipant) => {
      const res = await fetch(api.participants.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create participant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.participants.list.path] });
    },
  });
}

// ==========================================
// Users / Trainers
// ==========================================
export function useTrainers() {
  return useQuery({
    queryKey: [api.users.trainers.path],
    queryFn: async () => {
      const res = await fetch(api.users.trainers.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch trainers");
      return res.json();
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

// ==========================================
// Invoices
// ==========================================
export function useInvoices() {
  return useQuery({
    queryKey: [api.invoices.list.path],
    queryFn: async () => {
      const res = await fetch(api.invoices.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const res = await fetch(api.invoices.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.invoices.approve.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to approve invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useRejectInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const url = buildUrl(api.invoices.reject.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to reject invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.invoices.markPaid.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to mark invoice as paid");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

// ==========================================
// Documents
// ==========================================
export function useDocuments() {
  return useQuery({
    queryKey: [api.documents.list.path],
    queryFn: async () => {
      const res = await fetch(api.documents.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });
}
