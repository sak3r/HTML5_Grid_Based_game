import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Position, HeroType, EditorTool, EnemyType } from '../types/GameTypes';
import { GAME_CONFIG, GRID_COLS, GRID_ROWS } from '../config/GameConfig';
import { GameRenderer } from './GameRenderer';
import { GameLogic } from './GameLogic';
import HeroSelection from './HeroSelection';
import EditorSidebar from './EditorSidebar';
import EnemyConfigPanel from './EnemyConfigPanel';
import TimerDisplay from './TimerDisplay';
import TimerConfigPanel from './TimerConfigPanel';
import MainMenu from './MainMenu';
import LevelSelectScreen from './LevelSelectScreen';
import { CampaignManager } from './CampaignManager';
import { CAMPAIGN_LEVELS } from '../config/CampaignConfig';
import { CampaignProgress, LevelCompletionResult } from '../types/GameTypes';

const GridGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef<number>(0);
  const gameLogic = useRef<GameLogic>(new GameLogic());
  const renderer = useRef<GameRenderer | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showHeroSelection, setShowHeroSelection] = useState<boolean>(true);
  const [showTimerConfig, setShowTimerConfig] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'menu' | 'campaign' | 'cooperative' | 'editor'>('menu');
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress>(CampaignManager.loadProgress());
  const [currentCampaignLevel, setCurrentCampaignLevel] = useState<number>(0);

  // Handle shooting
  const handleShooting = useCallback((direction: Position, playerNum: 1 | 2 = 1) => {
    if (!gameState) return;
    
    const newState = gameLogic.current.handleShooting(gameState, playerNum, direction);
    setGameState(newState);
  }, [gameState]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (gameState?.player1HeroType && gameMode !== 'campaign') {
      const newState = gameLogic.current.createInitialGameState(gameState.player1HeroType, gameState.gameMode || 'cooperative');
      // Preserve time limit from current game
      newState.timeLimit = gameState.timeLimit;
      newState.timeRemaining = gameState.timeLimit;
      setGameState(gameLogic.current.resetTimer(newState));
    } else if (gameMode === 'campaign') {
      // Restart current campaign level
      handleCampaignLevelStart(currentCampaignLevel);
    } else {
      handleBackToMenu();
    }
  }, [gameState?.player1HeroType, gameState?.gameMode, gameMode, currentCampaignLevel]);

  const handleHeroSelect = useCallback((heroType: HeroType, mode: 'cooperative' | 'campaign' = 'cooperative') => {
    const newState = gameLogic.current.createInitialGameState(heroType, mode);
    
    if (mode === 'campaign') {
      // Load campaign level data
      const levelData = CAMPAIGN_LEVELS[currentCampaignLevel];
      newState.campaignMode = true;
      newState.currentCampaignLevel = currentCampaignLevel;
      newState.timeLimit = levelData.difficultyScaling.timeLimit;
      newState.timeRemaining = levelData.difficultyScaling.timeLimit;
      
      // Apply level data
      newState.enemies = levelData.levelData.enemies;
      newState.collectibleHeroes = levelData.levelData.collectibleHeroes;
      newState.powerUps = levelData.levelData.powerUps;
      newState.editorObjects = levelData.levelData.editorObjects;
    }
    
    setGameState(gameLogic.current.resetTimer(newState));
    setShowHeroSelection(false);
  }, [currentCampaignLevel]);

  const handleBackToMenu = useCallback(() => {
    setGameMode('menu');
    setGameState(null);
    setShowHeroSelection(true);
  }, []);

  const handleStartCampaign = useCallback(() => {
    setGameMode('campaign');
  }, []);

  const handleStartCooperative = useCallback(() => {
    setGameMode('cooperative');
    setShowHeroSelection(true);
  }, []);

  const handleStartEditor = useCallback(() => {
    setGameMode('editor');
    setShowHeroSelection(true);
  }, []);

  const handleCampaignLevelStart = useCallback((levelIndex: number) => {
    setCurrentCampaignLevel(levelIndex);
    setShowHeroSelection(true);
  }, []);

  const handleLevelComplete = useCallback(() => {
    if (gameMode === 'campaign' && gameState) {
      const timeElapsed = gameState.timeLimit - gameState.timeRemaining;
      const allCaptivesRescued = gameState.captives.length === 0;
      const perfectRun = gameState.player1.health === gameState.player1.maxHealth && 
                        gameState.player2.health === gameState.player2.maxHealth;
      
      const result: LevelCompletionResult = {
        levelId: currentCampaignLevel,
        completed: true,
        score: gameState.score,
        timeElapsed,
        allCaptivesRescued,
        perfectRun,
        newUnlocks: CampaignManager.calculateLevelRewards(
          currentCampaignLevel,
          gameState.score,
          timeElapsed,
          allCaptivesRescued,
          perfectRun
        ),
      };
      
      const newProgress = CampaignManager.completeLevel(campaignProgress, result);
      setCampaignProgress(newProgress);
      CampaignManager.saveProgress(newProgress);
      
      // Show completion screen or return to level select
      setTimeout(() => {
        setGameMode('campaign');
        setGameState(null);
      }, 3000);
    }
  }, [gameMode, gameState, currentCampaignLevel, campaignProgress]);

  const handleEditorToggle = useCallback(() => {
    if (gameState) {
      setGameState(gameLogic.current.toggleEditorMode(gameState));
    }
  }, [gameState]);

  const handleToolSelect = useCallback((tool: EditorTool) => {
    if (gameState) {
      setGameState(gameLogic.current.setSelectedTool(gameState, tool));
    }
  }, [gameState]);

  const handleEnemyTypeSelect = useCallback((enemyType: EnemyType) => {
    if (gameState) {
      setGameState(gameLogic.current.setSelectedEnemyType(gameState, enemyType));
    }
  }, [gameState]);

  const handleEnemyConfigConfirm = useCallback((config: any) => {
    if (gameState) {
      if (gameState.selectedObject) {
        // Editing existing enemy
        setGameState(gameLogic.current.updateEnemyFromConfig(gameState, config));
      } else {
        // Placing new enemy
        setGameState(gameLogic.current.placeEnemyFromConfig(gameState, config));
      }
    }
  }, [gameState]);

  const handleEnemyConfigCancel = useCallback(() => {
    if (gameState) {
      setGameState(gameLogic.current.closeEnemyConfigPanel(gameState));
    }
  }, [gameState]);

  const handleTimerConfig = useCallback(() => {
    setShowTimerConfig(true);
  }, []);

  const handleTimerConfigConfirm = useCallback((timeLimit: number) => {
    if (gameState) {
      setGameState(gameLogic.current.setTimeLimit(gameState, timeLimit));
    }
    setShowTimerConfig(false);
  }, [gameState]);

  const handleTimerConfigCancel = useCallback(() => {
    setShowTimerConfig(false);
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
    const gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
    
    if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
      const isRightClick = event.button === 2;
      const newState = gameLogic.current.handleEditorClick(gameState, { x: gridX, y: gridY }, isRightClick);
      setGameState(newState);
    }
  }, [gameState]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState?.editorMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
    const gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
    
    if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
      const newState = gameLogic.current.setHoveredObject(gameState, { x: gridX, y: gridY });
      setGameState(newState);
    }
  }, [gameState]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (!gameState?.editorMode) return;
    
    const newState = gameLogic.current.setHoveredObject(gameState, null);
    setGameState(newState);
  }, [gameState]);

  const handleTestLevel = useCallback(() => {
    if (gameState) {
      setGameState(gameLogic.current.testLevel(gameState));
    }
  }, [gameState]);

  const handleSaveLevel = useCallback(() => {
    if (gameState) {
      const levelData = {
        playerStart: gameState.player1.position,
        editorObjects: gameState.editorObjects,
      };
      
      const levelName = prompt('Enter level name:');
      if (levelName) {
        localStorage.setItem(`level_${levelName}`, JSON.stringify(levelData));
        alert('Level saved successfully!');
      }
    }
  }, [gameState]);

  const handleLoadLevel = useCallback(() => {
    const levelName = prompt('Enter level name to load:');
    if (levelName) {
      const savedLevel = localStorage.getItem(`level_${levelName}`);
      if (savedLevel) {
        try {
          const levelData = JSON.parse(savedLevel);
          // Apply loaded level data to current game state
          if (gameState) {
            setGameState({
              ...gameState,
              editorObjects: levelData.editorObjects || [],
              selectedObject: null,
              hoveredObject: null,
            });
            alert('Level loaded successfully!');
          }
        } catch (error) {
          alert('Error loading level!');
        }
      } else {
        alert('Level not found!');
      }
    }
  }, [gameState]);

  const updateGame = useCallback((deltaTime: number) => {
    setGameState(prev => {
      if (!prev || prev.gameStatus !== 'playing' || prev.editorMode) return prev;
      return gameLogic.current.updateGame(prev, pressedKeys.current, deltaTime);
    });
  }, []);

  const render = useCallback(() => {
    if (renderer.current && gameState) {
      renderer.current.render(gameState);
    }
  }, [gameState]);

  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastFrameTime.current;
    lastFrameTime.current = timestamp;

    updateGame(deltaTime);
    render();
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, render]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.code;
      
      // Movement keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyI', 'KeyJ', 'KeyK', 'KeyL'].includes(key)) {
        event.preventDefault();
        pressedKeys.current.add(key);
      }
      
      // Shooting keys (Arrow keys)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
        let direction: Position = { x: 0, y: 0 };
        
        switch (key) {
          case 'ArrowUp': direction = { x: 0, y: -1 }; break;
          case 'ArrowDown': direction = { x: 0, y: 1 }; break;
          case 'ArrowLeft': direction = { x: -1, y: 0 }; break;
          case 'ArrowRight': direction = { x: 1, y: 0 }; break;
        }
        
        handleShooting(direction, 1);
      }
      
      // Player 2 shooting keys (Number pad)
      if (['Numpad8', 'Numpad2', 'Numpad4', 'Numpad6'].includes(key)) {
        event.preventDefault();
        let direction: Position = { x: 0, y: 0 };
        
        switch (key) {
          case 'Numpad8': direction = { x: 0, y: -1 }; break;
          case 'Numpad2': direction = { x: 0, y: 1 }; break;
          case 'Numpad4': direction = { x: -1, y: 0 }; break;
          case 'Numpad6': direction = { x: 1, y: 0 }; break;
        }
        
        handleShooting(direction, 2);
      }
      
      // Diagonal shooting (combinations)
      if (pressedKeys.current.has('ArrowUp') && pressedKeys.current.has('ArrowLeft')) {
        handleShooting({ x: -1, y: -1 });
      } else if (pressedKeys.current.has('ArrowUp') && pressedKeys.current.has('ArrowRight')) {
        handleShooting({ x: 1, y: -1 });
      } else if (pressedKeys.current.has('ArrowDown') && pressedKeys.current.has('ArrowLeft')) {
        handleShooting({ x: -1, y: 1 });
      } else if (pressedKeys.current.has('ArrowDown') && pressedKeys.current.has('ArrowRight')) {
        handleShooting({ x: 1, y: 1 });
      }
      
      // Restart key
      if (key === 'KeyR' && gameState && ['gameOver', 'victory', 'levelComplete'].includes(gameState.gameStatus)) {
        event.preventDefault();
        handleRestart();
      }
      
      // Editor toggle
      if (key === 'KeyE') {
        event.preventDefault();
        handleEditorToggle();
      }
      
      // Delete selected object in editor
      if (key === 'Delete' && gameState?.editorMode && gameState.selectedObject) {
        event.preventDefault();
        setGameState(gameLogic.current.deleteSelectedObject(gameState));
      }
      
      // Back to hero selection
      if (key === 'Escape') {
        event.preventDefault();
        handleBackToMenu();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.code;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyI', 'KeyJ', 'KeyK', 'KeyL'].includes(key)) {
        event.preventDefault();
        pressedKeys.current.delete(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleShooting, handleRestart, handleEditorToggle, handleBackToMenu, gameState?.gameStatus]);

  // Check for level completion in campaign mode
  useEffect(() => {
    if (gameMode === 'campaign' && gameState?.gameStatus === 'victory') {
      handleLevelComplete();
    }
  }, [gameMode, gameState?.gameStatus, handleLevelComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderer.current = new GameRenderer(ctx);
    
    lastFrameTime.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Show main menu
  if (gameMode === 'menu') {
    return (
      <MainMenu
        onStartCampaign={handleStartCampaign}
        onStartCooperative={handleStartCooperative}
        onStartEditor={handleStartEditor}
        onShowAchievements={() => {}} // TODO: Implement achievements screen
      />
    );
  }

  // Show campaign level select
  if (gameMode === 'campaign' && !gameState) {
    return (
      <LevelSelectScreen
        onLevelSelect={handleCampaignLevelStart}
        onBackToMenu={handleBackToMenu}
        campaignProgress={campaignProgress}
        onProgressUpdate={setCampaignProgress}
      />
    );
  }

  // Show hero selection screen
  if (showHeroSelection) {
    return (
      <HeroSelection 
        onHeroSelect={(heroType) => handleHeroSelect(heroType, gameMode === 'campaign' ? 'campaign' : 'cooperative')}
        gameMode={gameMode}
        campaignProgress={campaignProgress}
      />
    );
  }

  // Show loading state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  const mainContentWidth = gameState.editorMode ? 
    `calc(100vw - ${GAME_CONFIG.EDITOR_SIDEBAR_WIDTH}px)` : '100vw';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Game Area */}
      <div 
        className="flex flex-col items-center justify-center p-4 transition-all duration-300"
        style={{ width: mainContentWidth }}
      >
      {/* Timer Display */}
      {gameState && (
        <div className="mb-6">
          <TimerDisplay
            timeRemaining={gameState.timeRemaining}
            timeLimit={gameState.timeLimit}
            isEditorMode={gameState.editorMode}
            formatTime={gameLogic.current.formatTime}
            getTimerColor={gameLogic.current.getTimerColor}
            shouldPulse={gameLogic.current.shouldPulse}
          />
        </div>
      )}

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {gameState.editorMode 
            ? 'Level Editor' 
            : gameMode === 'campaign' 
            ? `Campaign Level ${currentCampaignLevel + 1}: ${CAMPAIGN_LEVELS[currentCampaignLevel]?.name || 'Unknown'}`
            : `2-Player Cooperative Game - ${gameState.gameMode === 'cooperative' ? 'Cooperative' : 'Turn-Based'}`
          }
        </h1>
        <p className="text-gray-600">
          {gameState.editorMode 
            ? 'Click on the grid to place objects • E to toggle editor'
            : gameMode === 'campaign'
            ? 'Campaign Mode: Complete objectives to progress • ESC for menu'
            : 'P1: WASD + Arrows • P2: IJKL + Numpad • E for editor • ESC for menu'
          }
        </p>
        <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>Score: {gameState.score}</span>
          <span>•</span>
          <span>P1 Health: {gameState.player1.health}/{gameState.player1.maxHealth}</span>
          <span>•</span>
          <span>P2 Health: {gameState.player2.health}/{gameState.player2.maxHealth}</span>
          <span>•</span>
          <span>Enemies: {gameState.enemies.length}</span>
          <span>•</span>
          <span>Active: {gameState.activePartyMembers.length + 2}</span>
          <span>•</span>
          <span>Captives: {gameState.captives.length}</span>
          <span>•</span>
          <span>Status: {gameState.gameStatus}</span>
        </div>
        
        {gameMode === 'campaign' && (
          <div className="mt-2 text-sm text-purple-600 font-medium">
            Campaign Progress: {campaignProgress.completedLevels.length}/{CAMPAIGN_LEVELS.length} Levels • 
            Total Score: {campaignProgress.totalScore.toLocaleString()}
          </div>
        )}
        
        {gameState.editorMode && (
          <div className="mt-2 text-sm text-blue-600 font-medium">Editor Mode Active - Selected Tool: {gameState.selectedTool}</div>
        )}
        
        {/* Hero Stats */}
        {gameState.player1HeroType && (
          <div className="mt-3 flex items-center justify-center space-x-6 text-xs text-gray-600">
            <span>P1 Weapon: {WEAPON_CONFIGS[gameState.player1HeroType.weaponType].name}</span>
            <span>•</span>
            <span>P2 Weapon: {gameState.player2HeroType ? WEAPON_CONFIGS[gameState.player2HeroType.weaponType].name : 'Same'}</span>
            <span>•</span>
            <span>Mode: {gameState.gameMode}</span>
          </div>
        )}
        
        {/* Player 1 Health Bar */}
        <div className="mt-3 flex items-center justify-center space-x-2">
          <span className="text-sm text-blue-600 font-medium">Player 1:</span>
          <div className="flex space-x-1">
            {Array.from({ length: gameState.player1.maxHealth }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded border-2 ${
                  i < gameState.player1.health
                    ? gameState.player1.health === gameState.player1.maxHealth
                      ? 'bg-green-500 border-green-600'
                      : gameState.player1.health > 1
                      ? 'bg-yellow-500 border-yellow-600'
                      : 'bg-red-500 border-red-600'
                    : 'bg-gray-200 border-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Player 2 Health Bar */}
        <div className="mt-2 flex items-center justify-center space-x-2">
          <span className="text-sm text-green-600 font-medium">Player 2:</span>
          <div className="flex space-x-1">
            {Array.from({ length: gameState.player2.maxHealth }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded border-2 ${
                  i < gameState.player2.health
                    ? gameState.player2.health === gameState.player2.maxHealth
                      ? 'bg-green-500 border-green-600'
                      : gameState.player2.health > 1
                      ? 'bg-yellow-500 border-yellow-600'
                      : 'bg-red-500 border-red-600'
                    : 'bg-gray-200 border-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Active Party Members */}
        {gameState.activePartyMembers.length > 0 && (
          <div className="mt-3 flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">Active Party:</span>
            <div className="flex space-x-1">
              {gameState.activePartyMembers.map((member, index) => {
                const heroType = HERO_TYPES[index % HERO_TYPES.length];
                return (
                <div
                  key={index}
                  className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold text-white relative"
                  style={{ 
                    backgroundColor: heroType.color, 
                    borderColor: heroType.borderColor 
                  }}
                >
                  {heroType.name.charAt(0)}
                  {/* Health indicator */}
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-300 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${(member.health / member.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Captives */}
        {gameState.captives.length > 0 && (
          <div className="mt-3 flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">Captives:</span>
            <div className="flex space-x-1">
              {gameState.captives.map((captive, index) => (
                <div
                  key={captive.id}
                  className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold text-white relative opacity-60"
                  style={{ 
                    backgroundColor: captive.originalHeroType.color, 
                    borderColor: '#6b7280'
                  }}
                >
                  {captive.originalHeroType.name.charAt(0)}
                  {/* Captive indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⛓️</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Active Power-ups */}
        {gameState.activePowerUps.length > 0 && (
          <div className="mt-3 flex items-center justify-center space-x-4">
            {gameState.activePowerUps.map((powerUp, index) => {
              const config = POWER_UP_TYPES[powerUp.type];
              const timeLeft = Math.max(0, powerUp.duration - (Date.now() - powerUp.startTime));
              const secondsLeft = Math.ceil(timeLeft / 1000);
              
              return (
                <div
                  key={index}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: config.color }}
                >
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                  <span>({secondsLeft}s)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
          style={{ imageRendering: 'pixelated' }}
          onClick={handleCanvasClick}
          onContextMenu={(e) => e.preventDefault()}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
            <span>Grid: {GRID_COLS}×{GRID_ROWS}</span>
            <span>•</span>
            <span>P1: ({gameState.player1.position.x}, {gameState.player1.position.y})</span>
            <span>•</span>
            <span>P2: ({gameState.player2.position.x}, {gameState.player2.position.y})</span>
            <span>•</span>
            <span>Projectiles: {gameState.projectiles.length}</span>
            <span>•</span>
            <span>
              {gameState.editorMode 
                ? `Objects: ${gameState.editorObjects.length}` 
                : `Collectibles: ${gameState.collectibleHeroes.filter(h => !h.collected).length + gameState.powerUps.filter(p => !p.collected).length}`
              }
            </span>
          </div>
        </div>
      </div>

      {!gameState.editorMode && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Game Controls & Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Movement</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs font-mono">WASD</kbd>
                <span className="text-gray-600">Player 1 movement</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-green-100 border border-green-300 rounded text-xs font-mono">IJKL</kbd>
                <span className="text-gray-600">Player 2 movement</span>
              </div>
              <div className="text-xs text-gray-500">Cooperative movement system</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Combat</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs font-mono">↑↓←→</kbd>
                <span className="text-gray-600">Player 1 shooting</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-green-100 border border-green-300 rounded text-xs font-mono">Numpad</kbd>
                <span className="text-gray-600">Player 2 shooting</span>
              </div>
              <div className="text-xs text-gray-500">Coordinate attacks for maximum effectiveness</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Game Rules</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• <strong>{gameMode === 'campaign' ? 'Campaign' : 'Cooperative'} Victory:</strong> All players must reach exit zones</p>
              <p>• <strong>Shared Resources:</strong> Both players share the same character pool</p>
              <p>• <strong>Rescue Mechanics:</strong> Either player can rescue captives</p>
              <p>• <strong>Team Health:</strong> Game over if both players are captured</p>
              <p>• <strong>Coordination Required:</strong> Work together to defeat enemies</p>
              <p>• <strong>Shared Score:</strong> Points are earned collectively</p>
              <p>• <strong>Party Management:</strong> Rescued characters join the team</p>
              <p>• <strong>Strategic Positioning:</strong> Players can't occupy same space</p>
              <p>• <strong>Collective Exit:</strong> All active characters must reach exit</p>
              <p>• Press R to restart • ESC for menu • E for editor</p>
              {gameMode === 'campaign' && (
                <p>• <strong>Campaign Mode:</strong> Progress through levels to unlock new content</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">
            {gameMode === 'campaign' ? 'Campaign Features' : 'Cooperative Features'}
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            {gameMode === 'campaign' ? (
              <>
                <p>• <strong>Progressive Difficulty:</strong> Each level introduces new challenges</p>
                <p>• <strong>Unlockable Content:</strong> Earn new heroes and weapons by completing levels</p>
                <p>• <strong>Achievement System:</strong> Track your progress and earn rewards</p>
                <p>• <strong>Score & Time Tracking:</strong> Compete for best scores and fastest times</p>
                <p>• <strong>Persistent Progress:</strong> Your campaign progress is automatically saved</p>
                <p>• <strong>Difficulty Scaling:</strong> Later levels have more enemies and shorter time limits</p>
              </>
            ) : (
              <>
            <p>• <strong>Dual Control System:</strong> Independent movement and shooting for each player</p>
            <p>• <strong>Shared Victory Conditions:</strong> Success requires teamwork and coordination</p>
            <p>• <strong>Cooperative Rescue System:</strong> Either player can save captured teammates</p>
            <p>• <strong>Strategic Depth:</strong> Players must coordinate positioning and attacks</p>
            <p>• <strong>Collective Resource Management:</strong> Shared health, score, and party members</p>
            <p>• <strong>Real-time Cooperation:</strong> No turn-based delays, pure cooperative action</p>
              </>
            )}
          </div>
        </div>
      </div>
      )}
      </div>
      
      {/* Editor Sidebar */}
      {gameState.editorMode && (
        <EditorSidebar
          selectedTool={gameState.selectedTool}
          onToolSelect={handleToolSelect}
          onTestLevel={handleTestLevel}
          onSaveLevel={handleSaveLevel}
          onLoadLevel={handleLoadLevel}
          onExportLevel={() => {}}
          onImportLevel={() => {}}
          onDeleteLevel={() => {}}
          gameState={gameState}
          levelStats={gameLogic.current.validateLevel(gameState)}
          savedLevels={gameLogic.current.getSavedLevels()}
          selectedEnemyType={gameState.selectedEnemyType}
          onEnemyTypeSelect={handleEnemyTypeSelect}
          onTimerConfig={handleTimerConfig}
        />
      )}
      
      {/* Enemy Configuration Panel */}
      {gameState?.enemyConfigPanel?.isOpen && (
        <EnemyConfigPanel
          config={gameState.enemyConfigPanel}
          onConfirm={handleEnemyConfigConfirm}
          onCancel={handleEnemyConfigCancel}
          isEditing={!!gameState.selectedObject}
        />
      )}
      
      {/* Timer Configuration Panel */}
      {showTimerConfig && gameState && (
        <TimerConfigPanel
          currentTimeLimit={gameState.timeLimit}
          onConfirm={handleTimerConfigConfirm}
          onCancel={handleTimerConfigCancel}
        />
      )}
    </div>
  );
};

export default GridGame;