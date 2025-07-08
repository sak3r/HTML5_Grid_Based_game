export interface Position {
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  position: Position;
  direction: Position;
  speed: number;
  ownerId: string;
  color: string;
  lastMoveTime: number;
}

export interface Enemy {
  id: string;
  position: Position;
  originalPosition: Position;
  patrolRadius: number;
  color: string;
  borderColor: string;
  isChasing: boolean;
  lastMoveTime: number;
  lastShootTime: number;
  canShoot: boolean;
}

export interface Player {
  position: Position;
  lastMoveTime: number;
  lastShootTime: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  gameStatus: 'playing' | 'gameOver' | 'victory' | 'paused';
  score: number;
  level: number;
}

export interface GameConfig {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  GRID_SIZE: number;
  PLAYER_MOVE_SPEED: number;
  ENEMY_MOVE_SPEED: number;
  PROJECTILE_SPEED: number;
  SHOOT_COOLDOWN: number;
}