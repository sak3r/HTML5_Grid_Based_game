export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  position: Position;
  isOccupied: boolean;
  occupantType: 'player' | 'enemy' | 'wall' | 'collectible' | 'powerup' | 'exit' | null;
  occupantId: string | null;
  isWalkable: boolean;
  isVisible: boolean;
}

export interface GridConfig {
  columns: number;
  rows: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface PlayerState {
  playerId: string;
  currentPosition: Position;
  previousPosition: Position;
  currentHealth: number;
  maximumHealth: number;
  isHitRecently: boolean;
  hitTimestamp: number;
  lastMoveTimestamp: number;
  lastShootTimestamp: number;
  movementSpeed: number;
  isAlive: boolean;
  heroType: HeroType | null;
}

export interface PlayerStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  enemiesDefeated: number;
  captivesRescued: number;
  powerUpsCollected: number;
  distanceTraveled: number;
  shotsfired: number;
  accuracyPercentage: number;
}

export enum WeaponType {
  RIFLE = 'rifle',
  SPEAR = 'spear',
  BOOMERANG = 'boomerang',
  GRENADE = 'grenade',
  FLAMETHROWER = 'flamethrower',
  SNIPER_RIFLE = 'sniper_rifle',
  THROWING_STAR = 'throwing_star',
  MAGIC_BOLT = 'magic_bolt',
  AXE = 'axe',
  BOW = 'bow'
}

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  description: string;
  damage: number;
  cooldown: number;
  range: number;
  speed: number;
  color: string;
  icon: string;
  penetration: boolean;
  areaEffect: boolean;
  returning: boolean;
  continuous: boolean;
  pierceWalls: boolean;
  melee: boolean;
  parabolic: boolean;
  multiShot: boolean;
}

export interface Projectile {
  id: string;
  position: Position;
  direction: Position;
  speed: number;
  ownerId: string;
  color: string;
  lastMoveTime: number;
  weaponType: WeaponType;
  damage: number;
  penetration: boolean;
  areaEffect: boolean;
  returning: boolean;
  continuous: boolean;
  startPosition?: Position;
  hasReturned?: boolean;
  explosionRadius?: number;
  flameLength?: number;
  penetratedEnemies?: string[];
  pierceWalls: boolean;
  melee: boolean;
  parabolic: boolean;
  multiShot: boolean;
  trajectory?: Position[];
  currentTrajectoryIndex?: number;
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
  enemyType: EnemyType;
  moveSpeed: number;
  shootCooldown: number;
  shootRange: number;
  startDirection: Position;
  behaviorPattern: BehaviorPattern;
}

export interface EnemyType {
  id: string;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  icon: string;
  maxHealth: number;
  moveSpeed: number;
  shootCooldown: number;
  shootRange: number;
  defaultPatrolRadius: number;
  defaultBehavior: BehaviorPattern;
}

export type BehaviorPattern = 'patrol' | 'guard' | 'aggressive' | 'defensive';

export interface EnemyConfigPanel {
  isOpen: boolean;
  position: Position;
  enemyType: EnemyType;
  patrolRadius: number;
  startDirection: Position;
  behaviorPattern: BehaviorPattern;
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

export interface Captive {
  id: string;
  position: Position;
  originalHeroType: HeroType;
  rescueRadius: number;
  captureTime: number;
  blinkState: boolean;
  lastBlinkTime: number;
}

export interface GameState {
  player1: Player;
  player2: Player;
  currentPlayer: 1 | 2; // For turn-based mode
  gameMode: 'cooperative' | 'turnBased';
  enemies: Enemy[];
  projectiles: Projectile[];
  collectibleHeroes: CollectibleHero[];
  powerUps: PowerUp[];
  partyHeroes: HeroType[];
  captives: Captive[];
  activePartyMembers: Player[];
  activePowerUps: ActivePowerUp[];
  gameStatus: 'playing' | 'gameOver' | 'victory' | 'levelComplete' | 'paused';
  score: number;
  level: number;
  selectedHeroType: HeroType | null;
  player1HeroType: HeroType | null;
  player2HeroType: HeroType | null;
  editorMode: boolean;
  selectedTool: EditorTool;
  editorObjects: EditorObject[];
  selectedObject: EditorObject | null;
  hoveredObject: EditorObject | null;
  isDragging: boolean;
  dragStart: Position | null;
  enemyConfigPanel: EnemyConfigPanel | null;
  selectedEnemyType: EnemyType;
  timeLimit: number; // in seconds
  timeRemaining: number; // in seconds
  gameStartTime: number; // timestamp when game started
  lastTimerUpdate: number; // timestamp of last timer update
  timerAlerts: {
    at60s: boolean;
    at30s: boolean;
    at10s: boolean;
  };
  campaignMode: boolean;
  currentCampaignLevel: number;
}

export interface CoopGameState extends GameState {
  sharedScore: number;
  rescueCount: number;
  playersAtExit: boolean[];
  cooperativeObjectives: {
    allCharactersRescued: boolean;
    allPlayersAtExit: boolean;
    allEnemiesDefeated: boolean;
  };
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
  enemyType: EnemyType;
  moveSpeed: number;
  shootCooldown: number;
  shootRange: number;
  startDirection: Position;
  behaviorPattern: BehaviorPattern;
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
  weaponType: WeaponType;
  specialAbility: string;
  role: string;
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
  metadata: LevelMetadata;
  editorObjects: EditorObject[];
}

export interface LevelMetadata {
  name: string;
  author: string;
  description: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit?: number; // optional time limit in seconds
}

export interface LevelStatistics {
  enemyCount: number;
  collectibleCount: number;
  powerUpCount: number;
  wallCount: number;
  exitZoneCount: number;
  hasPlayerStart: boolean;
  isValid: boolean;
  validationErrors: string[];
  timeLimit: number;
}

export interface LevelCampaign {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  unlockConditions: {
    requiredLevel: number;
    requiredScore?: number;
    requiredTime?: number;
    mustRescueAll?: boolean;
  };
  rewards: {
    unlockedHeroes?: string[];
    unlockedWeapons?: WeaponType[];
    bonusScore: number;
    achievements?: string[];
  };
  levelData: LevelData;
  difficultyScaling: {
    enemyCount: number;
    enemyHealthMultiplier: number;
    timeLimit: number;
    additionalObjectives?: string[];
  };
}

export interface CampaignProgress {
  currentLevel: number;
  completedLevels: number[];
  unlockedLevels: number[];
  totalScore: number;
  unlockedHeroes: string[];
  unlockedWeapons: WeaponType[];
  achievements: string[];
  bestTimes: Record<number, number>;
  bestScores: Record<number, number>;
  lastPlayed: string;
}

export interface LevelCompletionResult {
  levelId: number;
  completed: boolean;
  score: number;
  timeElapsed: number;
  allCaptivesRescued: boolean;
  perfectRun: boolean;
  newUnlocks: {
    heroes: string[];
    weapons: WeaponType[];
    achievements: string[];
  };
}