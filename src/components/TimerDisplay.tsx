import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { GAME_CONFIG } from '../config/GameConfig';

interface TimerDisplayProps {
  timeRemaining: number;
  timeLimit: number;
  isEditorMode: boolean;
  formatTime: (seconds: number) => string;
  getTimerColor: (timeRemaining: number) => string;
  shouldPulse: (timeRemaining: number) => boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  timeLimit,
  isEditorMode,
  formatTime,
  getTimerColor,
  shouldPulse,
}) => {
  if (isEditorMode) {
    return (
      <div className="flex items-center justify-center space-x-2 text-gray-500">
        <Clock className="w-6 h-6" />
        <span className="text-2xl font-mono">
          {formatTime(timeLimit)} (Paused)
        </span>
      </div>
    );
  }

  const timerColor = getTimerColor(timeRemaining);
  const shouldShowPulse = shouldPulse(timeRemaining);
  const isWarning = timeRemaining <= GAME_CONFIG.TIMER_WARNING_THRESHOLD;
  const isCritical = timeRemaining <= GAME_CONFIG.TIMER_CRITICAL_THRESHOLD;
  const isFinal = timeRemaining <= GAME_CONFIG.TIMER_FINAL_WARNING;

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* Timer Display */}
      <div 
        className={`flex items-center justify-center space-x-3 px-6 py-3 rounded-lg border-2 transition-all duration-300 ${
          isCritical 
            ? 'border-red-500 bg-red-50' 
            : isWarning 
            ? 'border-yellow-500 bg-yellow-50' 
            : 'border-gray-300 bg-white'
        } ${shouldShowPulse ? 'animate-pulse' : ''}`}
      >
        <Clock 
          className={`w-8 h-8 ${timerColor} ${shouldShowPulse ? 'animate-bounce' : ''}`} 
        />
        <span 
          className={`text-4xl font-mono font-bold ${timerColor} ${
            shouldShowPulse ? 'animate-pulse' : ''
          }`}
        >
          {formatTime(timeRemaining)}
        </span>
        {isCritical && (
          <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
        )}
      </div>

      {/* Warning Messages */}
      {isFinal && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 border border-red-300 rounded-lg animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-bold text-sm">
            FINAL WARNING! Time almost up!
          </span>
        </div>
      )}
      {isCritical && !isFinal && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 font-medium text-sm">
            Critical time remaining!
          </span>
        </div>
      )}
      {isWarning && !isCritical && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 font-medium text-sm">
            Time running low
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${
            isCritical 
              ? 'bg-red-500' 
              : isWarning 
              ? 'bg-yellow-500' 
              : 'bg-green-500'
          }`}
          style={{ 
            width: `${Math.max(0, (timeRemaining / timeLimit) * 100)}%` 
          }}
        />
      </div>
    </div>
  );
};

export default TimerDisplay;