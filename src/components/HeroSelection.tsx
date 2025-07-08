import React from 'react';
import { HeroType } from '../types/GameTypes';
import { HERO_TYPES, WEAPON_CONFIGS } from '../config/GameConfig';
import { Shield, Zap, Heart } from 'lucide-react';

interface HeroSelectionProps {
  onHeroSelect: (heroType: HeroType) => void;
}

const HeroSelection: React.FC<HeroSelectionProps> = ({ onHeroSelect }) => {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Choose Your Hero
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Select a character that matches your playstyle. Each hero has unique stats that will affect your gameplay experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {HERO_TYPES.map((hero) => (
          <div
            key={hero.id}
            onClick={() => onHeroSelect(hero)}
            className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer hover:scale-105 hover:bg-white/15"
          >
            {/* Hero Icon */}
            <div 
              className="flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6 transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: hero.color, borderColor: hero.borderColor, borderWidth: '3px' }}
            >
              <div className="text-white">
                {getHeroIcon(hero.id)}
              </div>
            </div>

            {/* Hero Name */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {hero.name}
            </h2>

            {/* Hero Description */}
            <p className="text-gray-300 text-center mb-6 text-sm leading-relaxed">
              {hero.description}
            </p>

            {/* Weapon Info */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{WEAPON_CONFIGS[hero.weaponType].icon}</span>
                <span className="text-white font-medium">{WEAPON_CONFIGS[hero.weaponType].name}</span>
              </div>
              <p className="text-gray-400 text-xs text-center">
                {WEAPON_CONFIGS[hero.weaponType].description}
              </p>
              <div className="mt-2 flex justify-center space-x-4 text-xs">
                <span className="text-gray-400">
                  Damage: <span className="text-white">{WEAPON_CONFIGS[hero.weaponType].damage}</span>
                </span>
                <span className="text-gray-400">
                  Range: <span className="text-white">{WEAPON_CONFIGS[hero.weaponType].range}</span>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Health:</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${getStatColor(hero.maxHealth, 'health')}`}>
                    {hero.maxHealth}
                  </span>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < hero.maxHealth ? 'bg-red-500' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Move Speed:</span>
                <span className={`font-bold ${getStatColor(hero.moveSpeed, 'speed')}`}>
                  {hero.moveSpeed}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Shoot Rate:</span>
                <span className={`font-bold ${getStatColor(WEAPON_CONFIGS[hero.weaponType].cooldown, 'cooldown')}`}>
                  {WEAPON_CONFIGS[hero.weaponType].cooldown}ms
                </span>
              </div>
            </div>

            {/* Selection Indicator */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/50 transition-all duration-300" />
            
            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm max-w-2xl mx-auto">
          💡 <strong>Tip:</strong> Warriors are great for beginners, Scouts excel at hit-and-run tactics, 
          and Tanks can absorb more damage but move slower. Choose wisely!
        </p>
      </div>
    </div>
  );
};

export default HeroSelection;