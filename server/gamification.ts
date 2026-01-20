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
  // Badges généraux
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
  },
  // Badges missions
  {
    name: "Première Mission",
    description: "Compléter sa première mission",
    icon: "🎯",
    category: "missions",
    rarity: "common",
    condition: "1 mission complétée",
    conditionType: "missions_completed",
    conditionValue: 1,
    xpReward: 100
  },
  {
    name: "Formateur Actif",
    description: "Compléter 5 missions",
    icon: "⭐",
    category: "missions",
    rarity: "common",
    condition: "5 missions complétées",
    conditionType: "missions_completed",
    conditionValue: 5,
    xpReward: 200
  },
  {
    name: "Expert Terrain",
    description: "Compléter 25 missions",
    icon: "🏆",
    category: "missions",
    rarity: "rare",
    condition: "25 missions complétées",
    conditionType: "missions_completed",
    conditionValue: 25,
    xpReward: 500
  },
  {
    name: "Maître Formateur",
    description: "Compléter 100 missions",
    icon: "👑",
    category: "missions",
    rarity: "legendary",
    condition: "100 missions complétées",
    conditionType: "missions_completed",
    conditionValue: 100,
    xpReward: 1000
  },
  // Badges tâches
  {
    name: "Organisé",
    description: "Compléter 10 tâches",
    icon: "✅",
    category: "tasks",
    rarity: "common",
    condition: "10 tâches complétées",
    conditionType: "tasks_completed",
    conditionValue: 10,
    xpReward: 75
  },
  {
    name: "Productif",
    description: "Compléter 50 tâches",
    icon: "📋",
    category: "tasks",
    rarity: "rare",
    condition: "50 tâches complétées",
    conditionType: "tasks_completed",
    conditionValue: 50,
    xpReward: 250
  },
  {
    name: "Machine de Guerre",
    description: "Compléter 200 tâches",
    icon: "⚡",
    category: "tasks",
    rarity: "epic",
    condition: "200 tâches complétées",
    conditionType: "tasks_completed",
    conditionValue: 200,
    xpReward: 600
  },
  // Badges évaluations
  {
    name: "Apprécié",
    description: "Recevoir une évaluation 5 étoiles",
    icon: "🌟",
    category: "evaluations",
    rarity: "common",
    condition: "1 évaluation 5 étoiles",
    conditionType: "five_star_evaluations",
    conditionValue: 1,
    xpReward: 100
  },
  {
    name: "Excellence",
    description: "Recevoir 10 évaluations 5 étoiles",
    icon: "💫",
    category: "evaluations",
    rarity: "rare",
    condition: "10 évaluations 5 étoiles",
    conditionType: "five_star_evaluations",
    conditionValue: 10,
    xpReward: 400
  },
  {
    name: "Perfectionniste",
    description: "Recevoir 50 évaluations 5 étoiles",
    icon: "🏅",
    category: "evaluations",
    rarity: "legendary",
    condition: "50 évaluations 5 étoiles",
    conditionType: "five_star_evaluations",
    conditionValue: 50,
    xpReward: 1000
  },
  // Badges documents
  {
    name: "Documentaliste",
    description: "Uploader 5 documents",
    icon: "📄",
    category: "documents",
    rarity: "common",
    condition: "5 documents uploadés",
    conditionType: "documents_uploaded",
    conditionValue: 5,
    xpReward: 75
  },
  {
    name: "Archiviste",
    description: "Uploader 25 documents",
    icon: "📚",
    category: "documents",
    rarity: "rare",
    condition: "25 documents uploadés",
    conditionType: "documents_uploaded",
    conditionValue: 25,
    xpReward: 300
  },
  {
    name: "Bibliothécaire",
    description: "Uploader 100 documents",
    icon: "🗄️",
    category: "documents",
    rarity: "epic",
    condition: "100 documents uploadés",
    conditionType: "documents_uploaded",
    conditionValue: 100,
    xpReward: 750
  },
  // Badges streaks
  {
    name: "Régulier",
    description: "7 jours consécutifs d'activité",
    icon: "🔥",
    category: "streaks",
    rarity: "common",
    condition: "7 jours de streak",
    conditionType: "streak_days",
    conditionValue: 7,
    xpReward: 150
  },
  {
    name: "Assidu",
    description: "30 jours consécutifs d'activité",
    icon: "💪",
    category: "streaks",
    rarity: "rare",
    condition: "30 jours de streak",
    conditionType: "streak_days",
    conditionValue: 30,
    xpReward: 500
  },
  {
    name: "Infatigable",
    description: "100 jours consécutifs d'activité",
    icon: "🌋",
    category: "streaks",
    rarity: "legendary",
    condition: "100 jours de streak",
    conditionType: "streak_days",
    conditionValue: 100,
    xpReward: 1500
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

  updateUserStreak: async (userId: string) => {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
    const lastActivityDay = lastActivity
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null;

    let newStreakDays = user.streakDays || 0;
    let streakBroken = false;
    let streakIncreased = false;

    if (!lastActivityDay) {
      // First activity ever
      newStreakDays = 1;
      streakIncreased = true;
    } else {
      const diffTime = today.getTime() - lastActivityDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreakDays += 1;
        streakIncreased = true;
      } else {
        // Streak broken, reset to 1
        newStreakDays = 1;
        streakBroken = true;
        streakIncreased = true;
      }
    }

    // Update user's streak data
    await storage.updateUserStreak(userId, newStreakDays, now);

    // Award XP for streak milestones
    if (streakIncreased && !streakBroken) {
      if (newStreakDays === 7) {
        await storage.createXPTransaction({
          userId,
          amount: XP_CONFIG.STREAK_7,
          actionType: 'streak_milestone',
          reason: 'Série de 7 jours consécutifs!',
          entityType: null,
          entityId: null,
        });
      } else if (newStreakDays === 30) {
        await storage.createXPTransaction({
          userId,
          amount: XP_CONFIG.STREAK_30,
          actionType: 'streak_milestone',
          reason: 'Série de 30 jours consécutifs!',
          entityType: null,
          entityId: null,
        });
      }
    }

    return {
      streakDays: newStreakDays,
      streakBroken,
      streakIncreased
    };
  },
};
