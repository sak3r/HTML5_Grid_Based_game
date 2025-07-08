import { Position, HeroType, WeaponType, PlayerState, PlayerStats } from '../types/GameTypes';
import { GAME_CONFIG, WEAPON_CONFIGS } from '../config/GameConfig';

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

export interface PlayerMovementResult {
  success: boolean;
  newPosition: Position;
  errorMessage?: string;
}

export interface PlayerShootingResult {
  success: boolean;
  projectileId?: string;
  errorMessage?: string;
}

/**
 * Player class handles individual player state, movement, and interactions
 */
export class Player {
  private playerState: PlayerState;
  private playerStats: PlayerStats;
  private readonly playerId: string;

  constructor(playerId: string, startingPosition: Position, heroType: HeroType | null = null) {
    this.playerId = playerId;
    this.playerState = this.initializePlayerState(playerId, startingPosition, heroType);
    this.playerStats = this.initializePlayerStats();
  }

  /**
   * Initialize player state with default values
   */
  private initializePlayerState(
    playerId: string, 
    startingPosition: Position, 
    heroType: HeroType | null
  ): PlayerState {
    const maximumHealth = heroType?.maxHealth || GAME_CONFIG.PLAYER_MAX_HEALTH;
    
    return {
      playerId,
      currentPosition: { ...startingPosition },
      previousPosition: { ...startingPosition },
      currentHealth: maximumHealth,
      maximumHealth,
      isHitRecently: false,
      hitTimestamp: 0,
      lastMoveTimestamp: 0,
      lastShootTimestamp: 0,
      movementSpeed: heroType?.moveSpeed || GAME_CONFIG.PLAYER_MOVE_SPEED,
      isAlive: true,
      heroType
    };
  }

  /**
   * Initialize player statistics
   */
  private initializePlayerStats(): PlayerStats {
    return {
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      enemiesDefeated: 0,
      captivesRescued: 0,
      powerUpsCollected: 0,
      distanceTraveled: 0,
      shotsfired: 0,
      accuracyPercentage: 0
    };
  }

  /**
   * Attempt to move player to new position
   */
  public attemptMovement(
    targetPosition: Position, 
    currentTimestamp: number,
    isValidMovement: (position: Position) => boolean
  ): PlayerMovementResult {
    // Check if enough time has passed since last movement
    if (currentTimestamp - this.playerState.lastMoveTimestamp < this.playerState.movementSpeed) {
      return {
        success: false,
        newPosition: this.playerState.currentPosition,
        errorMessage: 'Movement cooldown not finished'
      };
    }

    // Validate target position
    if (!isValidMovement(targetPosition)) {
      return {
        success: false,
        newPosition: this.playerState.currentPosition,
        errorMessage: 'Invalid target position'
      };
    }

    // Calculate distance for statistics
    const movementDistance = this.calculateDistance(this.playerState.currentPosition, targetPosition);
    
    // Update player state
    this.playerState.previousPosition = { ...this.playerState.currentPosition };
    this.playerState.currentPosition = { ...targetPosition };
    this.playerState.lastMoveTimestamp = currentTimestamp;
    
    // Update statistics
    this.playerStats.distanceTraveled += movementDistance;

    return {
      success: true,
      newPosition: this.playerState.currentPosition
    };
  }

  /**
   * Attempt to shoot in specified direction
   */
  public attemptShooting(
    shootingDirection: Position,
    currentTimestamp: number
  ): PlayerShootingResult {
    if (!this.playerState.heroType) {
      return {
        success: false,
        errorMessage: 'No hero type assigned'
      };
    }

    const weaponConfiguration = WEAPON_CONFIGS[this.playerState.heroType.weaponType];
    const shootingCooldown = weaponConfiguration.cooldown;

    // Check if enough time has passed since last shot
    if (currentTimestamp - this.playerState.lastShootTimestamp < shootingCooldown) {
      return {
        success: false,
        errorMessage: 'Shooting cooldown not finished'
      };
    }

    // Validate shooting direction
    if (shootingDirection.x === 0 && shootingDirection.y === 0) {
      return {
        success: false,
        errorMessage: 'Invalid shooting direction'
      };
    }

    // Update player state
    this.playerState.lastShootTimestamp = currentTimestamp;
    
    // Update statistics
    this.playerStats.shotsfired++;

    // Generate unique projectile ID
    const projectileId = `${this.playerId}-projectile-${currentTimestamp}`;

    return {
      success: true,
      projectileId
    };
  }

  /**
   * Apply damage to player
   */
  public takeDamage(damageAmount: number, currentTimestamp: number): boolean {
    if (!this.playerState.isAlive) {
      return false;
    }

    this.playerState.currentHealth = Math.max(0, this.playerState.currentHealth - damageAmount);
    this.playerState.isHitRecently = true;
    this.playerState.hitTimestamp = currentTimestamp;
    
    // Update statistics
    this.playerStats.totalDamageTaken += damageAmount;

    // Check if player is defeated
    if (this.playerState.currentHealth <= 0) {
      this.playerState.isAlive = false;
    }

    return this.playerState.isAlive;
  }

  /**
   * Heal player
   */
  public receiveHealing(healingAmount: number): number {
    const previousHealth = this.playerState.currentHealth;
    this.playerState.currentHealth = Math.min(
      this.playerState.maximumHealth, 
      this.playerState.currentHealth + healingAmount
    );
    
    return this.playerState.currentHealth - previousHealth;
  }

  /**
   * Update hit flash state
   */
  public updateHitFlash(currentTimestamp: number): void {
    if (this.playerState.isHitRecently && 
        currentTimestamp - this.playerState.hitTimestamp >= GAME_CONFIG.HIT_FLASH_DURATION) {
      this.playerState.isHitRecently = false;
    }
  }

  /**
   * Change hero type
   */
  public changeHeroType(newHeroType: HeroType): void {
    const healthRatio = this.playerState.currentHealth / this.playerState.maximumHealth;
    
    this.playerState.heroType = newHeroType;
    this.playerState.maximumHealth = newHeroType.maxHealth;
    this.playerState.currentHealth = Math.floor(newHeroType.maxHealth * healthRatio);
    this.playerState.movementSpeed = newHeroType.moveSpeed;
  }

  /**
   * Get current player state (read-only)
   */
  public getState(): Readonly<PlayerState> {
    return { ...this.playerState };
  }

  /**
   * Get current player statistics (read-only)
   */
  public getStatistics(): Readonly<PlayerStats> {
    return { ...this.playerStats };
  }

  /**
   * Get player ID
   */
  public getPlayerId(): string {
    return this.playerId;
  }

  /**
   * Check if player can perform action
   */
  public canPerformAction(actionType: 'move' | 'shoot', currentTimestamp: number): boolean {
    if (!this.playerState.isAlive) {
      return false;
    }

    switch (actionType) {
      case 'move':
        return currentTimestamp - this.playerState.lastMoveTimestamp >= this.playerState.movementSpeed;
      case 'shoot':
        if (!this.playerState.heroType) return false;
        const weaponConfig = WEAPON_CONFIGS[this.playerState.heroType.weaponType];
        return currentTimestamp - this.playerState.lastShootTimestamp >= weaponConfig.cooldown;
      default:
        return false;
    }
  }

  /**
   * Reset player to initial state
   */
  public reset(startingPosition: Position, heroType: HeroType | null = null): void {
    this.playerState = this.initializePlayerState(this.playerId, startingPosition, heroType);
    this.playerStats = this.initializePlayerStats();
  }

  /**
   * Update statistics for successful hit
   */
  public recordSuccessfulHit(damageDealt: number): void {
    this.playerStats.totalDamageDealt += damageDealt;
    
    // Update accuracy calculation
    if (this.playerStats.shotsfired > 0) {
      // This is a simplified accuracy calculation - in a real game you'd track hits vs misses
      this.playerStats.accuracyPercentage = (this.playerStats.totalDamageDealt / this.playerStats.shotsfired) * 10;
    }
  }

  /**
   * Record enemy defeat
   */
  public recordEnemyDefeat(): void {
    this.playerStats.enemiesDefeated++;
  }

  /**
   * Record captive rescue
   */
  public recordCaptiveRescue(): void {
    this.playerStats.captivesRescued++;
  }

  /**
   * Record power-up collection
   */
  public recordPowerUpCollection(): void {
    this.playerStats.powerUpsCollected++;
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(position1: Position, position2: Position): number {
    const deltaX = position1.x - position2.x;
    const deltaY = position1.y - position2.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Get current weapon configuration
   */
  public getCurrentWeaponConfig() {
    if (!this.playerState.heroType) {
      return null;
    }
    return WEAPON_CONFIGS[this.playerState.heroType.weaponType];
  }

  /**
   * Get health percentage
   */
  public getHealthPercentage(): number {
    return this.playerState.currentHealth / this.playerState.maximumHealth;
  }

  /**
   * Check if player is at position
   */
  public isAtPosition(position: Position): boolean {
    return this.playerState.currentPosition.x === position.x && 
           this.playerState.currentPosition.y === position.y;
  }
}