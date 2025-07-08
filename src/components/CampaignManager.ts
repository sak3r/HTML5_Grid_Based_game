import { CampaignProgress, LevelCompletionResult, LevelCampaign } from '../types/GameTypes';
import { CAMPAIGN_LEVELS, ACHIEVEMENT_DEFINITIONS } from '../config/CampaignConfig';

export class CampaignManager {
  private static readonly STORAGE_KEY = 'campaign_progress';

  static loadProgress(): CampaignProgress {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        return {
          ...progress,
          lastPlayed: progress.lastPlayed || new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to load campaign progress:', error);
    }

    // Return default progress
    return {
      currentLevel: 0,
      completedLevels: [],
      unlockedLevels: [0], // First level is always unlocked
      totalScore: 0,
      unlockedHeroes: ['warrior', 'scout', 'tank'], // Starting heroes
      unlockedWeapons: [],
      achievements: [],
      bestTimes: {},
      bestScores: {},
      lastPlayed: new Date().toISOString(),
    };
  }

  static saveProgress(progress: CampaignProgress): void {
    try {
      progress.lastPlayed = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save campaign progress:', error);
    }
  }

  static completeLevel(
    progress: CampaignProgress,
    result: LevelCompletionResult
  ): CampaignProgress {
    const newProgress = { ...progress };

    // Mark level as completed
    if (!newProgress.completedLevels.includes(result.levelId)) {
      newProgress.completedLevels.push(result.levelId);
    }

    // Update scores and times
    newProgress.totalScore += result.score;
    
    if (!newProgress.bestScores[result.levelId] || result.score > newProgress.bestScores[result.levelId]) {
      newProgress.bestScores[result.levelId] = result.score;
    }
    
    if (!newProgress.bestTimes[result.levelId] || result.timeElapsed < newProgress.bestTimes[result.levelId]) {
      newProgress.bestTimes[result.levelId] = result.timeElapsed;
    }

    // Unlock new content
    newProgress.unlockedHeroes = [...new Set([...newProgress.unlockedHeroes, ...result.newUnlocks.heroes])];
    newProgress.unlockedWeapons = [...new Set([...newProgress.unlockedWeapons, ...result.newUnlocks.weapons])];
    newProgress.achievements = [...new Set([...newProgress.achievements, ...result.newUnlocks.achievements])];

    // Unlock next levels
    const nextLevelIndex = result.levelId + 1;
    if (nextLevelIndex < CAMPAIGN_LEVELS.length) {
      const nextLevel = CAMPAIGN_LEVELS[nextLevelIndex];
      if (this.checkUnlockConditions(newProgress, nextLevel)) {
        if (!newProgress.unlockedLevels.includes(nextLevelIndex)) {
          newProgress.unlockedLevels.push(nextLevelIndex);
        }
      }
    }

    // Update current level
    if (result.levelId >= newProgress.currentLevel) {
      newProgress.currentLevel = Math.min(result.levelId + 1, CAMPAIGN_LEVELS.length - 1);
    }

    return newProgress;
  }

  static checkUnlockConditions(progress: CampaignProgress, level: LevelCampaign): boolean {
    const conditions = level.unlockConditions;

    // Check required level
    if (progress.currentLevel < conditions.requiredLevel) {
      return false;
    }

    // Check required score
    if (conditions.requiredScore && progress.totalScore < conditions.requiredScore) {
      return false;
    }

    // Check required time (best time on any level)
    if (conditions.requiredTime) {
      const bestTime = Math.min(...Object.values(progress.bestTimes));
      if (!bestTime || bestTime > conditions.requiredTime) {
        return false;
      }
    }

    // Check if must rescue all captives
    if (conditions.mustRescueAll) {
      // This would need to be tracked per level completion
      // For now, assume it's met if the player has the rescue achievement
      if (!progress.achievements.includes('Rescue Master')) {
        return false;
      }
    }

    return true;
  }

  static getLevelProgress(progress: CampaignProgress, levelIndex: number): {
    isUnlocked: boolean;
    isCompleted: boolean;
    bestScore: number | null;
    bestTime: number | null;
    stars: number;
  } {
    const isUnlocked = progress.unlockedLevels.includes(levelIndex);
    const isCompleted = progress.completedLevels.includes(levelIndex);
    const bestScore = progress.bestScores[levelIndex] || null;
    const bestTime = progress.bestTimes[levelIndex] || null;

    // Calculate stars based on performance
    let stars = 0;
    if (isCompleted) {
      stars = 1; // Base completion star
      
      const level = CAMPAIGN_LEVELS[levelIndex];
      if (bestTime && bestTime <= level.difficultyScaling.timeLimit * 0.5) {
        stars = 3; // Perfect time
      } else if (bestTime && bestTime <= level.difficultyScaling.timeLimit * 0.75) {
        stars = 2; // Good time
      }
    }

    return {
      isUnlocked,
      isCompleted,
      bestScore,
      bestTime,
      stars,
    };
  }

  static calculateLevelRewards(
    levelIndex: number,
    score: number,
    timeElapsed: number,
    allCaptivesRescued: boolean,
    perfectRun: boolean
  ): LevelCompletionResult['newUnlocks'] {
    const level = CAMPAIGN_LEVELS[levelIndex];
    const rewards = level.rewards;

    const newUnlocks = {
      heroes: [...(rewards.unlockedHeroes || [])],
      weapons: [...(rewards.unlockedWeapons || [])],
      achievements: [...(rewards.achievements || [])],
    };

    // Add conditional achievements
    if (perfectRun) {
      newUnlocks.achievements.push('Perfect Cooperation');
    }

    if (timeElapsed <= level.difficultyScaling.timeLimit * 0.5) {
      newUnlocks.achievements.push('Speed Runner');
    }

    if (allCaptivesRescued) {
      newUnlocks.achievements.push('Rescue Master');
    }

    return newUnlocks;
  }

  static getAchievementInfo(achievementId: string) {
    return ACHIEVEMENT_DEFINITIONS[achievementId] || {
      name: achievementId,
      description: 'Unknown achievement',
      icon: '🏆',
      points: 0,
    };
  }

  static getTotalAchievementPoints(achievements: string[]): number {
    return achievements.reduce((total, achievementId) => {
      const achievement = this.getAchievementInfo(achievementId);
      return total + achievement.points;
    }, 0);
  }

  static getCompletionPercentage(progress: CampaignProgress): number {
    return Math.round((progress.completedLevels.length / CAMPAIGN_LEVELS.length) * 100);
  }

  static resetProgress(): CampaignProgress {
    const defaultProgress = {
      currentLevel: 0,
      completedLevels: [],
      unlockedLevels: [0],
      totalScore: 0,
      unlockedHeroes: ['warrior', 'scout', 'tank'],
      unlockedWeapons: [],
      achievements: [],
      bestTimes: {},
      bestScores: {},
      lastPlayed: new Date().toISOString(),
    };

    this.saveProgress(defaultProgress);
    return defaultProgress;
  }
}