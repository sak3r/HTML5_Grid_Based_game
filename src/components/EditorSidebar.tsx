import React from 'react';
import { EditorTool } from '../types/GameTypes';
import { 
  Users, 
  Square, 
  Diamond, 
  MapPin, 
  DoorOpen, 
  Star,
  Play,
  Save,
  FolderOpen
} from 'lucide-react';

interface EditorSidebarProps {
  selectedTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
  onTestLevel: () => void;
  onSaveLevel: () => void;
  onLoadLevel: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  selectedTool,
  onToolSelect,
  onTestLevel,
  onSaveLevel,
  onLoadLevel,
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

  return (
    <div className="w-80 bg-white border-l border-gray-300 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Level Editor</h2>
        <p className="text-sm text-gray-600">
          Click on the grid to place objects. Use tools to design your level.
        </p>
      </div>

      {/* Tools */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
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

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <button
          onClick={onTestLevel}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <Play className="w-5 h-5" />
          <span>Test Level</span>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on grid cells to place objects</li>
          <li>• Right-click to remove objects</li>
          <li>• Press 'E' to toggle editor mode</li>
          <li>• Test your level before saving</li>
          <li>• Save levels to local storage</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorSidebar;