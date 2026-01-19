import { storage } from "./storage";

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

function calculateLevel(totalXP: number): { level: number; title: string } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      return { level: LEVELS[i].level, title: LEVELS[i].title };
    }
  }
  return { level: 1, title: LEVELS[0].title };
}

export const gamificationService = {
  awardXP: async (userId: string, amount: number, actionType: string, reason: string, entityType?: string, entityId?: number) => {
    // Create XP transaction
    await storage.createXPTransaction({
      userId,
      amount,
      actionType,
      reason,
      entityType: entityType || null,
      entityId: entityId || null,
    });

    // Calculate new total and check for level up
    const transactions = await storage.getXPTransactions(userId);
    const totalXP = transactions.reduce((sum, t) => sum + t.amount, 0);
    const { level: newLevel } = calculateLevel(totalXP);

    // Get previous level
    const previousXP = totalXP - amount;
    const { level: previousLevel } = calculateLevel(previousXP);
    const levelUp = newLevel > previousLevel;

    return { levelUp, newLevel };
  },

  checkMissionBadges: async (userId: string) => {
    const stats = await storage.getUserGamificationStats(userId);
    const allBadges = await storage.getBadges();
    const userBadges = await storage.getUserBadges(userId);
    const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    const newlyUnlocked = [];

    for (const badge of allBadges) {
      if (unlockedBadgeIds.has(badge.id)) continue;

      let shouldUnlock = false;
      switch (badge.conditionType) {
        case 'missions_completed':
          shouldUnlock = stats.completedMissions >= badge.conditionValue;
          break;
        case 'tasks_completed':
          shouldUnlock = stats.completedTasks >= badge.conditionValue;
          break;
        case 'five_star_evaluations':
          shouldUnlock = stats.fiveStarEvaluations >= badge.conditionValue;
          break;
        case 'documents_uploaded':
          shouldUnlock = stats.documentsUploaded >= badge.conditionValue;
          break;
      }

      if (shouldUnlock) {
        await storage.unlockBadge(userId, badge.id);
        newlyUnlocked.push(badge);

        // Award XP for badge unlock
        if (badge.xpReward && badge.xpReward > 0) {
          await storage.createXPTransaction({
            userId,
            amount: badge.xpReward,
            actionType: 'badge_unlocked',
            reason: `Badge débloqué: ${badge.name}`,
            entityType: 'badge',
            entityId: badge.id,
          });
        }
      }
    }

    return newlyUnlocked;
  },

  getUserProfile: async (userId: string) => {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const transactions = await storage.getXPTransactions(userId);
    const totalXP = transactions.reduce((sum, t) => sum + t.amount, 0);
    const { level, title } = calculateLevel(totalXP);

    // Calculate XP needed for next level
    const currentLevelIndex = LEVELS.findIndex(l => l.level === level);
    const nextLevel = LEVELS[currentLevelIndex + 1];
    const xpForNextLevel = nextLevel ? nextLevel.minXP - totalXP : 0;
    const currentLevelMinXP = LEVELS[currentLevelIndex].minXP;
    const nextLevelMinXP = nextLevel ? nextLevel.minXP : currentLevelMinXP;
    const progressToNextLevel = nextLevel
      ? ((totalXP - currentLevelMinXP) / (nextLevelMinXP - currentLevelMinXP)) * 100
      : 100;

    const userBadges = await storage.getUserBadges(userId);
    const recentTransactions = await storage.getRecentXPTransactions(userId, 10);
    const stats = await storage.getUserGamificationStats(userId);

    return {
      userId,
      totalXP,
      level,
      levelTitle: title,
      xpForNextLevel,
      progressToNextLevel: Math.round(progressToNextLevel),
      badgeCount: userBadges.length,
      recentXP: recentTransactions,
      stats,
    };
  },

  getUnnotifiedBadges: async (userId: string) => {
    return await storage.getUnnotifiedBadges(userId);
  },

  markBadgeNotified: async (userBadgeId: number) => {
    await storage.markBadgeNotified(userBadgeId);
  },
};
