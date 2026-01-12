import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  specialties?: string[] | null;
  dailyRate?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur de récupération des utilisateurs');
      return res.json();
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur de récupération de l\'utilisateur');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: 'admin' | 'formateur' | 'prestataire';
      phone?: string;
      address?: string;
      siret?: string;
      specialties?: string[];
      dailyRate?: number;
    }) => {
      const res = await fetch(api.users.create.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur de création');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...userData }: {
      id: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      phone?: string;
      address?: string;
      siret?: string;
      specialties?: string[];
      dailyRate?: number;
      role?: 'admin' | 'formateur' | 'prestataire';
      status?: 'ACTIF' | 'INACTIF' | 'SUPPRIME';
    }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur de mise à jour');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.users.delete.path, { id });
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur de suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
