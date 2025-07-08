import React, { useState } from 'react';
import { EnemyConfigPanel as EnemyConfigPanelType, EnemyType, BehaviorPattern } from '../types/GameTypes';
import { ENEMY_TYPES } from '../config/GameConfig';
import { 
  X, 
  Check, 
  Shield, 
  Target, 
  Truck, 
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw
} from 'lucide-react';

interface EnemyConfigPanelProps {
  config: EnemyConfigPanelType;
  onConfirm: (config: EnemyConfigPanelType) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const EnemyConfigPanel: React.FC<EnemyConfigPanelProps> = ({
  config,
  onConfirm,
  onCancel,
  isEditing = false,
}) => {
  const [selectedType, setSelectedType] = useState<EnemyType>(config.enemyType);
  const [patrolRadius, setPatrolRadius] = useState<number>(config.patrolRadius);
  const [startDirection, setStartDirection] = useState(config.startDirection);
  const [behaviorPattern, setBehaviorPattern] = useState<BehaviorPattern>(config.behaviorPattern);

  const getEnemyIcon = (enemyType: EnemyType) => {
    switch (enemyType.id) {
      case 'guard':
        return <Shield className="w-6 h-6" />;
      case 'sniper':
        return <Target className="w-6 h-6" />;
      case 'tank':
        return <Truck className="w-6 h-6" />;
      case 'scout':
        return <Zap className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getDirectionIcon = (direction: { x: number; y: number }) => {
    if (direction.x === 0 && direction.y === -1) return <ArrowUp className="w-4 h-4" />;
    if (direction.x === 0 && direction.y === 1) return <ArrowDown className="w-4 h-4" />;
    if (direction.x === -1 && direction.y === 0) return <ArrowLeft className="w-4 h-4" />;
    if (direction.x === 1 && direction.y === 0) return <ArrowRight className="w-4 h-4" />;
    return <RotateCw className="w-4 h-4" />;
  };

  const directions = [
    { x: 0, y: -1, name: 'Up' },
    { x: 1, y: 0, name: 'Right' },
    { x: 0, y: 1, name: 'Down' },
    { x: -1, y: 0, name: 'Left' },
  ];

  const behaviors: { id: BehaviorPattern; name: string; description: string }[] = [
    { id: 'patrol', name: 'Patrol', description: 'Moves around patrol area' },
    { id: 'guard', name: 'Guard', description: 'Stays in position, shoots on sight' },
    { id: 'aggressive', name: 'Aggressive', description: 'Actively chases player' },
    { id: 'defensive', name: 'Defensive', description: 'Moves away when player gets close' },
  ];

  const handleConfirm = () => {
    onConfirm({
      ...config,
      enemyType: selectedType,
      patrolRadius,
      startDirection,
      behaviorPattern,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Enemy' : 'Place Enemy'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enemy Type Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Enemy Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {ENEMY_TYPES.map((enemyType) => (
              <button
                key={enemyType.id}
                onClick={() => setSelectedType(enemyType)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedType.id === enemyType.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="p-1 rounded text-white"
                    style={{ backgroundColor: enemyType.color }}
                  >
                    {getEnemyIcon(enemyType)}
                  </div>
                  <span className="font-medium text-sm">{enemyType.name}</span>
                </div>
                <p className="text-xs text-gray-600 text-left">{enemyType.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Enemy Stats */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Stats</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Health:</span>
              <span className="ml-1 font-medium">{selectedType.maxHealth}</span>
            </div>
            <div>
              <span className="text-gray-600">Speed:</span>
              <span className="ml-1 font-medium">{selectedType.moveSpeed}ms</span>
            </div>
            <div>
              <span className="text-gray-600">Shoot Rate:</span>
              <span className="ml-1 font-medium">{selectedType.shootCooldown}ms</span>
            </div>
            <div>
              <span className="text-gray-600">Range:</span>
              <span className="ml-1 font-medium">{selectedType.shootRange} cells</span>
            </div>
          </div>
        </div>

        {/* Patrol Radius */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patrol Radius: {patrolRadius} cells
          </label>
          <input
            type="range"
            min="1"
            max="6"
            value={patrolRadius}
            onChange={(e) => setPatrolRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>6</span>
          </div>
        </div>

        {/* Starting Direction */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Starting Direction</h3>
          <div className="grid grid-cols-4 gap-2">
            {directions.map((direction) => (
              <button
                key={`${direction.x}-${direction.y}`}
                onClick={() => setStartDirection(direction)}
                className={`p-2 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                  startDirection.x === direction.x && startDirection.y === direction.y
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {getDirectionIcon(direction)}
              </button>
            ))}
          </div>
        </div>

        {/* Behavior Pattern */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Behavior Pattern</h3>
          <div className="space-y-2">
            {behaviors.map((behavior) => (
              <button
                key={behavior.id}
                onClick={() => setBehaviorPattern(behavior.id)}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  behaviorPattern === behavior.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{behavior.name}</div>
                <div className="text-xs text-gray-600">{behavior.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Update' : 'Place'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnemyConfigPanel;