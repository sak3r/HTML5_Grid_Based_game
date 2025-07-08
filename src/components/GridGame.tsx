import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: string;
  position: Position;
  originalPosition: Position;
  patrolRadius: number;
  color: string;
  borderColor: string;
  isChasing: boolean;
  lastMoveTime: number;
}

interface GameState {
  player: Position;
  enemies: Enemy[];
  lastPlayerMoveTime: number;
}

const GridGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef<number>(0);

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_SIZE = 32;
  const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
  const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
  const PLAYER_SPEED = 64; // pixels per second (400ms per cell)
  const ENEMY_SPEED = 40; // pixels per second (slower than player)

  // Colors
  const GRID_COLOR = '#e5e7eb';
  const GRID_BORDER_COLOR = '#d1d5db';
  const PLAYER_COLOR = '#3b82f6';
  const PLAYER_BORDER_COLOR = '#1e40af';
  const BACKGROUND_COLOR = '#f9fafb';
  const PATROL_RADIUS_COLOR = 'rgba(255, 0, 0, 0.1)';

  const [gameState, setGameState] = useState<GameState>({
    player: { x: 12, y: 17 }, // Start at bottom center
    enemies: [
      {
        id: 'enemy1',
        position: { x: 5, y: 5 },
        originalPosition: { x: 5, y: 5 },
        patrolRadius: 3,
        color: '#ef4444',
        borderColor: '#dc2626',
        isChasing: false,
        lastMoveTime: 0
      },
      {
        id: 'enemy2',
        position: { x: 18, y: 8 },
        originalPosition: { x: 18, y: 8 },
        patrolRadius: 4,
        color: '#f97316',
        borderColor: '#ea580c',
        isChasing: false,
        lastMoveTime: 0
      },
      {
        id: 'enemy3',
        position: { x: 8, y: 12 },
        originalPosition: { x: 8, y: 12 },
        patrolRadius: 3,
        color: '#8b5cf6',
        borderColor: '#7c3aed',
        isChasing: false,
        lastMoveTime: 0
      },
      {
        id: 'enemy4',
        position: { x: 20, y: 15 },
        originalPosition: { x: 20, y: 15 },
        patrolRadius: 4,
        color: '#06b6d4',
        borderColor: '#0891b2',
        isChasing: false,
        lastMoveTime: 0
      }
    ],
    lastPlayerMoveTime: 0
  });

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = GRID_BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const drawPatrolRadius = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const centerX = (enemy.originalPosition.x * GRID_SIZE) + (GRID_SIZE / 2);
    const centerY = (enemy.originalPosition.y * GRID_SIZE) + (GRID_SIZE / 2);
    const radius = enemy.patrolRadius * GRID_SIZE;

    ctx.fillStyle = PATROL_RADIUS_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const drawCharacter = useCallback((ctx: CanvasRenderingContext2D, position: Position, color: string, borderColor: string, isPlayer: boolean = false) => {
    const pixelX = position.x * GRID_SIZE;
    const pixelY = position.y * GRID_SIZE;

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(pixelX + 2, pixelY + 2, GRID_SIZE - 4, GRID_SIZE - 4);

    // Draw character
    ctx.fillStyle = color;
    ctx.fillRect(pixelX + 2, pixelY + 2, GRID_SIZE - 4, GRID_SIZE - 4);

    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pixelX + 2, pixelY + 2, GRID_SIZE - 4, GRID_SIZE - 4);

    // Draw highlight (only for player)
    if (isPlayer) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(pixelX + 4, pixelY + 4, GRID_SIZE - 12, 8);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    drawGrid(ctx);

    // Draw patrol radii
    gameState.enemies.forEach(enemy => {
      drawPatrolRadius(ctx, enemy);
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      drawCharacter(ctx, enemy.position, enemy.color, enemy.borderColor);
    });

    // Draw player
    drawCharacter(ctx, gameState.player, PLAYER_COLOR, PLAYER_BORDER_COLOR, true);
  }, [drawGrid, drawPatrolRadius, drawCharacter, gameState.player, gameState.enemies]);

  const isValidPlayerMove = useCallback((newX: number, newY: number): boolean => {
    // Player can only exit through the top edge (y = -1), otherwise must stay within bounds
    if (newY < 0) {
      return newY === -1 && newX >= 0 && newX < GRID_COLS; // Only allow exit through top with valid x
    }
    
    // Check other boundaries
    if (newX < 0 || newX >= GRID_COLS || newY >= GRID_ROWS) {
      return false;
    }
    
    return true;
  }, [GRID_COLS, GRID_ROWS]);

  const moveEnemyTowardsTarget = useCallback((enemy: Enemy, target: Position): Position => {
    const dx = target.x - enemy.position.x;
    const dy = target.y - enemy.position.y;
    
    let moveX = 0;
    let moveY = 0;
    
    // Move one step closer to target
    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      moveY = dy > 0 ? 1 : -1;
    } else if (dx !== 0) {
      moveX = dx > 0 ? 1 : -1;
    }
    
    const newX = Math.max(0, Math.min(GRID_COLS - 1, enemy.position.x + moveX));
    const newY = Math.max(0, Math.min(GRID_ROWS - 1, enemy.position.y + moveY));
    
    return { x: newX, y: newY };
  }, [GRID_COLS, GRID_ROWS]);

  const updateGame = useCallback((deltaTime: number) => {
    const currentTime = Date.now();
    
    // Handle player movement
    let deltaX = 0;
    let deltaY = 0;
    
    if (pressedKeys.current.has('KeyW') || pressedKeys.current.has('ArrowUp')) deltaY -= 1;
    if (pressedKeys.current.has('KeyS') || pressedKeys.current.has('ArrowDown')) deltaY += 1;
    if (pressedKeys.current.has('KeyA') || pressedKeys.current.has('ArrowLeft')) deltaX -= 1;
    if (pressedKeys.current.has('KeyD') || pressedKeys.current.has('ArrowRight')) deltaX += 1;

    // Normalize diagonal movement
    if (deltaX !== 0 && deltaY !== 0) {
      deltaX *= 0.7071; // 1/sqrt(2)
      deltaY *= 0.7071;
    }

    // Apply movement if enough time has passed
    if (currentTime - gameState.lastPlayerMoveTime >= 400 && (deltaX !== 0 || deltaY !== 0)) {
      const newX = gameState.player.x + Math.sign(deltaX);
      const newY = gameState.player.y + Math.sign(deltaY);
      
      if (isValidPlayerMove(newX, newY)) {
        setGameState(prev => ({
          ...prev,
          player: { x: newX, y: newY },
          lastPlayerMoveTime: currentTime
        }));
      }
    }

    // Update enemies
    setGameState(prev => ({
      ...prev,
      enemies: prev.enemies.map(enemy => {
        if (currentTime - enemy.lastMoveTime < 800) {
          return enemy; // Too soon to move
        }

        const distanceToPlayer = calculateDistance(enemy.originalPosition, prev.player);
        const shouldChase = distanceToPlayer <= enemy.patrolRadius;
        
        let newPosition = enemy.position;
        
        if (shouldChase) {
          // Chase player
          newPosition = moveEnemyTowardsTarget(enemy, prev.player);
        } else if (enemy.isChasing) {
          // Return to original position
          if (enemy.position.x !== enemy.originalPosition.x || enemy.position.y !== enemy.originalPosition.y) {
            newPosition = moveEnemyTowardsTarget(enemy, enemy.originalPosition);
          }
        }
        
        const moved = newPosition.x !== enemy.position.x || newPosition.y !== enemy.position.y;
        
        return {
          ...enemy,
          position: newPosition,
          isChasing: shouldChase,
          lastMoveTime: moved ? currentTime : enemy.lastMoveTime
        };
      })
    }));
  }, [gameState, isValidPlayerMove, calculateDistance, moveEnemyTowardsTarget]);

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
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
        pressedKeys.current.add(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.code;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
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
  }, []);

  useEffect(() => {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grid Game</h1>
        <p className="text-gray-600">Use WASD or Arrow Keys to move • Avoid the patrolling enemies • Exit through the top</p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
          style={{ imageRendering: 'pixelated' }}
        />

        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
            <span>Grid: {GRID_COLS}×{GRID_ROWS}</span>
            <span>•</span>
            <span>Cell Size: {GRID_SIZE}px</span>
            <span>Player: ({gameState.player.x}, {gameState.player.y})</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Game Controls & Rules</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Movement</h3>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">WASD</kbd>
              <span className="text-gray-600">Move in 8 directions</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">↑↓←→</kbd>
              <span className="text-gray-600">Arrow keys also work</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Game Rules</h3>
            <div className="space-y-1 text-gray-600">
              <p>• Move 400ms per cell</p>
              <p>• Exit only through the top edge</p>
              <p>• Avoid enemy patrol zones</p>
              <p>• Enemies chase when you enter their radius</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridGame;

export default GridGame;