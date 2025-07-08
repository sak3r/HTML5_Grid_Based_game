import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Position, HeroType, EditorTool } from '../types/GameTypes';
import { GAME_CONFIG, GRID_COLS, GRID_ROWS } from '../config/GameConfig';
import { GameRenderer } from './GameRenderer';
import { GameLogic } from './GameLogic';
import HeroSelection from './HeroSelection';
import EditorSidebar from './EditorSidebar';

const GridGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef<number>(0);
  const gameLogic = useRef<GameLogic>(new GameLogic());
  const renderer = useRef<GameRenderer | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showHeroSelection, setShowHeroSelection] = useState<boolean>(true);

  // Handle shooting
  const handleShooting = useCallback((direction: Position) => {
    if (!gameState) return;
    
    const currentTime = Date.now();
    const shootCooldown = gameLogic.current.getPlayerShootCooldown(gameState);
    
    if (currentTime - gameState.player.lastShootTime >= shootCooldown) {
      const projectile = gameLogic.current.createProjectile(
        gameState.player.position,
        direction,
        'player'
      );
      
      setGameState(prev => ({
        ...prev!,
        projectiles: [...prev.projectiles, projectile],
        player: {
          ...prev.player,
          lastShootTime: currentTime,
        },
      }));
    }
  }, [gameState?.player.lastShootTime, gameState?.player.position]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (gameState?.selectedHeroType) {
      setGameState(gameLogic.current.createInitialGameState(gameState.selectedHeroType));
    } else {
      setShowHeroSelection(true);
      setGameState(null);
    }
  }, [gameState?.selectedHeroType]);

  const handleHeroSelect = useCallback((heroType: HeroType) => {
    setGameState(gameLogic.current.createInitialGameState(heroType));
    setShowHeroSelection(false);
  }, []);

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
        playerStart: gameState.player.position,
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
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key)) {
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
        
        handleShooting(direction);
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
      if (key === 'KeyR' && gameState && (gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'victory' || gameState.gameStatus === 'levelComplete')) {
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
        setShowHeroSelection(true);
        setGameState(null);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.code;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key)) {
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
  }, [handleShooting, handleRestart, handleEditorToggle, gameState?.gameStatus]);

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

  // Show hero selection screen
  if (showHeroSelection) {
    return <HeroSelection onHeroSelect={handleHeroSelect} />;
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
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {gameState.editorMode ? 'Level Editor' : `Enhanced Grid Game - ${gameState.selectedHeroType?.name || 'Unknown Hero'}`}
        </h1>
        <p className="text-gray-600">
          {gameState.editorMode 
            ? 'Click on the grid to place objects • E to toggle editor • Test your level when ready'
            : 'WASD to move • Arrow Keys to shoot • E for editor • ESC for hero selection'
          }
        </p>
        <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>Score: {gameState.score}</span>
          <span>•</span>
          <span>Health: {gameState.player.health}/{gameState.player.maxHealth}</span>
          <span>•</span>
          <span>Enemies: {gameState.enemies.length}</span>
          <span>•</span>
          <span>Party: {gameState.partyHeroes.length}</span>
          <span>•</span>
          <span>Status: {gameState.gameStatus}</span>
        </div>
        
        {gameState.editorMode && (
          <div className="mt-2 text-sm text-blue-600 font-medium">Editor Mode Active - Selected Tool: {gameState.selectedTool}</div>
        )}
        
        {/* Hero Stats */}
        {gameState.selectedHeroType && (
          <div className="mt-3 flex items-center justify-center space-x-6 text-xs text-gray-600">
            <span>Move Speed: {gameState.selectedHeroType.moveSpeed}ms</span>
            <span>•</span>
            <span>Shoot Rate: {gameState.selectedHeroType.shootCooldown}ms</span>
            <span>•</span>
            <span>Max Health: {gameState.selectedHeroType.maxHealth}</span>
          </div>
        )}
        
        {/* Health Bar */}
        <div className="mt-3 flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Health:</span>
          <div className="flex space-x-1">
            {Array.from({ length: gameState.player.maxHealth }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded border-2 ${
                  i < gameState.player.health
                    ? gameState.player.health === gameState.player.maxHealth
                      ? 'bg-green-500 border-green-600'
                      : gameState.player.health > 1
                      ? 'bg-yellow-500 border-yellow-600'
                      : 'bg-red-500 border-red-600'
                    : 'bg-gray-200 border-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Party Heroes */}
        {gameState.partyHeroes.length > 0 && (
          <div className="mt-3 flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">Party:</span>
            <div className="flex space-x-1">
              {gameState.partyHeroes.map((hero, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold text-white"
                  style={{ 
                    backgroundColor: hero.color, 
                    borderColor: hero.borderColor 
                  }}
                >
                  {hero.name.charAt(0)}
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
            <span>Player: ({gameState.player.position.x}, {gameState.player.position.y})</span>
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
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">WASD</kbd>
                <span className="text-gray-600">Move in 4 directions</span>
              </div>
              <div className="text-xs text-gray-500">{gameState.selectedHeroType?.moveSpeed || 500}ms per cell movement</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Combat</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">↑↓←→</kbd>
                <span className="text-gray-600">Shoot projectiles</span>
              </div>
              <div className="text-xs text-gray-500">200ms projectile speed</div>
              <div className="text-xs text-gray-500">{gameState.selectedHeroType?.shootCooldown || 300}ms cooldown between shots</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Game Rules</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Reach the top edge to win</p>
              <p>• Avoid enemy projectiles and collisions</p>
              <p>• Shoot enemies to eliminate them</p>
              <p>• Player has {gameState.selectedHeroType?.maxHealth || 3} health points</p>
              <p>• Enemies have 1 health point each</p>
              <p>• Enemies auto-shoot in line of sight</p>
              <p>• Press R to restart after game over</p>
              <p>• Defeat all enemies for level complete</p>
              <p>• Press ESC to return to hero selection</p>
              <p>• Collect diamond heroes to build your party</p>
              <p>• Press E to enter level editor mode</p>
              <p>• Collect star power-ups for temporary abilities</p>
              <p>• All party members must reach the exit to win</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">Performance Features</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Pre-rendered grid for optimal performance</p>
            <p>• Efficient collision detection system</p>
            <p>• Smooth 60fps gameplay with requestAnimationFrame</p>
            <p>• Modular architecture for easy expansion</p>
            <p>• Dynamic collectible and power-up systems</p>
            <p>• Strategic party-building mechanics</p>
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
        />
      )}
    </div>
  );
};

// Import POWER_UP_TYPES for the component
import { POWER_UP_TYPES } from '../config/GameConfig';

export default GridGame;