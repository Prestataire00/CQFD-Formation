import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useGamification(userId?: string) {
  return useQuery({
    queryKey: ["/api/gamification/user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/gamification/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch gamification data");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useAwardXP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; actionType: string; reason: string; entityType?: string; entityId?: number }) => {
      const res = await apiRequest("POST", "/api/gamification/award-xp", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/user"] });
    },
  });
}
