import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Position } from '../types/GameTypes';
import { GAME_CONFIG, GRID_COLS, GRID_ROWS } from '../config/GameConfig';
import { GameRenderer } from './GameRenderer';
import { GameLogic } from './GameLogic';

const GridGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef<number>(0);
  const gameLogic = useRef<GameLogic>(new GameLogic());
  const renderer = useRef<GameRenderer | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => 
    gameLogic.current.createInitialGameState()
  );

  // Handle shooting
  const handleShooting = useCallback((direction: Position) => {
    const currentTime = Date.now();
    if (currentTime - gameState.player.lastShootTime >= GAME_CONFIG.SHOOT_COOLDOWN) {
      const projectile = gameLogic.current.createProjectile(
        gameState.player.position,
        direction,
        'player'
      );
      
      setGameState(prev => ({
        ...prev,
        projectiles: [...prev.projectiles, projectile],
        player: {
          ...prev.player,
          lastShootTime: currentTime,
        },
      }));
    }
  }, [gameState.player.lastShootTime, gameState.player.position]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setGameState(gameLogic.current.createInitialGameState());
  }, []);

  const updateGame = useCallback((deltaTime: number) => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      return gameLogic.current.updateGame(prev, pressedKeys.current, deltaTime);
    });
  }, []);

  const render = useCallback(() => {
    if (renderer.current) {
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
      if (key === 'KeyR' && (gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'victory' || gameState.gameStatus === 'levelComplete')) {
        event.preventDefault();
        handleRestart();
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
  }, [handleShooting, handleRestart, gameState.gameStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Enhanced Grid Game</h1>
        <p className="text-gray-600">
          WASD to move • Arrow Keys to shoot • Avoid enemies • Reach the top to win
        </p>
        <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>Score: {gameState.score}</span>
          <span>•</span>
          <span>Health: {gameState.player.health}/{gameState.player.maxHealth}</span>
          <span>•</span>
          <span>Enemies: {gameState.enemies.length}</span>
          <span>•</span>
          <span>Status: {gameState.gameStatus}</span>
        </div>
        
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
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
          style={{ imageRendering: 'pixelated' }}
        />

        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
            <span>Grid: {GRID_COLS}×{GRID_ROWS}</span>
            <span>•</span>
            <span>Player: ({gameState.player.position.x}, {gameState.player.position.y})</span>
            <span>•</span>
            <span>Projectiles: {gameState.projectiles.length}</span>
          </div>
        </div>
      </div>

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
              <div className="text-xs text-gray-500">500ms per cell movement</div>
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
              <div className="text-xs text-gray-500">300ms cooldown between shots</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Game Rules</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Reach the top edge to win</p>
              <p>• Avoid enemy projectiles and collisions</p>
              <p>• Shoot enemies to eliminate them</p>
              <p>• Player has 3 health points</p>
              <p>• Enemies have 1 health point each</p>
              <p>• Enemies auto-shoot in line of sight</p>
              <p>• Press R to restart after game over</p>
              <p>• Defeat all enemies for level complete</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridGame;