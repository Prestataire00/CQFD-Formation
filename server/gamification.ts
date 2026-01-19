export const XP_CONFIG = {
  MISSION_COMPLETED: 100,
  TASK_COMPLETED: 20,
  FIVE_STAR_EVALUATION: 50,
  DOCUMENT_UPLOADED: 10,
  STREAK_7: 150,
  STREAK_30: 500,
  BADGE_UNLOCK: 100,
  BONUS: 0
};

export const LEVELS = [
  { level: 1, minXP: 0, title: "Débutant" },
  { level: 2, minXP: 500, title: "Apprenti" },
  { level: 3, minXP: 1200, title: "Confirmé" },
  { level: 4, minXP: 2500, title: "Expert" },
  { level: 5, minXP: 5000, title: "Maître" }
];

export const DEFAULT_BADGES = [
  {
    name: "Pionnier",
    description: "Première connexion au CRM",
    icon: "🚀",
    category: "general",
    rarity: "common",
    condition: "Première connexion",
    conditionType: "login_count",
    conditionValue: 1,
    xpReward: 50
  }
];

export const gamificationService = {
  awardXP: async (userId: string, amount: number, actionType: string, reason: string) => {
    console.log(`Awarding ${amount} XP to ${userId} for ${actionType}`);
    return { levelUp: false, newLevel: 1 };
  },
  checkMissionBadges: async (userId: string) => {
    return [];
  }
};
