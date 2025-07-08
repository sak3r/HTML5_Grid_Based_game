import { GameConfig, HeroType } from '../types/GameTypes';
import { EnemyType, BehaviorPattern } from '../types/GameTypes';

export const GAME_CONFIG: GameConfig = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 32,
  PLAYER_MOVE_SPEED: 500, // ms per cell (default, overridden by hero type)
  ENEMY_MOVE_SPEED: 800, // ms per cell
  PROJECTILE_SPEED: 200, // ms per cell (2x faster than player)
  SHOOT_COOLDOWN: 300, // ms between shots (default, overridden by hero type)
  HIT_FLASH_DURATION: 200, // ms for hit flash effect
  DESTROY_FADE_DURATION: 500, // ms for enemy destroy fade
  PLAYER_MAX_HEALTH: 3, // default, overridden by hero type
  ENEMY_MAX_HEALTH: 1,
  POWER_UP_SPEED_MULTIPLIER: 0.5, // 50% faster
  POWER_UP_SHOOT_MULTIPLIER: 0.5, // 50% faster
  EDITOR_SIDEBAR_WIDTH: 300,
  DEFAULT_TIME_LIMIT: 180, // 3 minutes in seconds
  TIMER_WARNING_THRESHOLD: 60, // yellow at 60 seconds
  TIMER_CRITICAL_THRESHOLD: 30, // red at 30 seconds
  TIMER_FINAL_WARNING: 10, // final warning at 10 seconds
  CAPTIVE_RESCUE_RADIUS: 1, // grid cells
  CAPTIVE_BLINK_INTERVAL: 500, // ms between blinks
  CAPTIVE_RESCUED_HEALTH: 1, // health when rescued
};

export const GRID_COLS = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE);
export const GRID_ROWS = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE);

// Hero Types
export const HERO_TYPES: HeroType[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    color: '#dc2626',
    borderColor: '#991b1b',
    maxHealth: 4,
    moveSpeed: 500,
    shootCooldown: 300,
    description: 'Balanced fighter with good health and moderate speed',
  },
  {
    id: 'scout',
    name: 'Scout',
    color: '#16a34a',
    borderColor: '#15803d',
    maxHealth: 2,
    moveSpeed: 300,
    shootCooldown: 200,
    description: 'Fast and agile with quick shooting but low health',
  },
  {
    id: 'tank',
    name: 'Tank',
    color: '#2563eb',
    borderColor: '#1d4ed8',
    maxHealth: 5,
    moveSpeed: 700,
    shootCooldown: 400,
    description: 'Heavy armor with high health but slower movement',
  },
];

// Enemy Types
export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'guard',
    name: 'Guard',
    description: 'Basic enemy with balanced stats',
    color: '#ef4444',
    borderColor: '#dc2626',
    icon: '🛡️',
    maxHealth: 2,
    moveSpeed: 800,
    shootCooldown: 1000,
    shootRange: 5,
    defaultPatrolRadius: 3,
    defaultBehavior: 'patrol',
  },
  {
    id: 'sniper',
    name: 'Sniper',
    description: 'Long-range enemy with fast shooting',
    color: '#8b5cf6',
    borderColor: '#7c3aed',
    icon: '🎯',
    maxHealth: 1,
    moveSpeed: 1200,
    shootCooldown: 600,
    shootRange: 8,
    defaultPatrolRadius: 2,
    defaultBehavior: 'guard',
  },
  {
    id: 'tank',
    name: 'Tank',
    description: 'Heavy enemy with high health',
    color: '#059669',
    borderColor: '#047857',
    icon: '🚗',
    maxHealth: 4,
    moveSpeed: 1500,
    shootCooldown: 1500,
    shootRange: 4,
    defaultPatrolRadius: 2,
    defaultBehavior: 'aggressive',
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Fast enemy with low health',
    color: '#f59e0b',
    borderColor: '#d97706',
    icon: '⚡',
    maxHealth: 1,
    moveSpeed: 400,
    shootCooldown: 800,
    shootRange: 3,
    defaultPatrolRadius: 4,
    defaultBehavior: 'aggressive',
  },
];

// Colors
export const COLORS = {
  GRID: '#e5e7eb',
  GRID_BORDER: '#d1d5db',
  BACKGROUND: '#f9fafb',
  PLAYER: '#3b82f6', // Default, overridden by hero type
  PLAYER_BORDER: '#1e40af', // Default, overridden by hero type
  PLAYER_PROJECTILE: '#60a5fa',
  ENEMY_PROJECTILE: '#ef4444',
  PATROL_RADIUS: 'rgba(255, 0, 0, 0.1)',
  PATROL_BORDER: 'rgba(255, 0, 0, 0.2)',
  HIT_FLASH: '#ffffff',
  HEALTH_FULL: '#10b981',
  HEALTH_DAMAGED: '#f59e0b',
  HEALTH_CRITICAL: '#ef4444',
  WALL: '#6b7280',
  WALL_BORDER: '#374151',
  EXIT_ZONE: '#10b981',
  EXIT_ZONE_BORDER: '#059669',
  EDITOR_GRID: '#3b82f6',
  EDITOR_SELECTED: '#f59e0b',
  CAPTIVE_OVERLAY: 'rgba(128, 128, 128, 0.7)',
  CAPTIVE_BORDER: '#6b7280',
  RESCUE_RADIUS: 'rgba(34, 197, 94, 0.2)',
  RESCUE_BORDER: 'rgba(34, 197, 94, 0.4)',
};

export const ENEMY_CONFIGS = [
  {
    id: 'enemy1',
    position: { x: 5, y: 5 },
    patrolRadius: 3,
    color: '#ef4444',
    borderColor: '#dc2626',
    health: GAME_CONFIG.ENEMY_MAX_HEALTH,
    maxHealth: GAME_CONFIG.ENEMY_MAX_HEALTH,
    enemyType: ENEMY_TYPES[0], // Guard
    moveSpeed: ENEMY_TYPES[0].moveSpeed,
    shootCooldown: ENEMY_TYPES[0].shootCooldown,
    shootRange: ENEMY_TYPES[0].shootRange,
    startDirection: { x: 1, y: 0 },
    behaviorPattern: ENEMY_TYPES[0].defaultBehavior,
  },
  {
    id: 'enemy2',
    position: { x: 18, y: 8 },
    patrolRadius: 4,
    color: '#f97316',
    borderColor: '#ea580c',
    health: GAME_CONFIG.ENEMY_MAX_HEALTH,
    maxHealth: GAME_CONFIG.ENEMY_MAX_HEALTH,
    enemyType: ENEMY_TYPES[1], // Sniper
    moveSpeed: ENEMY_TYPES[1].moveSpeed,
    shootCooldown: ENEMY_TYPES[1].shootCooldown,
    shootRange: ENEMY_TYPES[1].shootRange,
    startDirection: { x: -1, y: 0 },
    behaviorPattern: ENEMY_TYPES[1].defaultBehavior,
  },
  {
    id: 'enemy3',
    position: { x: 8, y: 12 },
    patrolRadius: 3,
    color: '#8b5cf6',
    borderColor: '#7c3aed',
    health: GAME_CONFIG.ENEMY_MAX_HEALTH,
    maxHealth: GAME_CONFIG.ENEMY_MAX_HEALTH,
    enemyType: ENEMY_TYPES[2], // Tank
    moveSpeed: ENEMY_TYPES[2].moveSpeed,
    shootCooldown: ENEMY_TYPES[2].shootCooldown,
    shootRange: ENEMY_TYPES[2].shootRange,
    startDirection: { x: 0, y: 1 },
    behaviorPattern: ENEMY_TYPES[2].defaultBehavior,
  },
  {
    id: 'enemy4',
    position: { x: 20, y: 15 },
    patrolRadius: 4,
    color: '#06b6d4',
    borderColor: '#0891b2',
    health: GAME_CONFIG.ENEMY_MAX_HEALTH,
    maxHealth: GAME_CONFIG.ENEMY_MAX_HEALTH,
    enemyType: ENEMY_TYPES[3], // Scout
    moveSpeed: ENEMY_TYPES[3].moveSpeed,
    shootCooldown: ENEMY_TYPES[3].shootCooldown,
    shootRange: ENEMY_TYPES[3].shootRange,
    startDirection: { x: 0, y: -1 },
    behaviorPattern: ENEMY_TYPES[3].defaultBehavior,
  },
];

export const COLLECTIBLE_HERO_CONFIGS = [
  {
    id: 'collectible-warrior',
    position: { x: 3, y: 3 },
    heroType: HERO_TYPES[0], // Warrior
  },
  {
    id: 'collectible-scout',
    position: { x: 22, y: 6 },
    heroType: HERO_TYPES[1], // Scout
  },
  {
    id: 'collectible-tank',
    position: { x: 15, y: 10 },
    heroType: HERO_TYPES[2], // Tank
  },
  {
    id: 'collectible-warrior2',
    position: { x: 7, y: 16 },
    heroType: HERO_TYPES[0], // Another Warrior
  },
];

export const POWER_UP_CONFIGS = [
  {
    id: 'speedboost-1',
    position: { x: 10, y: 4 },
    type: 'speedBoost' as const,
  },
  {
    id: 'rapidfire-1',
    position: { x: 16, y: 8 },
    type: 'rapidFire' as const,
  },
  {
    id: 'shield-1',
    position: { x: 4, y: 14 },
    type: 'shield' as const,
  },
  {
    id: 'speedboost-2',
    position: { x: 20, y: 12 },
    type: 'speedBoost' as const,
  },
];

export const POWER_UP_TYPES = {
  speedBoost: {
    type: 'speedBoost' as const,
    name: 'Speed Boost',
    duration: 10000, // 10 seconds
    color: '#fbbf24',
    icon: '⚡',
  },
  rapidFire: {
    type: 'rapidFire' as const,
    name: 'Rapid Fire',
    duration: 8000, // 8 seconds
    color: '#f87171',
    icon: '🔥',
  },
  shield: {
    type: 'shield' as const,
    name: 'Shield',
    duration: 5000, // 5 seconds
    color: '#60a5fa',
    icon: '🛡️',
  },
};