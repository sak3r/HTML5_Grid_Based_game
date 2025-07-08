import React from 'react';
import { EditorTool, GameState, LevelStatistics, LevelMetadata, EnemyType } from '../types/GameTypes';
import { ENEMY_TYPES } from '../config/GameConfig';
import { 
  Users, 
  Square, 
  Diamond, 
  MapPin, 
  DoorOpen, 
  Star,
  Play,
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
  Target,
  Truck,
  Zap
} from 'lucide-react';

interface EditorSidebarProps {
  selectedTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
  onTestLevel: () => void;
  onSaveLevel: () => void;
  onLoadLevel: () => void;
  onExportLevel: () => void;
  onImportLevel: () => void;
  onDeleteLevel: (levelName: string) => void;
  gameState: GameState;
  levelStats: LevelStatistics;
  savedLevels: string[];
  selectedEnemyType: EnemyType;
  onEnemyTypeSelect: (enemyType: EnemyType) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  selectedTool,
  onToolSelect,
  onTestLevel,
  onSaveLevel,
  onLoadLevel,
  onExportLevel,
  onImportLevel,
  onDeleteLevel,
  gameState,
  levelStats,
  savedLevels,
  selectedEnemyType,
  onEnemyTypeSelect,
}) => {
  const tools = [
    {
      id: 'enemy' as EditorTool,
      name: 'Enemy',
      icon: Users,
      description: 'Place enemies that patrol and shoot',
      color: 'bg-red-500',
    },
    {
      id: 'wall' as EditorTool,
      name: 'Wall',
      icon: Square,
      description: 'Create obstacles and barriers',
      color: 'bg-gray-500',
    },
    {
      id: 'collectible' as EditorTool,
      name: 'Hero',
      icon: Diamond,
      description: 'Place collectible heroes',
      color: 'bg-purple-500',
    },
    {
      id: 'powerup' as EditorTool,
      name: 'Power-up',
      icon: Star,
      description: 'Add temporary ability boosts',
      color: 'bg-yellow-500',
    },
    {
      id: 'playerStart' as EditorTool,
      name: 'Player Start',
      icon: MapPin,
      description: 'Set player starting position',
      color: 'bg-blue-500',
    },
    {
      id: 'exit' as EditorTool,
      name: 'Exit Zone',
      icon: DoorOpen,
      description: 'Define level exit areas',
      color: 'bg-green-500',
    },
  ];

  const getEnemyTypeIcon = (enemyType: EnemyType) => {
    switch (enemyType.id) {
      case 'guard':
        return <Shield className="w-4 h-4" />;
      case 'sniper':
        return <Target className="w-4 h-4" />;
      case 'tank':
        return <Truck className="w-4 h-4" />;
      case 'scout':
        return <Zap className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };
  return (
    <div className="w-80 bg-white border-l border-gray-300 shadow-lg flex flex-col max-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Level Editor</h2>
        <p className="text-sm text-gray-600">
          Click on the grid to place objects. Use tools to design your level.
        </p>
      </div>

      {/* Tools */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Placement Tools</h3>
        
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${tool.color} text-white flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {tool.name}
                  </h4>
                  <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Enemy Type Selection (shown when enemy tool is selected) */}
      {selectedTool === 'enemy' && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Enemy Types</h3>
          
          <div className="space-y-2">
            {ENEMY_TYPES.map((enemyType) => (
              <button
                key={enemyType.id}
                onClick={() => onEnemyTypeSelect(enemyType)}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedEnemyType.id === enemyType.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="p-2 rounded-lg text-white flex-shrink-0"
                    style={{ backgroundColor: enemyType.color }}
                  >
                    {getEnemyTypeIcon(enemyType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${selectedEnemyType.id === enemyType.id ? 'text-blue-900' : 'text-gray-900'}`}>
                      {enemyType.name}
                    </h4>
                    <p className={`text-xs mt-1 ${selectedEnemyType.id === enemyType.id ? 'text-blue-700' : 'text-gray-600'}`}>
                      {enemyType.description}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs">
                      <span className="text-gray-500">HP: {enemyType.maxHealth}</span>
                      <span className="text-gray-500">Range: {enemyType.shootRange}</span>
                      <span className="text-gray-500">Speed: {enemyType.moveSpeed}ms</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 Click on the grid to configure and place the selected enemy type
          </div>
        </div>
      )}

      {/* Level Statistics */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Level Statistics</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Enemies:</span>
            <span className="font-medium">{levelStats.enemyCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Collectibles:</span>
            <span className="font-medium">{levelStats.collectibleCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Power-ups:</span>
            <span className="font-medium">{levelStats.powerUpCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Walls:</span>
            <span className="font-medium">{levelStats.wallCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Exit Zones:</span>
            <span className="font-medium">{levelStats.exitZoneCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Player Start:</span>
            <span className={`font-medium ${levelStats.hasPlayerStart ? 'text-green-600' : 'text-red-600'}`}>
              {levelStats.hasPlayerStart ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        
        {/* Validation Status */}
        <div className="mt-4 p-3 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            {levelStats.isValid ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Level Valid</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Validation Errors</span>
              </>
            )}
          </div>
          
          {levelStats.validationErrors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-1">
              {levelStats.validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Saved Levels */}
      <div className="p-4 border-t border-gray-200 flex-1 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Saved Levels</h3>
        
        {savedLevels.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No saved levels</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedLevels.map((levelName) => (
              <div key={levelName} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {levelName}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onLoadLevel()}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Load Level"
                  >
                    <FolderOpen className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteLevel(levelName)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete Level"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Test Level */}
        <button
          onClick={onTestLevel}
          disabled={!levelStats.isValid}
          className={`w-full flex items-center justify-center space-x-2 font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            levelStats.isValid
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5" />
          <span>Test Level</span>
        </button>
        
        {/* Save/Load Row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onSaveLevel}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={onLoadLevel}
            className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Load</span>
          </button>
        </div>
        
        {/* Import/Export Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportLevel}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={onImportLevel}
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on grid cells to place objects</li>
          <li>• Right-click to configure/remove objects</li>
          <li>• Delete key to remove selected objects</li>
          <li>• Press 'E' to toggle editor mode</li>
          <li>• Test your level before saving</li>
          <li>• Export levels to share with others</li>
          <li>• Import levels from JSON strings</li>
          <li>• Levels require player start + exit zone</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorSidebar;