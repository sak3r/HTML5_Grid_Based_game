import { GameState, Position, Projectile, Enemy } from '../types/GameTypes';
import { GAME_CONFIG, COLORS, ENEMY_CONFIGS } from '../config/GameConfig';
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
      projectiles: [],
      gameStatus: 'playing',
      score: 0,
      level: 1,
      selectedHeroType: selectedHero,
    };
  }

  public updateGame(gameState: GameState, pressedKeys: Set<string>, deltaTime: number): GameState {
    if (gameState.gameStatus !== 'playing') {
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

    // Check collisions
    newState = this.checkCollisions(newState);

    // Check win condition (player reached top)
    if (newState.player.position.y === -1) {
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
    const moveSpeed = heroType?.moveSpeed || GAME_CONFIG.PLAYER_MOVE_SPEED;
    
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
    
    // Check projectile-player collisions
    const playerHitProjectiles = gameState.projectiles.filter(projectile => 
      projectile.ownerId !== 'player' && 
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
    return gameState.selectedHeroType?.shootCooldown || GAME_CONFIG.SHOOT_COOLDOWN;
  }
}