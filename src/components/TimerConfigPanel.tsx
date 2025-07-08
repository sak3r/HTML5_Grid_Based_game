import React, { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface TimerConfigPanelProps {
  currentTimeLimit: number;
  onConfirm: (timeLimit: number) => void;
  onCancel: () => void;
}

const TimerConfigPanel: React.FC<TimerConfigPanelProps> = ({
  currentTimeLimit,
  onConfirm,
  onCancel,
}) => {
  const [timeLimit, setTimeLimit] = useState(currentTimeLimit);
  const [customTime, setCustomTime] = useState(Math.floor(currentTimeLimit / 60));

  const presetTimes = [
    { label: '1 Minute', value: 60 },
    { label: '2 Minutes', value: 120 },
    { label: '3 Minutes', value: 180 },
    { label: '5 Minutes', value: 300 },
    { label: '10 Minutes', value: 600 },
    { label: 'No Limit', value: 9999 },
  ];

  const formatTime = (seconds: number): string => {
    if (seconds >= 9999) return 'No Limit';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  };

  const handlePresetSelect = (value: number) => {
    setTimeLimit(value);
    if (value < 9999) {
      setCustomTime(Math.floor(value / 60));
    }
  };

  const handleCustomTimeChange = (minutes: number) => {
    setCustomTime(minutes);
    setTimeLimit(minutes * 60);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Timer Configuration</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Selection Display */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-blue-800">
              {formatTime(timeLimit)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Selected Time Limit
            </div>
          </div>
        </div>

        {/* Preset Times */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {presetTimes.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                  timeLimit === preset.value
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Input */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Time (Minutes)</h3>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="30"
              value={customTime}
              onChange={(e) => handleCustomTimeChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="30"
                value={customTime}
                onChange={(e) => handleCustomTimeChange(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
              />
              <span className="text-sm text-gray-600">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 min</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Difficulty Indicators */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Difficulty Guide</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-red-600">• 1-2 minutes: Very Hard</span>
              <span className="text-red-600">High pressure</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">• 3-5 minutes: Medium</span>
              <span className="text-yellow-600">Balanced challenge</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">• 5+ minutes: Easy</span>
              <span className="text-green-600">Relaxed gameplay</span>
            </div>
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
            onClick={() => onConfirm(timeLimit)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerConfigPanel;