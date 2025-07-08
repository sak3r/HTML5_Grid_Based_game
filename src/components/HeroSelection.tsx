import React from 'react';
import { HeroType, CampaignProgress } from '../types/GameTypes';
import { HERO_TYPES, WEAPON_CONFIGS } from '../config/GameConfig';
import { CampaignManager } from './CampaignManager';
import { Shield, Zap, Heart } from 'lucide-react';

interface HeroSelectionProps {
  onHeroSelect: (heroType: HeroType) => void;
  gameMode?: 'campaign' | 'cooperative' | 'editor';
  campaignProgress?: CampaignProgress;
}

const HeroSelection: React.FC<HeroSelectionProps> = ({ 
  onHeroSelect, 
  gameMode = 'cooperative',
  campaignProgress 
}) => {
  const getHeroIcon = (heroId: string) => {
    switch (heroId) {
      case 'warrior':
        return <Shield className="w-12 h-12" />;
      case 'scout':
        return <Zap className="w-12 h-12" />;
      case 'tank':
        return <Heart className="w-12 h-12" />;
      default:
        return <Shield className="w-12 h-12" />;
    }
  };

  const getStatColor = (value: number, type: 'health' | 'speed' | 'cooldown') => {
    if (type === 'health') {
      if (value >= 5) return 'text-green-600';
      if (value >= 3) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'speed') {
      if (value <= 300) return 'text-green-600';
      if (value <= 500) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'cooldown') {
      if (value <= 200) return 'text-green-600';
      if (value <= 300) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const isHeroUnlocked = (heroId: string): boolean => {
    if (gameMode !== 'campaign' || !campaignProgress) return true;
    return campaignProgress.unlockedHeroes.includes(heroId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {gameMode === 'campaign' ? 'Choose Campaign Hero' : 'Choose Your Heroes'}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {gameMode === 'campaign' 
            ? 'Select a hero for the campaign mission. Unlock new heroes by completing levels.'
            : 'Select heroes for 2-player cooperative gameplay. Both players will start with the same character type and work together to achieve victory.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {HERO_TYPES.map((hero) => {
              const isUnlocked = isHeroUnlocked(hero.id);
              
              return (
            <div
              key={hero.id}
              onClick={() => isUnlocked && onHeroSelect(hero)}
              className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${
                isUnlocked
                  ? 'border-white/20 hover:border-white/40 cursor-pointer hover:scale-105 hover:bg-white/15'
                  : 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Lock Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔒</div>
                    <div className="text-white font-medium">Locked</div>
                    <div className="text-gray-400 text-xs">Complete campaign levels to unlock</div>
                  </div>
                </div>
              )}

              {/* Hero Icon */}
              <div 
                className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: hero.color, borderColor: hero.borderColor, borderWidth: '3px' }}
              >
                <div className="text-white">
                  {getHeroIcon(hero.id)}
                </div>
              </div>

              {/* Hero Name */}
              <h2 className="text-xl font-bold text-white text-center mb-2">
                {hero.name}
              </h2>
              
              {/* Role */}
              <div className="text-center mb-3">
                <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                  {hero.role}
                </span>
              </div>

              {/* Hero Description */}
              <p className="text-gray-300 text-center mb-4 text-xs leading-relaxed">
                {hero.description}
              </p>

              {/* Weapon Info */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-lg">{WEAPON_CONFIGS[hero.weaponType].icon}</span>
                  <span className="text-white font-medium text-sm">{WEAPON_CONFIGS[hero.weaponType].name}</span>
                </div>
                <p className="text-gray-400 text-xs text-center">
                  {WEAPON_CONFIGS[hero.weaponType].description}
                </p>
                <div className="mt-1 flex justify-center space-x-3 text-xs">
                  <span className="text-gray-400">
                    DMG: <span className="text-white">{WEAPON_CONFIGS[hero.weaponType].damage}</span>
                  </span>
                  <span className="text-gray-400">
                    RNG: <span className="text-white">{WEAPON_CONFIGS[hero.weaponType].range}</span>
                  </span>
                </div>
              </div>
              
              {/* Special Ability */}
              <div className="mb-4 p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded border border-purple-300/30">
                <p className="text-purple-200 text-xs text-center font-medium">
                  {hero.specialAbility}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Health:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${getStatColor(hero.maxHealth, 'health')}`}>
                      {hero.maxHealth}
                    </span>
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(6, hero.maxHealth) }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < hero.maxHealth ? 'bg-red-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Speed:</span>
                  <span className={`font-bold ${getStatColor(hero.moveSpeed, 'speed')}`}>
                    {hero.moveSpeed}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Fire Rate:</span>
                  <span className={`font-bold ${getStatColor(WEAPON_CONFIGS[hero.weaponType].cooldown, 'cooldown')}`}>
                    {WEAPON_CONFIGS[hero.weaponType].cooldown}
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/50 transition-all duration-300" />
              
              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm max-w-2xl mx-auto">
          💡 <strong>{gameMode === 'campaign' ? 'Campaign' : 'Cooperative'} Tip:</strong> 
          {gameMode === 'campaign' 
            ? ' Complete levels to unlock new heroes with unique abilities and weapons!'
            : ' Both players will control the same hero type initially. Work together to rescue other character types and build a diverse party for maximum effectiveness!'
          }
        </p>
        
        {gameMode === 'campaign' && campaignProgress && (
          <div className="mt-4 text-center">
            <div className="text-gray-300 text-sm">
              Campaign Progress: {CampaignManager.getCompletionPercentage(campaignProgress)}% • 
              Unlocked Heroes: {campaignProgress.unlockedHeroes.length}/{HERO_TYPES.length} • 
              Total Score: {campaignProgress.totalScore.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSelection;