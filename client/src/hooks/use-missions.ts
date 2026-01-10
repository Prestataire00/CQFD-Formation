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
      if (!res.ok) throw new Error("Failed to create mission");
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
      if (!res.ok) throw new Error("Failed to update mission status");
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
