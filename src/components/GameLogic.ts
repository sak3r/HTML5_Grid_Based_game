import { GameState, Position, Projectile, Enemy } from '../types/GameTypes';
import { GAME_CONFIG, COLORS, ENEMY_CONFIGS, COLLECTIBLE_HERO_CONFIGS, POWER_UP_CONFIGS, POWER_UP_TYPES } from '../config/GameConfig';
import { 
  calculateDistance, 
  isValidPosition, 
  moveTowardsTarget, 
  isInLineOfSight, 
  getDirectionToTarget, 
  checkCollision, 
  generateId 
} from '../utils/GameUtils';

export class GameLogic {
  public createInitialGameState(heroType?: HeroType): GameState {
    const selectedHero = heroType || null;
    
    return {
      player: {
        position: { x: 12, y: 17 },
        lastMoveTime: 0,
        lastShootTime: 0,
        health: selectedHero?.maxHealth || GAME_CONFIG.PLAYER_MAX_HEALTH,
        maxHealth: selectedHero?.maxHealth || GAME_CONFIG.PLAYER_MAX_HEALTH,
        isHit: false,
        hitTime: 0,
      },
      enemies: ENEMY_CONFIGS.map(config => ({
        ...config,
        originalPosition: { ...config.position },
        isChasing: false,
        lastMoveTime: 0,
        lastShootTime: 0,
        canShoot: true,
        isHit: false,
        hitTime: 0,
        isDestroyed: false,
        destroyTime: 0,
      })),
      collectibleHeroes: COLLECTIBLE_HERO_CONFIGS.map(config => ({
        ...config,
        collected: false,
      })),
      powerUps: POWER_UP_CONFIGS.map(config => ({
        ...config,
        collected: false,
      })),
      partyHeroes: [],
      activePowerUps: [],
      projectiles: [],
      gameStatus: 'playing',
      score: 0,
      level: 1,
      selectedHeroType: selectedHero,
      editorMode: false,
      selectedTool: 'enemy',
      editorObjects: [],
      selectedObject: null,
      hoveredObject: null,
      isDragging: false,
      dragStart: null,
    };
  }

  public createEditorGameState(heroType?: HeroType): GameState {
    const baseState = this.createInitialGameState(heroType);
    return {
      ...baseState,
      editorMode: true,
      gameStatus: 'paused',
      enemies: [],
      collectibleHeroes: [],
      powerUps: [],
      editorObjects: [],
      selectedObject: null,
      hoveredObject: null,
      isDragging: false,
      dragStart: null,
    };
  }

  public updateGame(gameState: GameState, pressedKeys: Set<string>, deltaTime: number): GameState {
    if (gameState.gameStatus !== 'playing' || gameState.editorMode) {
      return gameState;
    }

    const currentTime = Date.now();
    let newState = { ...gameState };

    // Update player
    newState = this.updatePlayer(newState, pressedKeys, currentTime);

    // Update enemies
    newState = this.updateEnemies(newState, currentTime);

    // Update projectiles
    newState = this.updateProjectiles(newState, currentTime);

    // Update power-ups
    newState = this.updatePowerUps(newState, currentTime);

    // Check collisions
    newState = this.checkCollisions(newState);

    // Check win condition (all party members reached top)
    const allPartyMembersAtExit = this.checkAllPartyMembersAtExit(newState);
    if (allPartyMembersAtExit) {
      newState.gameStatus = 'victory';
    }

    // Check level complete condition (all enemies destroyed)
    if (newState.enemies.length === 0 && newState.gameStatus === 'playing') {
      newState.gameStatus = 'levelComplete';
    }

    // Update hit states
    newState = this.updateHitStates(newState, currentTime);

    return newState;
  }

  private updatePlayer(gameState: GameState, pressedKeys: Set<string>, currentTime: number): GameState {
    const newState = { ...gameState };
    const heroType = gameState.selectedHeroType;
    
    // Apply speed boost if active
    const hasSpeedBoost = gameState.activePowerUps.some(powerUp => powerUp.type === 'speedBoost');
    const baseMoveSpeed = heroType?.moveSpeed || GAME_CONFIG.PLAYER_MOVE_SPEED;
    const moveSpeed = hasSpeedBoost ? baseMoveSpeed * GAME_CONFIG.POWER_UP_SPEED_MULTIPLIER : baseMoveSpeed;
    
    // Handle movement
    let deltaX = 0;
    let deltaY = 0;
    
    if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) deltaY -= 1;
    if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) deltaY += 1;
    if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) deltaX -= 1;
    if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) deltaX += 1;

    // Apply movement
    if (currentTime - gameState.player.lastMoveTime >= moveSpeed && (deltaX !== 0 || deltaY !== 0)) {
      const newX = gameState.player.position.x + Math.sign(deltaX);
      const newY = gameState.player.position.y + Math.sign(deltaY);
      
      if (isValidPosition(newX, newY, true)) {
        newState.player = {
          ...newState.player,
          position: { x: newX, y: newY },
          lastMoveTime: currentTime,
        };
      }
    }

    return newState;
  }

  private updateEnemies(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.enemies = gameState.enemies.map(enemy => {
      const distanceToPlayer = calculateDistance(enemy.originalPosition, gameState.player.position);
      const shouldChase = distanceToPlayer <= enemy.patrolRadius;
      
      let newEnemy = { ...enemy };
      
      // Update position
      if (currentTime - enemy.lastMoveTime >= GAME_CONFIG.ENEMY_MOVE_SPEED) {
        let newPosition = enemy.position;
        
        if (shouldChase) {
          newPosition = moveTowardsTarget(enemy.position, gameState.player.position);
        } else if (enemy.isChasing) {
          if (enemy.position.x !== enemy.originalPosition.x || enemy.position.y !== enemy.originalPosition.y) {
            newPosition = moveTowardsTarget(enemy.position, enemy.originalPosition);
          }
        }
        
        const moved = newPosition.x !== enemy.position.x || newPosition.y !== enemy.position.y;
        
        newEnemy = {
          ...newEnemy,
          position: newPosition,
          isChasing: shouldChase,
          lastMoveTime: moved ? currentTime : enemy.lastMoveTime,
        };
      }
      
      // Handle shooting
      if (shouldChase && 
          isInLineOfSight(newEnemy.position, gameState.player.position) &&
          currentTime - enemy.lastShootTime >= GAME_CONFIG.SHOOT_COOLDOWN) {
        
        const direction = getDirectionToTarget(newEnemy.position, gameState.player.position);
        const projectile: Projectile = {
          id: generateId(),
          position: { ...newEnemy.position },
          direction,
          speed: GAME_CONFIG.PROJECTILE_SPEED,
          ownerId: enemy.id,
          color: COLORS.ENEMY_PROJECTILE,
          lastMoveTime: currentTime,
        };
        
        newState.projectiles.push(projectile);
        newEnemy.lastShootTime = currentTime;
      }
      
      return newEnemy;
    });
    
    return newState;
  }

  private updateProjectiles(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.projectiles = gameState.projectiles
      .map(projectile => {
        if (currentTime - projectile.lastMoveTime >= projectile.speed) {
          const newPosition = {
            x: projectile.position.x + projectile.direction.x,
            y: projectile.position.y + projectile.direction.y,
          };
          
          return {
            ...projectile,
            position: newPosition,
            lastMoveTime: currentTime,
          };
        }
        return projectile;
      })
      .filter(projectile => isValidPosition(projectile.position.x, projectile.position.y));
    
    return newState;
  }

  private updatePowerUps(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    // Remove expired power-ups
    newState.activePowerUps = gameState.activePowerUps.filter(powerUp => 
      currentTime - powerUp.startTime < powerUp.duration
    );
    
    return newState;
  }

  private checkAllPartyMembersAtExit(gameState: GameState): boolean {
    // Player must be at exit
    if (gameState.player.position.y !== -1) {
      return false;
    }
    
    // If no party members, just player needs to reach exit
    if (gameState.partyHeroes.length === 0) {
      return true;
    }
    
    // For now, we'll consider all party members "follow" the player
    // In a more complex implementation, each party member would have their own position
    return true;
  }

  private updateHitStates(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    // Update player hit state
    if (newState.player.isHit && currentTime - newState.player.hitTime >= GAME_CONFIG.HIT_FLASH_DURATION) {
      newState.player = {
        ...newState.player,
        isHit: false,
      };
    }
    
    // Update enemy hit states and remove destroyed enemies
    newState.enemies = gameState.enemies
      .map(enemy => {
        let newEnemy = { ...enemy };
        
        // Update hit flash
        if (enemy.isHit && currentTime - enemy.hitTime >= GAME_CONFIG.HIT_FLASH_DURATION) {
          newEnemy.isHit = false;
        }
        
        return newEnemy;
      })
      .filter(enemy => {
        // Remove enemies that have finished their destroy animation
        if (enemy.isDestroyed) {
          return currentTime - enemy.destroyTime < GAME_CONFIG.DESTROY_FADE_DURATION;
        }
        return true;
      });
    
    return newState;
  }

  private checkCollisions(gameState: GameState): GameState {
    const newState = { ...gameState };
    const currentTime = Date.now();
    
    // Check collectible hero collisions
    newState.collectibleHeroes = gameState.collectibleHeroes.map(collectible => {
      if (!collectible.collected && checkCollision(collectible.position, gameState.player.position)) {
        newState.partyHeroes = [...newState.partyHeroes, collectible.heroType];
        newState.score += 200;
        return { ...collectible, collected: true };
      }
      return collectible;
    });
    
    // Check power-up collisions
    newState.powerUps = gameState.powerUps.map(powerUp => {
      if (!powerUp.collected && checkCollision(powerUp.position, gameState.player.position)) {
        const powerUpConfig = POWER_UP_TYPES[powerUp.type];
        
        // Remove existing power-up of same type
        newState.activePowerUps = newState.activePowerUps.filter(active => active.type !== powerUp.type);
        
        // Add new power-up
        newState.activePowerUps.push({
          type: powerUp.type,
          startTime: currentTime,
          duration: powerUpConfig.duration,
        });
        
        newState.score += 150;
        return { ...powerUp, collected: true };
      }
      return powerUp;
    });
    
    // Check projectile-player collisions
    const hasShield = gameState.activePowerUps.some(powerUp => powerUp.type === 'shield');
    const playerHitProjectiles = gameState.projectiles.filter(projectile => 
      projectile.ownerId !== 'player' &&
      !hasShield &&
      checkCollision(projectile.position, gameState.player.position)
    );
    
    if (playerHitProjectiles.length > 0) {
      newState.player = {
        ...newState.player,
        health: Math.max(0, newState.player.health - playerHitProjectiles.length),
        isHit: true,
        hitTime: currentTime,
      };
      
      // Remove projectiles that hit the player
      newState.projectiles = gameState.projectiles.filter(projectile => 
        !playerHitProjectiles.includes(projectile)
      );
      
      // Check if player is dead
      if (newState.player.health <= 0) {
        newState.gameStatus = 'gameOver';
        return newState;
      }
    }
    
    // Check projectile-enemy collisions and damage enemies
    const projectilesToRemove: Projectile[] = [];
    
    newState.enemies = gameState.enemies.map(enemy => {
      const hitProjectiles = gameState.projectiles.filter(projectile => 
        projectile.ownerId === 'player' && 
        checkCollision(projectile.position, enemy.position) &&
        !enemy.isDestroyed
      );
      
      if (hitProjectiles.length > 0 && !enemy.isDestroyed) {
        projectilesToRemove.push(...hitProjectiles);
        
        const newHealth = Math.max(0, enemy.health - hitProjectiles.length);
        
        if (newHealth <= 0) {
          // Enemy destroyed
          newState.score += 100;
          return {
            ...enemy,
            health: 0,
            isDestroyed: true,
            destroyTime: currentTime,
            isHit: true,
            hitTime: currentTime,
          };
        } else {
          // Enemy damaged but not destroyed
          return {
            ...enemy,
            health: newHealth,
            isHit: true,
            hitTime: currentTime,
          };
        }
      }
      
      return enemy;
    });
    
    // Remove projectiles that hit enemies
    newState.projectiles = gameState.projectiles.filter(projectile => 
      !projectilesToRemove.includes(projectile)
    );
    
    // Check player-enemy collisions
    const collidingEnemies = gameState.enemies.filter(enemy => 
      checkCollision(enemy.position, gameState.player.position) && !enemy.isDestroyed
    );
    
    if (collidingEnemies.length > 0) {
      newState.player = {
        ...newState.player,
        health: Math.max(0, newState.player.health - collidingEnemies.length),
        isHit: true,
        hitTime: currentTime,
      };
      
      if (newState.player.health <= 0) {
        newState.gameStatus = 'gameOver';
      }
    }
    
    return newState;
  }

  public createProjectile(position: Position, direction: Position, ownerId: string): Projectile {
    return {
      id: generateId(),
      position: { ...position },
      direction,
      speed: GAME_CONFIG.PROJECTILE_SPEED,
      ownerId,
      color: ownerId === 'player' ? COLORS.PLAYER_PROJECTILE : COLORS.ENEMY_PROJECTILE,
      lastMoveTime: Date.now(),
    };
  }

  public getPlayerShootCooldown(gameState: GameState): number {
    const hasRapidFire = gameState.activePowerUps.some(powerUp => powerUp.type === 'rapidFire');
    const baseCooldown = gameState.selectedHeroType?.shootCooldown || GAME_CONFIG.SHOOT_COOLDOWN;
    return hasRapidFire ? baseCooldown * GAME_CONFIG.POWER_UP_SHOOT_MULTIPLIER : baseCooldown;
  }

  public toggleEditorMode(gameState: GameState): GameState {
    const newState = {
      ...gameState,
      editorMode: !gameState.editorMode,
      gameStatus: gameState.editorMode ? 'playing' : 'paused',
      selectedObject: null,
      hoveredObject: null,
      isDragging: false,
      dragStart: null,
    };
    
    // When exiting editor mode, apply editor objects to game state
    if (gameState.editorMode) {
      return this.applyEditorObjectsToGameState(newState);
    }
    
    return newState;
  }

  public setSelectedTool(gameState: GameState, tool: EditorTool): GameState {
    return {
      ...gameState,
      selectedTool: tool,
      selectedObject: null,
    };
  }

  public handleEditorClick(gameState: GameState, gridPosition: Position, isRightClick: boolean = false): GameState {
    if (!gameState.editorMode) return gameState;

    const newState = { ...gameState };
    
    // Check if clicking on existing object
    const clickedObject = gameState.editorObjects.find(obj => 
      obj.position.x === gridPosition.x && obj.position.y === gridPosition.y
    );
    
    if (isRightClick) {
      if (clickedObject) {
        // Right-click on object: configure or delete
        if (clickedObject.type === 'enemy') {
          return this.configureEnemyObject(newState, clickedObject);
        } else {
          // Delete object
          return this.deleteEditorObject(newState, clickedObject.id);
        }
      }
      return newState;
    }
    
    if (clickedObject) {
      // Left-click on existing object: select it
      newState.selectedObject = clickedObject;
      return newState;
    }
    
    // Place new object
    return this.placeEditorObject(newState, gridPosition);
  }
  
  private placeEditorObject(gameState: GameState, position: Position): GameState {
    const newState = { ...gameState };
    const objectId = generateId();

    switch (gameState.selectedTool) {
      case 'enemy':
        const enemyObject: EditorObject = {
          id: objectId,
          type: 'enemy',
          position: { ...position },
          config: {
            patrolRadius: 3,
            color: '#ef4444',
            borderColor: '#dc2626',
            health: GAME_CONFIG.ENEMY_MAX_HEALTH,
          } as EnemyConfig,
        };
        newState.editorObjects = [...gameState.editorObjects, enemyObject];
        break;

      case 'wall':
        const wallObject: EditorObject = {
          id: objectId,
          type: 'wall',
          position: { ...position },
          config: {
            isConnected: false,
            connections: [],
          } as WallConfig,
        };
        newState.editorObjects = [...gameState.editorObjects, wallObject];
        break;

      case 'collectible':
        const collectibleObject: EditorObject = {
          id: objectId,
          type: 'collectible',
          position: { ...position },
          config: {
            heroType: HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)],
          },
        };
        newState.editorObjects = [...gameState.editorObjects, collectibleObject];
        break;

      case 'powerup':
        const powerUpTypes = ['speedBoost', 'rapidFire', 'shield'] as const;
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUpObject: EditorObject = {
          id: objectId,
          type: 'powerup',
          position: { ...position },
          config: {
            powerUpType: randomType,
          },
        };
        newState.editorObjects = [...gameState.editorObjects, powerUpObject];
        break;

      case 'playerStart':
        // Remove existing player start
        newState.editorObjects = gameState.editorObjects.filter(obj => obj.type !== 'playerStart');
        
        const playerStartObject: EditorObject = {
          id: objectId,
          type: 'playerStart',
          position: { ...position },
          config: {},
        };
        newState.editorObjects = [...newState.editorObjects, playerStartObject];
        break;

      case 'exit':
        const exitObject: EditorObject = {
          id: objectId,
          type: 'exit',
          position: { ...position },
          config: {
            width: 1,
            height: 1,
          } as ExitZoneConfig,
        };
        newState.editorObjects = [...gameState.editorObjects, exitObject];
        break;

      default:
        break;
    }
    
    return newState;
  }
  
  private deleteEditorObject(gameState: GameState, objectId: string): GameState {
    return {
      ...gameState,
      editorObjects: gameState.editorObjects.filter(obj => obj.id !== objectId),
      selectedObject: gameState.selectedObject?.id === objectId ? null : gameState.selectedObject,
    };
  }
  
  private configureEnemyObject(gameState: GameState, enemyObject: EditorObject): GameState {
    const newRadius = prompt('Enter patrol radius (1-8):', enemyObject.config.patrolRadius.toString());
    if (newRadius && !isNaN(parseInt(newRadius))) {
      const radius = Math.max(1, Math.min(8, parseInt(newRadius)));
      
      const updatedObjects = gameState.editorObjects.map(obj => 
        obj.id === enemyObject.id 
          ? { ...obj, config: { ...obj.config, patrolRadius: radius } }
          : obj
      );
      
      return {
        ...gameState,
        editorObjects: updatedObjects,
      };
    }
    
    return gameState;
  }
  
  public setHoveredObject(gameState: GameState, position: Position | null): GameState {
    if (!position) {
      return { ...gameState, hoveredObject: null };
    }
    
    const hoveredObject = gameState.editorObjects.find(obj => 
      obj.position.x === position.x && obj.position.y === position.y
    );
    
    return {
      ...gameState,
      hoveredObject: hoveredObject || null,
    };
  }
  
  public deleteSelectedObject(gameState: GameState): GameState {
    if (!gameState.selectedObject) return gameState;
    
    return this.deleteEditorObject(gameState, gameState.selectedObject.id);
  }
  
  private applyEditorObjectsToGameState(gameState: GameState): GameState {
    const newState = { ...gameState };
    
    // Clear existing objects
    newState.enemies = [];
    newState.collectibleHeroes = [];
    newState.powerUps = [];
    
    // Apply editor objects to game state
    gameState.editorObjects.forEach(obj => {
      switch (obj.type) {
        case 'enemy':
          const enemy = {
            id: obj.id,
            position: { ...obj.position },
            originalPosition: { ...obj.position },
            patrolRadius: obj.config.patrolRadius,
            color: obj.config.color,
            borderColor: obj.config.borderColor,
            health: obj.config.health,
            maxHealth: obj.config.health,
            isChasing: false,
            lastMoveTime: 0,
            lastShootTime: 0,
            canShoot: true,
            isHit: false,
            hitTime: 0,
            isDestroyed: false,
            destroyTime: 0,
          };
          newState.enemies.push(enemy);
          break;
          
        case 'collectible':
          const collectible = {
            id: obj.id,
            position: { ...obj.position },
            heroType: obj.config.heroType,
            collected: false,
          };
          newState.collectibleHeroes.push(collectible);
          break;
          
        case 'powerup':
          const powerUp = {
            id: obj.id,
            position: { ...obj.position },
            type: obj.config.powerUpType,
            collected: false,
          };
          newState.powerUps.push(powerUp);
          break;
          
        case 'playerStart':
          newState.player = {
            ...newState.player,
            position: { ...obj.position },
          };
          break;
      }
    });
    
    return newState;
  }

  public testLevel(gameState: GameState): GameState {
    const newState = {
      ...gameState,
      editorMode: false,
      gameStatus: 'playing',
      selectedObject: null,
      hoveredObject: null,
    };
    
    return this.applyEditorObjectsToGameState(newState);
  }
}