import { GameState, Position, Projectile, WeaponType, Player, Enemy, HeroType, CoopGameState } from '../types/GameTypes';
import { GRID_COLS, GRID_ROWS, WEAPON_CONFIGS, GAME_CONFIG, HERO_TYPES, ENEMY_CONFIGS, COLLECTIBLE_HERO_CONFIGS, POWER_UP_CONFIGS } from '../config/GameConfig';
import { isValidPosition, calculateDistance, generateId, checkCollision, moveTowardsTarget, isInLineOfSight, getDirectionToTarget } from '../utils/GameUtils';

export class GameLogic {
  createInitialGameState(heroType: HeroType, gameMode: 'cooperative' | 'turnBased' = 'cooperative'): GameState {
    const player1: Player = {
      position: { x: 1, y: GRID_ROWS - 2 },
      lastMoveTime: 0,
      lastShootTime: 0,
      health: heroType.maxHealth,
      maxHealth: heroType.maxHealth,
      isHit: false,
      hitTime: 0,
    };

    const player2: Player = {
      position: { x: 2, y: GRID_ROWS - 2 },
      lastMoveTime: 0,
      lastShootTime: 0,
      health: heroType.maxHealth,
      maxHealth: heroType.maxHealth,
      isHit: false,
      hitTime: 0,
    };

    return {
      player1,
      player2,
      currentPlayer: 1,
      gameMode,
      enemies: ENEMY_CONFIGS.map(config => ({
        ...config,
        lastMoveTime: 0,
        lastShootTime: 0,
        isChasing: false,
        canShoot: true,
        isHit: false,
        hitTime: 0,
        isDestroyed: false,
        destroyTime: 0,
      })),
      projectiles: [],
      collectibleHeroes: COLLECTIBLE_HERO_CONFIGS.map(config => ({
        ...config,
        collected: false,
      })),
      powerUps: POWER_UP_CONFIGS.map(config => ({
        ...config,
        collected: false,
      })),
      partyHeroes: [],
      captives: [],
      activePartyMembers: [],
      activePowerUps: [],
      gameStatus: 'playing',
      score: 0,
      level: 1,
      selectedHeroType: heroType,
      player1HeroType: heroType,
      player2HeroType: heroType,
      editorMode: false,
      selectedTool: 'enemy',
      editorObjects: [],
      selectedObject: null,
      hoveredObject: null,
      isDragging: false,
      dragStart: null,
      enemyConfigPanel: null,
      selectedEnemyType: { id: 'guard', name: 'Guard', description: 'Basic enemy', color: '#ef4444', borderColor: '#dc2626', icon: '🛡️', maxHealth: 2, moveSpeed: 800, shootCooldown: 1000, shootRange: 5, defaultPatrolRadius: 3, defaultBehavior: 'patrol' },
      timeLimit: GAME_CONFIG.DEFAULT_TIME_LIMIT,
      timeRemaining: GAME_CONFIG.DEFAULT_TIME_LIMIT,
      gameStartTime: Date.now(),
      lastTimerUpdate: Date.now(),
      timerAlerts: {
        at60s: false,
        at30s: false,
        at10s: false,
      },
    };
  }

  updateGame(gameState: GameState, pressedKeys: Set<string>, deltaTime: number): GameState {
    if (gameState.gameStatus !== 'playing') return gameState;

    const currentTime = Date.now();
    let newState = { ...gameState };

    // Update timer
    newState = this.updateTimer(newState, currentTime);

    // Handle player movement for both players
    newState = this.handlePlayerMovement(newState, pressedKeys, currentTime);

    // Update projectiles
    newState = this.updateProjectiles(newState, currentTime);

    // Update enemies
    newState = this.updateEnemies(newState, currentTime);

    // Check collisions
    newState = this.checkCollisions(newState);

    // Update captives
    newState = this.updateCaptives(newState, currentTime);

    // Update power-ups
    newState = this.updateActivePowerUps(newState, currentTime);

    // Check win/lose conditions
    newState = this.checkGameConditions(newState);

    return newState;
  }

  private handlePlayerMovement(gameState: GameState, pressedKeys: Set<string>, currentTime: number): GameState {
    let newState = { ...gameState };

    // Player 1 controls (WASD)
    newState = this.movePlayer(newState, 1, pressedKeys, currentTime, {
      up: 'KeyW',
      down: 'KeyS',
      left: 'KeyA',
      right: 'KeyD'
    });

    // Player 2 controls (IJKL)
    newState = this.movePlayer(newState, 2, pressedKeys, currentTime, {
      up: 'KeyI',
      down: 'KeyK',
      left: 'KeyJ',
      right: 'KeyL'
    });

    return newState;
  }

  private movePlayer(gameState: GameState, playerNum: 1 | 2, pressedKeys: Set<string>, currentTime: number, controls: { up: string, down: string, left: string, right: string }): GameState {
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    const heroType = playerNum === 1 ? gameState.player1HeroType : gameState.player2HeroType;
    const moveSpeed = heroType?.moveSpeed || GAME_CONFIG.PLAYER_MOVE_SPEED;

    if (currentTime - player.lastMoveTime < moveSpeed) {
      return gameState;
    }

    let newPosition = { ...player.position };
    let moved = false;

    if (pressedKeys.has(controls.up) && newPosition.y > 0) {
      newPosition.y--;
      moved = true;
    } else if (pressedKeys.has(controls.down) && newPosition.y < GRID_ROWS - 1) {
      newPosition.y++;
      moved = true;
    } else if (pressedKeys.has(controls.left) && newPosition.x > 0) {
      newPosition.x--;
      moved = true;
    } else if (pressedKeys.has(controls.right) && newPosition.x < GRID_COLS - 1) {
      newPosition.x++;
      moved = true;
    }

    if (!moved) return gameState;

    // Check for wall collisions
    const hasWallCollision = gameState.editorObjects.some(obj => 
      obj.type === 'wall' && obj.position.x === newPosition.x && obj.position.y === newPosition.y
    );

    if (hasWallCollision) return gameState;

    // Check for other player collision
    const otherPlayer = playerNum === 1 ? gameState.player2 : gameState.player1;
    if (checkCollision(newPosition, otherPlayer.position)) {
      return gameState;
    }

    const updatedPlayer = {
      ...player,
      position: newPosition,
      lastMoveTime: currentTime,
    };

    return {
      ...gameState,
      [playerNum === 1 ? 'player1' : 'player2']: updatedPlayer,
    };
  }

  handleShooting(gameState: GameState, playerNum: 1 | 2, direction: Position): GameState {
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    const heroType = playerNum === 1 ? gameState.player1HeroType : gameState.player2HeroType;
    
    if (!heroType) return gameState;

    const currentTime = Date.now();
    const shootCooldown = this.getPlayerShootCooldown(gameState, playerNum);
    
    if (currentTime - player.lastShootTime < shootCooldown) {
      return gameState;
    }

    const weaponType = heroType.weaponType;
    const projectile = this.createProjectileWithWeapon(
      player.position,
      direction,
      `player${playerNum}`,
      weaponType
    );
    
    const updatedPlayer = {
      ...player,
      lastShootTime: currentTime,
    };

    return {
      ...gameState,
      projectiles: [...gameState.projectiles, projectile],
      [playerNum === 1 ? 'player1' : 'player2']: updatedPlayer,
    };
  }

  private updateCaptives(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.captives = gameState.captives.map(captive => {
      // Update blink state
      if (currentTime - captive.lastBlinkTime >= GAME_CONFIG.CAPTIVE_BLINK_INTERVAL) {
        return {
          ...captive,
          blinkState: !captive.blinkState,
          lastBlinkTime: currentTime,
        };
      }
      return captive;
    });

    // Check for rescue by either player
    const rescuedCaptives: string[] = [];
    
    [gameState.player1, gameState.player2].forEach((player, playerIndex) => {
      newState.captives.forEach(captive => {
        const distance = calculateDistance(player.position, captive.position);
        if (distance <= captive.rescueRadius && !rescuedCaptives.includes(captive.id)) {
          rescuedCaptives.push(captive.id);
          
          // Add rescued character to active party
          const rescuedPlayer: Player = {
            position: { ...captive.position },
            lastMoveTime: 0,
            lastShootTime: 0,
            health: GAME_CONFIG.CAPTIVE_RESCUED_HEALTH,
            maxHealth: captive.originalHeroType.maxHealth,
            isHit: false,
            hitTime: 0,
          };
          
          newState.activePartyMembers.push(rescuedPlayer);
          newState.score += 500; // Bonus for rescue
        }
      });
    });

    // Remove rescued captives
    newState.captives = newState.captives.filter(captive => !rescuedCaptives.includes(captive.id));

    return newState;
  }

  private checkGameConditions(gameState: GameState): GameState {
    // Check if time is up
    if (gameState.timeRemaining <= 0) {
      return { ...gameState, gameStatus: 'gameOver' };
    }

    // Check if both players are captured (health <= 0)
    const player1Captured = gameState.player1.health <= 0;
    const player2Captured = gameState.player2.health <= 0;
    const allPartyMembersCaptured = gameState.activePartyMembers.every(member => member.health <= 0);

    if (player1Captured && player2Captured && allPartyMembersCaptured) {
      return { ...gameState, gameStatus: 'gameOver' };
    }

    // Check for victory conditions
    const allEnemiesDefeated = gameState.enemies.every(enemy => enemy.isDestroyed);
    const allCaptivesRescued = gameState.captives.length === 0;
    
    // Check if all active characters are at exit zones
    const allCharacters = [gameState.player1, gameState.player2, ...gameState.activePartyMembers]
      .filter(char => char.health > 0);
    
    const allAtExit = allCharacters.every(char => {
      return gameState.editorObjects.some(obj => 
        obj.type === 'exit' && 
        checkCollision(char.position, obj.position)
      );
    });

    if (allEnemiesDefeated && allCaptivesRescued && allAtExit && allCharacters.length > 0) {
      return { ...gameState, gameStatus: 'victory' };
    }

    if (allEnemiesDefeated) {
      return { ...gameState, gameStatus: 'levelComplete' };
    }

    return gameState;
  }

  getPlayerShootCooldown(gameState: GameState, playerNum?: 1 | 2): number {
    const heroType = playerNum === 1 ? gameState.player1HeroType : 
                     playerNum === 2 ? gameState.player2HeroType : 
                     gameState.selectedHeroType;
    
    if (!heroType) return GAME_CONFIG.SHOOT_COOLDOWN;

    const weaponConfig = WEAPON_CONFIGS[heroType.weaponType];
    let cooldown = weaponConfig.cooldown;

    // Apply rapid fire power-up
    const hasRapidFire = gameState.activePowerUps.some(powerUp => powerUp.type === 'rapidFire');
    if (hasRapidFire) {
      cooldown *= GAME_CONFIG.POWER_UP_SHOOT_MULTIPLIER;
    }

    return cooldown;
  }

  createProjectileWithWeapon(position: Position, direction: Position, ownerId: string, weaponType: WeaponType): Projectile {
    const weaponConfig = WEAPON_CONFIGS[weaponType];
    
    return {
      id: generateId(),
      position: { ...position },
      direction,
      speed: weaponConfig.speed,
      ownerId,
      color: weaponConfig.color,
      lastMoveTime: Date.now(),
      weaponType,
      damage: weaponConfig.damage,
      penetration: weaponConfig.penetration,
      areaEffect: weaponConfig.areaEffect,
      returning: weaponConfig.returning,
      continuous: weaponConfig.continuous,
      startPosition: weaponConfig.returning ? { ...position } : undefined,
      hasReturned: false,
      explosionRadius: weaponConfig.areaEffect ? 2 : undefined,
      flameLength: weaponConfig.continuous ? weaponConfig.range : undefined,
      penetratedEnemies: [],
      pierceWalls: weaponConfig.pierceWalls,
      melee: weaponConfig.melee,
      parabolic: weaponConfig.parabolic,
      multiShot: weaponConfig.multiShot,
      trajectory: weaponConfig.parabolic ? this.calculateParabolicTrajectory(position, direction, weaponConfig.range) : undefined,
      currentTrajectoryIndex: 0,
    };
  }

  private calculateParabolicTrajectory(start: Position, direction: Position, range: number): Position[] {
    const trajectory: Position[] = [];
    const steps = range;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(start.x + direction.x * range * t);
      const y = Math.round(start.y + direction.y * range * t - 4 * t * (1 - t) * 3); // Parabolic arc
      
      if (isValidPosition(x, y)) {
        trajectory.push({ x, y });
      }
    }
    
    return trajectory;
  }

  private updateProjectiles(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.projectiles = gameState.projectiles
      .map(projectile => {
        if (currentTime - projectile.lastMoveTime >= projectile.speed) {
          let newPosition: Position;
          
          if (projectile.parabolic && projectile.trajectory) {
            // Handle parabolic trajectory
            if (projectile.currentTrajectoryIndex! < projectile.trajectory.length - 1) {
              projectile.currentTrajectoryIndex!++;
              newPosition = projectile.trajectory[projectile.currentTrajectoryIndex!];
            } else {
              newPosition = projectile.position; // End of trajectory
            }
          } else {
            // Handle normal projectile movement
            newPosition = {
              x: projectile.position.x + projectile.direction.x,
              y: projectile.position.y + projectile.direction.y,
            };
          }
          
          return {
            ...projectile,
            position: newPosition,
            lastMoveTime: currentTime,
          };
        }
        return projectile;
      })
      .filter(projectile => {
        // Filter out projectiles that are out of bounds or expired
        if (projectile.pierceWalls) {
          return projectile.position.x >= 0 && projectile.position.x < GRID_COLS && 
                 projectile.position.y >= 0 && projectile.position.y < GRID_ROWS;
        }
        
        if (projectile.melee) {
          return currentTime - projectile.lastMoveTime < 200;
        }
        
        if (projectile.parabolic && projectile.trajectory) {
          return projectile.currentTrajectoryIndex! < projectile.trajectory.length;
        }
        
        return isValidPosition(projectile.position.x, projectile.position.y);
      });
    
    return newState;
  }

  private updateEnemies(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.enemies = gameState.enemies.map(enemy => {
      if (enemy.isDestroyed) return enemy;
      
      // Reset hit state
      if (enemy.isHit && currentTime - enemy.hitTime >= GAME_CONFIG.HIT_FLASH_DURATION) {
        enemy = { ...enemy, isHit: false };
      }
      
      // Enemy AI and movement logic would go here
      // For now, keeping basic patrol behavior
      
      return enemy;
    });
    
    return newState;
  }

  private checkCollisions(gameState: GameState): GameState {
    let newState = { ...gameState };
    
    // Check projectile collisions with players and enemies
    newState.projectiles = newState.projectiles.filter(projectile => {
      let shouldRemove = false;
      
      // Check collision with players
      [newState.player1, newState.player2].forEach((player, playerIndex) => {
        if (checkCollision(projectile.position, player.position) && 
            !projectile.ownerId.includes('player')) {
          // Enemy projectile hit player
          const updatedPlayer = {
            ...player,
            health: Math.max(0, player.health - projectile.damage),
            isHit: true,
            hitTime: Date.now(),
          };
          
          if (playerIndex === 0) {
            newState.player1 = updatedPlayer;
          } else {
            newState.player2 = updatedPlayer;
          }
          
          shouldRemove = true;
        }
      });
      
      // Check collision with enemies
      newState.enemies.forEach((enemy, enemyIndex) => {
        if (checkCollision(projectile.position, enemy.position) && 
            projectile.ownerId.includes('player') && !enemy.isDestroyed) {
          // Player projectile hit enemy
          const updatedEnemy = {
            ...enemy,
            health: Math.max(0, enemy.health - projectile.damage),
            isHit: true,
            hitTime: Date.now(),
          };
          
          if (updatedEnemy.health <= 0) {
            updatedEnemy.isDestroyed = true;
            updatedEnemy.destroyTime = Date.now();
            newState.score += 100;
          }
          
          newState.enemies[enemyIndex] = updatedEnemy;
          
          if (!projectile.penetration) {
            shouldRemove = true;
          }
        }
      });
      
      return !shouldRemove;
    });
    
    return newState;
  }

  private updateTimer(gameState: GameState, currentTime: number): GameState {
    if (gameState.editorMode) return gameState;
    
    const elapsed = Math.floor((currentTime - gameState.gameStartTime) / 1000);
    const timeRemaining = Math.max(0, gameState.timeLimit - elapsed);
    
    const newState = {
      ...gameState,
      timeRemaining,
      lastTimerUpdate: currentTime,
    };
    
    // Trigger alerts
    if (timeRemaining <= 60 && !gameState.timerAlerts.at60s) {
      newState.timerAlerts.at60s = true;
    }
    if (timeRemaining <= 30 && !gameState.timerAlerts.at30s) {
      newState.timerAlerts.at30s = true;
    }
    if (timeRemaining <= 10 && !gameState.timerAlerts.at10s) {
      newState.timerAlerts.at10s = true;
    }
    
    return newState;
  }

  private updateActivePowerUps(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.activePowerUps = gameState.activePowerUps.filter(powerUp => {
      return currentTime - powerUp.startTime < powerUp.duration;
    });
    
    return newState;
  }

  // Additional helper methods for editor and other functionality
  toggleEditorMode(gameState: GameState): GameState {
    return { ...gameState, editorMode: !gameState.editorMode };
  }

  setSelectedTool(gameState: GameState, tool: any): GameState {
    return { ...gameState, selectedTool: tool };
  }

  setSelectedEnemyType(gameState: GameState, enemyType: any): GameState {
    return { ...gameState, selectedEnemyType: enemyType };
  }

  handleEditorClick(gameState: GameState, position: Position, isRightClick: boolean): GameState {
    // Editor functionality implementation
    return gameState;
  }

  setHoveredObject(gameState: GameState, position: Position | null): GameState {
    return gameState;
  }

  testLevel(gameState: GameState): GameState {
    return { ...gameState, editorMode: false };
  }

  validateLevel(gameState: GameState): any {
    return {
      isValid: true,
      validationErrors: [],
      enemyCount: gameState.enemies.length,
      collectibleCount: gameState.collectibleHeroes.length,
      powerUpCount: gameState.powerUps.length,
      wallCount: 0,
      exitZoneCount: 0,
      hasPlayerStart: true,
      timeLimit: gameState.timeLimit,
    };
  }

  getSavedLevels(): string[] {
    return [];
  }

  updateEnemyFromConfig(gameState: GameState, config: any): GameState {
    return gameState;
  }

  placeEnemyFromConfig(gameState: GameState, config: any): GameState {
    return gameState;
  }

  closeEnemyConfigPanel(gameState: GameState): GameState {
    return { ...gameState, enemyConfigPanel: null };
  }

  setTimeLimit(gameState: GameState, timeLimit: number): GameState {
    return {
      ...gameState,
      timeLimit,
      timeRemaining: timeLimit,
      gameStartTime: Date.now(),
    };
  }

  deleteSelectedObject(gameState: GameState): GameState {
    return gameState;
  }

  resetTimer(gameState: GameState): GameState {
    return {
      ...gameState,
      gameStartTime: Date.now(),
      timeRemaining: gameState.timeLimit,
      timerAlerts: {
        at60s: false,
        at30s: false,
        at10s: false,
      },
    };
  }

  formatTime(seconds: number): string {
    if (seconds >= 9999) return '∞';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerColor(timeRemaining: number): string {
    if (timeRemaining <= GAME_CONFIG.TIMER_CRITICAL_THRESHOLD) return 'text-red-600';
    if (timeRemaining <= GAME_CONFIG.TIMER_WARNING_THRESHOLD) return 'text-yellow-600';
    return 'text-green-600';
  }

  shouldPulse(timeRemaining: number): boolean {
    return timeRemaining <= GAME_CONFIG.TIMER_FINAL_WARNING;
  }
}