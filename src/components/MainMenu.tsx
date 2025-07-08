import React from 'react';
import { Play, Users, Edit, Trophy, Settings, Info } from 'lucide-react';

interface MainMenuProps {
  onStartCampaign: () => void;
  onStartCooperative: () => void;
  onStartEditor: () => void;
  onShowAchievements: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStartCampaign,
  onStartCooperative,
  onStartEditor,
  onShowAchievements,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Grid Warriors
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Cooperative tactical combat in a grid-based world. Work together to rescue allies and defeat enemies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Campaign Mode */}
        <button
          onClick={onStartCampaign}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
            <Play className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Campaign Mode</h2>
          <p className="text-gray-300 text-sm">
            Progress through challenging levels with increasing difficulty. Unlock new heroes and weapons as you advance.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>• Progressive Difficulty</span>
            <span>• Unlockable Content</span>
            <span>• Achievements</span>
          </div>
        </button>

        {/* Cooperative Mode */}
        <button
          onClick={onStartCooperative}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cooperative Play</h2>
          <p className="text-gray-300 text-sm">
            Team up with a friend for local 2-player cooperative gameplay. Work together to achieve victory.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>• 2-Player Local</span>
            <span>• Shared Objectives</span>
            <span>• Team Strategy</span>
          </div>
        </button>

        {/* Level Editor */}
        <button
          onClick={onStartEditor}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
            <Edit className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Level Editor</h2>
          <p className="text-gray-300 text-sm">
            Create and customize your own levels. Design challenging scenarios and share them with others.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>• Custom Levels</span>
            <span>• Save & Load</span>
            <span>• Export/Import</span>
          </div>
        </button>

        {/* Achievements */}
        <button
          onClick={onShowAchievements}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mx-auto mb-4 group-hover:bg-yellow-500/30 transition-colors">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Achievements</h2>
          <p className="text-gray-300 text-sm">
            View your progress, unlocked achievements, and campaign statistics. Track your mastery.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>• Progress Tracking</span>
            <span>• Statistics</span>
            <span>• Rewards</span>
          </div>
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm max-w-2xl mx-auto">
          💡 <strong>Pro Tip:</strong> Start with Campaign Mode to learn the mechanics, then challenge yourself 
          with Cooperative Play or create custom scenarios in the Level Editor!
        </p>
      </div>
    </div>
  );
};

export default MainMenu;