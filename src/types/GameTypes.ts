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
  health: number;
  maxHealth: number;
  isHit: boolean;
  hitTime: number;
  isDestroyed: boolean;
  destroyTime: number;
}

export interface Player {
  position: Position;
  lastMoveTime: number;
  lastShootTime: number;
  health: number;
  maxHealth: number;
  isHit: boolean;
  hitTime: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  collectibleHeroes: CollectibleHero[];
  powerUps: PowerUp[];
  partyHeroes: HeroType[];
  activePowerUps: ActivePowerUp[];
  gameStatus: 'playing' | 'gameOver' | 'victory' | 'levelComplete' | 'paused';
  score: number;
  level: number;
  selectedHeroType: HeroType | null;
  editorMode: boolean;
  selectedTool: EditorTool;
  editorObjects: EditorObject[];
  selectedObject: EditorObject | null;
  hoveredObject: EditorObject | null;
  isDragging: boolean;
  dragStart: Position | null;
}

export type EditorTool = 'enemy' | 'wall' | 'collectible' | 'playerStart' | 'exit' | 'powerup';

export interface EditorObject {
  id: string;
  type: EditorTool;
  position: Position;
  config: any; // Flexible config object for different object types
}

export interface EnemyConfig {
  patrolRadius: number;
  color: string;
  borderColor: string;
  health: number;
}

export interface WallConfig {
  isConnected: boolean;
  connections: Position[];
}

export interface ExitZoneConfig {
  width: number;
  height: number;
}

export interface Wall {
  id: string;
  position: Position;
}

export interface ExitZone {
  id: string;
  position: Position;
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

export interface HeroType {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  maxHealth: number;
  moveSpeed: number;
  shootCooldown: number;
  description: string;
}

export interface CollectibleHero {
  id: string;
  position: Position;
  heroType: HeroType;
  collected: boolean;
}

export interface PowerUp {
  id: string;
  position: Position;
  type: 'speedBoost' | 'rapidFire' | 'shield';
  collected: boolean;
}

export interface ActivePowerUp {
  type: 'speedBoost' | 'rapidFire' | 'shield';
  startTime: number;
  duration: number;
}

export interface PowerUpConfig {
  type: 'speedBoost' | 'rapidFire' | 'shield';
  name: string;
  duration: number;
  color: string;
  icon: string;
}

export interface LevelData {
  playerStart: Position;
  enemies: Enemy[];
  walls: Wall[];
  collectibleHeroes: CollectibleHero[];
  powerUps: PowerUp[];
  exitZones: ExitZone[];
}