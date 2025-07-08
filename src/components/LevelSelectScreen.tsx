import React, { useState, useEffect } from 'react';
import { CampaignProgress, HeroType } from '../types/GameTypes';
import { CampaignManager } from './CampaignManager';
import { CAMPAIGN_LEVELS } from '../config/CampaignConfig';
import { 
  Play, 
  Lock, 
  Star, 
  Trophy, 
  Clock, 
  Target,
  ArrowLeft,
  RotateCcw,
  Award,
  Medal,
  Crown
} from 'lucide-react';

interface LevelSelectScreenProps {
  onLevelSelect: (levelIndex: number) => void;
  onBackToMenu: () => void;
  campaignProgress: CampaignProgress;
  onProgressUpdate: (progress: CampaignProgress) => void;
}

const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  onLevelSelect,
  onBackToMenu,
  campaignProgress,
  onProgressUpdate,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      case 'expert': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      case 'expert': return '🟣';
      default: return '⚪';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all campaign progress? This cannot be undone.')) {
      const newProgress = CampaignManager.resetProgress();
      onProgressUpdate(newProgress);
    }
  };

  const completionPercentage = CampaignManager.getCompletionPercentage(campaignProgress);
  const totalAchievementPoints = CampaignManager.getTotalAchievementPoints(campaignProgress.achievements);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBackToMenu}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Menu</span>
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Campaign Mode</h1>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
              <span>Progress: {completionPercentage}%</span>
              <span>•</span>
              <span>Total Score: {campaignProgress.totalScore.toLocaleString()}</span>
              <span>•</span>
              <span>Achievement Points: {totalAchievementPoints}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600/20 backdrop-blur-sm rounded-lg border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors text-yellow-300"
            >
              <Trophy className="w-5 h-5" />
              <span>Achievements</span>
            </button>
            <button
              onClick={handleResetProgress}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 backdrop-blur-sm rounded-lg border border-red-500/30 hover:bg-red-600/30 transition-colors text-red-300"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Campaign Progress</span>
            <span className="text-white font-bold">{campaignProgress.completedLevels.length}/{CAMPAIGN_LEVELS.length} Levels</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Achievements Panel */}
        {showAchievements && (
          <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>Achievements ({campaignProgress.achievements.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignProgress.achievements.map((achievementId) => {
                const achievement = CampaignManager.getAchievementInfo(achievementId);
                return (
                  <div
                    key={achievementId}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">{achievement.name}</h3>
                        <p className="text-sm text-gray-300">{achievement.description}</p>
                        <span className="text-xs text-yellow-400">{achievement.points} points</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CAMPAIGN_LEVELS.map((level, index) => {
            const progress = CampaignManager.getLevelProgress(campaignProgress, index);
            const isSelected = selectedLevel === index;

            return (
              <div
                key={level.id}
                className={`relative bg-white/10 backdrop-blur-sm rounded-lg border transition-all duration-300 cursor-pointer ${
                  progress.isUnlocked
                    ? isSelected
                      ? 'border-blue-500 bg-blue-500/20 scale-105'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/15'
                    : 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-60'
                }`}
                onClick={() => progress.isUnlocked && setSelectedLevel(index)}
              >
                {/* Lock Overlay */}
                {!progress.isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Lock className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="p-6">
                  {/* Level Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getDifficultyIcon(level.difficulty)}</span>
                      <span className="text-white font-bold">Level {index + 1}</span>
                    </div>
                    {progress.isCompleted && (
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: progress.stars }, (_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level Info */}
                  <h3 className="text-lg font-bold text-white mb-2">{level.name}</h3>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{level.description}</p>

                  {/* Difficulty Badge */}
                  <div className="mb-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(level.difficulty)}`}>
                      {level.difficulty.toUpperCase()}
                    </span>
                  </div>

                  {/* Stats */}
                  {progress.isUnlocked && (
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>Enemies:</span>
                        <span>{level.difficultyScaling.enemyCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Time Limit:</span>
                        <span>{formatTime(level.difficultyScaling.timeLimit)}</span>
                      </div>
                      {progress.bestScore && (
                        <div className="flex items-center justify-between">
                          <span>Best Score:</span>
                          <span className="text-yellow-400">{progress.bestScore.toLocaleString()}</span>
                        </div>
                      )}
                      {progress.bestTime && (
                        <div className="flex items-center justify-between">
                          <span>Best Time:</span>
                          <span className="text-green-400">{formatTime(progress.bestTime)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rewards Preview */}
                  {level.rewards.unlockedHeroes && level.rewards.unlockedHeroes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Unlocks:</div>
                      <div className="flex flex-wrap gap-1">
                        {level.rewards.unlockedHeroes.map((heroId) => (
                          <span key={heroId} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                            {heroId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Play Button */}
                {progress.isUnlocked && isSelected && (
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLevelSelect(index);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Play</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Level Details */}
        {selectedLevel !== null && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {CAMPAIGN_LEVELS[selectedLevel].name}
                </h2>
                <p className="text-gray-300 mb-4">
                  {CAMPAIGN_LEVELS[selectedLevel].description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Enemies: {CAMPAIGN_LEVELS[selectedLevel].difficultyScaling.enemyCount}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">Time Limit: {formatTime(CAMPAIGN_LEVELS[selectedLevel].difficultyScaling.timeLimit)}</span>
                  </div>
                  {CAMPAIGN_LEVELS[selectedLevel].difficultyScaling.additionalObjectives && (
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <span className="text-white block">Additional Objectives:</span>
                        <ul className="text-sm text-gray-300 mt-1">
                          {CAMPAIGN_LEVELS[selectedLevel].difficultyScaling.additionalObjectives!.map((objective, i) => (
                            <li key={i}>• {objective}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Rewards</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Medal className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">Score Bonus: {CAMPAIGN_LEVELS[selectedLevel].rewards.bonusScore.toLocaleString()}</span>
                  </div>
                  
                  {CAMPAIGN_LEVELS[selectedLevel].rewards.unlockedHeroes && (
                    <div className="flex items-start space-x-3">
                      <Crown className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <span className="text-white block">Unlocked Heroes:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {CAMPAIGN_LEVELS[selectedLevel].rewards.unlockedHeroes!.map((heroId) => (
                            <span key={heroId} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                              {heroId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {CAMPAIGN_LEVELS[selectedLevel].rewards.achievements && (
                    <div className="flex items-start space-x-3">
                      <Trophy className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <span className="text-white block">Achievements:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {CAMPAIGN_LEVELS[selectedLevel].rewards.achievements!.map((achievementId) => {
                            const achievement = CampaignManager.getAchievementInfo(achievementId);
                            return (
                              <span key={achievementId} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-sm">
                                {achievement.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelSelectScreen;