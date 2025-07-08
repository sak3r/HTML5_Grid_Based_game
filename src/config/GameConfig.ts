import { GameConfig } from '../types/GameTypes';

export const GAME_CONFIG: GameConfig = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 32,
  PLAYER_MOVE_SPEED: 500, // ms per cell
  ENEMY_MOVE_SPEED: 800, // ms per cell
  PROJECTILE_SPEED: 200, // ms per cell (2x faster than player)
  SHOOT_COOLDOWN: 300, // ms between shots
};

export const GRID_COLS = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE);
export const GRID_ROWS = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE);

// Colors
export const COLORS = {
  GRID: '#e5e7eb',
  GRID_BORDER: '#d1d5db',
  BACKGROUND: '#f9fafb',
  PLAYER: '#3b82f6',
  PLAYER_BORDER: '#1e40af',
  PLAYER_PROJECTILE: '#60a5fa',
  ENEMY_PROJECTILE: '#ef4444',
  PATROL_RADIUS: 'rgba(255, 0, 0, 0.1)',
  PATROL_BORDER: 'rgba(255, 0, 0, 0.2)',
};

export const ENEMY_CONFIGS = [
  {
    id: 'enemy1',
    position: { x: 5, y: 5 },
    patrolRadius: 3,
    color: '#ef4444',
    borderColor: '#dc2626',
  },
  {
    id: 'enemy2',
    position: { x: 18, y: 8 },
    patrolRadius: 4,
    color: '#f97316',
    borderColor: '#ea580c',
  },
  {
    id: 'enemy3',
    position: { x: 8, y: 12 },
    patrolRadius: 3,
    color: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  {
    id: 'enemy4',
    position: { x: 20, y: 15 },
    patrolRadius: 4,
    color: '#06b6d4',
    borderColor: '#0891b2',
  },
];