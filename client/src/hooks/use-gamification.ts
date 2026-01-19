import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useGamificationProfile(userId?: string) {
  return useQuery({
    queryKey: ["/api/gamification/profile", userId],
    queryFn: async () => {
      const url = userId ? `/api/gamification/profile/${userId}` : '/api/gamification/profile';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch gamification profile");
      return res.json();
    },
  });
}

// Alias for backward compatibility
export const useGamification = useGamificationProfile;

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
