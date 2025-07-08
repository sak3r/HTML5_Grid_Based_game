import { GameState, Position, Enemy, Projectile, CollectibleHero, PowerUp } from '../types/GameTypes';
import { GAME_CONFIG, COLORS } from '../config/GameConfig';
import { POWER_UP_TYPES } from '../config/GameConfig';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private gridCanvas: HTMLCanvasElement;
  private gridCtx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    
    // Create off-screen canvas for grid (performance optimization)
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.gridCanvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.gridCtx = this.gridCanvas.getContext('2d')!;
    
    this.preRenderGrid();
  }

  private preRenderGrid(): void {
    const ctx = this.gridCtx;
    
    // Background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Grid lines
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = COLORS.GRID_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }

  public render(gameState: GameState): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw pre-rendered grid
    this.ctx.drawImage(this.gridCanvas, 0, 0);

    // Draw editor grid overlay if in editor mode
    if (gameState.editorMode) {
      this.drawEditorGrid();
      this.drawEditorObjects(gameState);
      this.drawObjectHighlights(gameState);
    }

    // Draw patrol radii
    gameState.enemies.forEach(enemy => {
      if (!enemy.isDestroyed) {
        this.drawPatrolRadius(enemy);
      }
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      this.drawProjectile(projectile);
    });

    // Draw collectible heroes
    gameState.collectibleHeroes.forEach(collectible => {
      if (!collectible.collected) {
        this.drawCollectibleHero(collectible);
      }
    });

    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        this.drawPowerUp(powerUp);
      }
    });

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      if (!enemy.isDestroyed) {
        this.drawEnemy(enemy);
      } else {
        this.drawDestroyingEnemy(enemy);
      }
    });

    // Draw captives
    gameState.captives.forEach(captive => {
      this.drawCaptive(captive);
    });

    // Draw players
    const hasShield = gameState.activePowerUps.some(powerUp => powerUp.type === 'shield');
    this.drawPlayerWithHeroType(gameState.player1, gameState.player1HeroType, hasShield, 1);
    this.drawPlayerWithHeroType(gameState.player2, gameState.player2HeroType, hasShield, 2);

    // Draw active party members
    gameState.activePartyMembers.forEach((member, index) => {
      this.drawPartyMember(member, index);
    });

    // Draw game over overlay if needed
    if (gameState.gameStatus === 'gameOver') {
      this.drawGameOverOverlay();
    } else if (gameState.gameStatus === 'victory') {
      this.drawVictoryOverlay();
    } else if (gameState.gameStatus === 'levelComplete') {
      this.drawLevelCompleteOverlay();
    }
  }

  private drawEditorGrid(): void {
    this.ctx.strokeStyle = COLORS.EDITOR_GRID;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    // Vertical lines
    for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
  }

  private drawEditorObjects(gameState: GameState): void {
    gameState.editorObjects.forEach(obj => {
      switch (obj.type) {
        case 'enemy':
          this.drawEditorEnemy(obj);
          break;
        case 'wall':
          this.drawEditorWall(obj);
          break;
        case 'collectible':
          this.drawEditorCollectible(obj);
          break;
        case 'powerup':
          this.drawEditorPowerUp(obj);
          break;
        case 'playerStart':
          this.drawEditorPlayerStart(obj);
          break;
        case 'exit':
          this.drawEditorExit(obj);
          break;
      }
    });
  }

  private drawObjectHighlights(gameState: GameState): void {
    // Highlight selected object
    if (gameState.selectedObject) {
      this.drawObjectHighlight(gameState.selectedObject.position, '#3b82f6', 3);
    }
    
    // Highlight hovered object
    if (gameState.hoveredObject && gameState.hoveredObject !== gameState.selectedObject) {
      this.drawObjectHighlight(gameState.hoveredObject.position, '#10b981', 2);
    }
  }

  private drawObjectHighlight(position: Position, color: string, lineWidth: number): void {
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    this.ctx.setLineDash([]);
  }

  private drawEditorEnemy(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    
    // Draw patrol radius
    const centerX = pixelX + (GAME_CONFIG.GRID_SIZE / 2);
    const centerY = pixelY + (GAME_CONFIG.GRID_SIZE / 2);
    const radius = obj.config.patrolRadius * GAME_CONFIG.GRID_SIZE;
    
    this.ctx.fillStyle = `${obj.config.color}20`; // 20 = 12.5% opacity in hex
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    
    this.ctx.strokeStyle = `${obj.config.color}50`; // 50 = 31% opacity in hex
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Draw enemy
    this.ctx.fillStyle = obj.config.color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
    
    this.ctx.strokeStyle = obj.config.borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
    
    // Draw enemy type indicator
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      obj.config.enemyType.icon, 
      pixelX + GAME_CONFIG.GRID_SIZE / 2, 
      pixelY + GAME_CONFIG.GRID_SIZE / 2 + 4
    );
    
    // Draw direction indicator
    const dirX = pixelX + GAME_CONFIG.GRID_SIZE / 2 + (obj.config.startDirection.x * 8);
    const dirY = pixelY + GAME_CONFIG.GRID_SIZE / 2 + (obj.config.startDirection.y * 8);
    
    this.ctx.fillStyle = obj.config.borderColor;
    this.ctx.beginPath();
    this.ctx.arc(dirX, dirY, 3, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private drawEditorWall(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    
    this.ctx.fillStyle = COLORS.WALL;
    this.ctx.fillRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    
    this.ctx.strokeStyle = COLORS.WALL_BORDER;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
  }

  private drawEditorCollectible(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    const centerX = pixelX + GAME_CONFIG.GRID_SIZE / 2;
    const centerY = pixelY + GAME_CONFIG.GRID_SIZE / 2;
    const size = 12;
    
    // Diamond shape
    this.ctx.fillStyle = obj.config.heroType.color;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - size);
    this.ctx.lineTo(centerX + size, centerY);
    this.ctx.lineTo(centerX, centerY + size);
    this.ctx.lineTo(centerX - size, centerY);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.strokeStyle = obj.config.heroType.borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawEditorPowerUp(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    const centerX = pixelX + GAME_CONFIG.GRID_SIZE / 2;
    const centerY = pixelY + GAME_CONFIG.GRID_SIZE / 2;
    const size = 10;
    const powerUpConfig = POWER_UP_TYPES[obj.config.powerUpType];
    
    // Star shape
    this.ctx.fillStyle = powerUpConfig.color;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawEditorPlayerStart(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    
    // Player start marker
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
    
    this.ctx.strokeStyle = '#1e40af';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
    
    // Add "S" for start
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('S', pixelX + GAME_CONFIG.GRID_SIZE / 2, pixelY + GAME_CONFIG.GRID_SIZE / 2 + 6);
  }

  private drawEditorExit(obj: EditorObject): void {
    const pixelX = obj.position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = obj.position.y * GAME_CONFIG.GRID_SIZE;
    
    // Exit zone marker
    this.ctx.fillStyle = COLORS.EXIT_ZONE;
    this.ctx.fillRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    
    this.ctx.strokeStyle = COLORS.EXIT_ZONE_BORDER;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    
    // Add "E" for exit
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('E', pixelX + GAME_CONFIG.GRID_SIZE / 2, pixelY + GAME_CONFIG.GRID_SIZE / 2 + 6);
  }

  private drawPatrolRadius(enemy: Enemy): void {
    const centerX = (enemy.originalPosition.x * GAME_CONFIG.GRID_SIZE) + (GAME_CONFIG.GRID_SIZE / 2);
    const centerY = (enemy.originalPosition.y * GAME_CONFIG.GRID_SIZE) + (GAME_CONFIG.GRID_SIZE / 2);
    const radius = enemy.patrolRadius * GAME_CONFIG.GRID_SIZE;

    this.ctx.fillStyle = COLORS.PATROL_RADIUS;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.strokeStyle = COLORS.PATROL_BORDER;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawPlayer(player: Player): void {
    const position = player.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Determine color based on hit state
    const color = player.isHit ? COLORS.HIT_FLASH : COLORS.PLAYER;
    const borderColor = player.isHit ? COLORS.HIT_FLASH : COLORS.PLAYER_BORDER;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Character
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Player highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(pixelX + 4, pixelY + 4, GAME_CONFIG.GRID_SIZE - 12, 8);
  }

  private drawCollectibleHero(collectible: CollectibleHero): void {
    const position = collectible.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;
    const centerX = pixelX + GAME_CONFIG.GRID_SIZE / 2;
    const centerY = pixelY + GAME_CONFIG.GRID_SIZE / 2;
    const size = 12;

    // Glow effect
    this.ctx.shadowColor = collectible.heroType.color;
    this.ctx.shadowBlur = 8;

    // Diamond shape
    this.ctx.fillStyle = collectible.heroType.color;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - size);
    this.ctx.lineTo(centerX + size, centerY);
    this.ctx.lineTo(centerX, centerY + size);
    this.ctx.lineTo(centerX - size, centerY);
    this.ctx.closePath();
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = collectible.heroType.borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  private drawPowerUp(powerUp: PowerUp): void {
    const position = powerUp.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;
    const centerX = pixelX + GAME_CONFIG.GRID_SIZE / 2;
    const centerY = pixelY + GAME_CONFIG.GRID_SIZE / 2;
    const size = 10;
    const powerUpConfig = POWER_UP_TYPES[powerUp.type];

    // Glow effect
    this.ctx.shadowColor = powerUpConfig.color;
    this.ctx.shadowBlur = 6;

    // Star shape
    this.ctx.fillStyle = powerUpConfig.color;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  private drawCaptive(captive: Captive): void {
    const position = captive.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Draw rescue radius
    const centerX = pixelX + (GAME_CONFIG.GRID_SIZE / 2);
    const centerY = pixelY + (GAME_CONFIG.GRID_SIZE / 2);
    const radius = captive.rescueRadius * GAME_CONFIG.GRID_SIZE;

    this.ctx.fillStyle = COLORS.RESCUE_RADIUS;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.strokeStyle = COLORS.RESCUE_BORDER;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Only draw captive if blinking state is true
    if (captive.blinkState) {
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

      // Character with gray overlay
      this.ctx.fillStyle = captive.originalHeroType.color;
      this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

      // Gray overlay to show captive state
      this.ctx.fillStyle = COLORS.CAPTIVE_OVERLAY;
      this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

      // Border
      this.ctx.strokeStyle = COLORS.CAPTIVE_BORDER;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

      // Captive indicator (chain icon)
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⛓️', pixelX + GAME_CONFIG.GRID_SIZE / 2, pixelY + GAME_CONFIG.GRID_SIZE / 2 + 4);
    }
  }

  private drawPartyMember(member: Player, index: number): void {
    const position = member.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Determine color based on hit state and party member index
    const baseColor = HERO_TYPES[index % HERO_TYPES.length].color;
    const baseBorderColor = HERO_TYPES[index % HERO_TYPES.length].borderColor;
    const color = member.isHit ? COLORS.HIT_FLASH : baseColor;
    const borderColor = member.isHit ? COLORS.HIT_FLASH : baseBorderColor;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Character
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Party member indicator
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(pixelX + 4, pixelY + 4, GAME_CONFIG.GRID_SIZE - 12, 6);

    // Health indicator
    const healthRatio = member.health / member.maxHealth;
    const healthColor = healthRatio > 0.6 ? '#10b981' : healthRatio > 0.3 ? '#f59e0b' : '#ef4444';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(pixelX + 4, pixelY + GAME_CONFIG.GRID_SIZE - 8, (GAME_CONFIG.GRID_SIZE - 8) * healthRatio, 4);
  }

  private drawPlayerWithHeroType(player: Player, heroType: HeroType | null, hasShield: boolean = false, playerNum: number = 1): void {
    const position = player.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Determine color based on hit state
    const baseColor = heroType?.color || COLORS.PLAYER;
    const baseBorderColor = heroType?.borderColor || COLORS.PLAYER_BORDER;
    const color = player.isHit ? COLORS.HIT_FLASH : baseColor;
    const borderColor = player.isHit ? COLORS.HIT_FLASH : baseBorderColor;

    // Shield effect
    if (hasShield) {
      this.ctx.strokeStyle = playerNum === 1 ? '#60a5fa' : '#10b981';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.strokeRect(pixelX, pixelY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
      this.ctx.setLineDash([]);
    }

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Character
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Player highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(pixelX + 4, pixelY + 4, GAME_CONFIG.GRID_SIZE - 12, 8);
    
    // Player number indicator
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      playerNum.toString(), 
      pixelX + GAME_CONFIG.GRID_SIZE - 8, 
      pixelY + 12
    );
  }

  private drawEnemy(enemy: Enemy): void {
    const position = enemy.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Determine color based on hit state
    const color = enemy.isHit ? COLORS.HIT_FLASH : enemy.color;
    const borderColor = enemy.isHit ? COLORS.HIT_FLASH : enemy.borderColor;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Character
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
  }

  private drawDestroyingEnemy(enemy: Enemy): void {
    const currentTime = Date.now();
    const fadeProgress = Math.min(1, (currentTime - enemy.destroyTime) / GAME_CONFIG.DESTROY_FADE_DURATION);
    const alpha = 1 - fadeProgress;

    if (alpha <= 0) return;

    const position = enemy.position;
    const pixelX = position.x * GAME_CONFIG.GRID_SIZE;
    const pixelY = position.y * GAME_CONFIG.GRID_SIZE;

    // Save context for alpha manipulation
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Character (fading)
    this.ctx.fillStyle = enemy.color;
    this.ctx.fillRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Border (fading)
    this.ctx.strokeStyle = enemy.borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pixelX + 2, pixelY + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);

    // Restore context
    this.ctx.restore();
  }

  private drawProjectile(projectile: Projectile): void {
    const pixelX = (projectile.position.x * GAME_CONFIG.GRID_SIZE) + (GAME_CONFIG.GRID_SIZE / 2) - 4;
    const pixelY = (projectile.position.y * GAME_CONFIG.GRID_SIZE) + (GAME_CONFIG.GRID_SIZE / 2) - 4;

    // Draw different shapes based on weapon type
    switch (projectile.weaponType) {
      case 'rifle':
        this.drawRifleProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'spear':
        this.drawSpearProjectile(pixelX, pixelY, projectile.color, projectile.direction);
        break;
      case 'boomerang':
        this.drawBoomerangProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'grenade':
        this.drawGrenadeProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'flamethrower':
        this.drawFlameProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'sniper_rifle':
        this.drawSniperProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'throwing_star':
        this.drawThrowingStarProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'magic_bolt':
        this.drawMagicBoltProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'axe':
        this.drawAxeProjectile(pixelX, pixelY, projectile.color);
        break;
      case 'bow':
        this.drawBowProjectile(pixelX, pixelY, projectile.color);
        break;
      default:
        this.drawRifleProjectile(pixelX, pixelY, projectile.color);
    }
  }
  
  private drawRifleProjectile(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 8, 8);

    // Add glow effect
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 4;
    this.ctx.fillRect(x, y, 8, 8);
    this.ctx.shadowBlur = 0;
  }
  
  private drawSpearProjectile(x: number, y: number, color: string, direction: Position): void {
    this.ctx.fillStyle = color;
    
    // Draw elongated projectile based on direction
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      // Horizontal spear
      this.ctx.fillRect(x - 4, y + 2, 16, 4);
    } else {
      // Vertical spear
      this.ctx.fillRect(x + 2, y - 4, 4, 16);
    }
    
    // Add glow effect
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 6;
    this.ctx.fillStyle = color;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      this.ctx.fillRect(x - 4, y + 2, 16, 4);
    } else {
      this.ctx.fillRect(x + 2, y - 4, 4, 16);
    }
    this.ctx.shadowBlur = 0;
  }
  
  private drawBoomerangProjectile(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    
    // Draw curved boomerang shape
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 6, 0, Math.PI);
    this.ctx.arc(x + 4, y + 4, 6, Math.PI, 2 * Math.PI);
    this.ctx.fill();
    
    // Add glow effect
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 5;
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }
  
  private drawGrenadeProjectile(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    
    // Draw round grenade
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Add fuse effect
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, y - 2);
    this.ctx.lineTo(x + 4, y + 2);
    this.ctx.stroke();
    
    // Add glow effect
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }
  
  private drawFlameProjectile(x: number, y: number, color: string): void {
    // Draw flame particle
    const flameColors = ['#ff4500', '#ff6500', '#ff8500', '#ffa500'];
    const randomColor = flameColors[Math.floor(Math.random() * flameColors.length)];
    
    this.ctx.fillStyle = randomColor;
    
    // Draw irregular flame shape
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 4 + Math.random() * 3, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Add intense glow effect
    this.ctx.shadowColor = randomColor;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(x + 4, y + 4, 3, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private drawGameOverOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);

    this.ctx.font = '24px Arial';
    this.ctx.fillText('All Characters Captured!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 40);
    this.ctx.fillText('Press R to Restart', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 70);
  }

  private drawVictoryOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VICTORY!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);

    this.ctx.font = '24px Arial';
    this.ctx.fillText('Press R to Play Again', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50);
  }

  private drawLevelCompleteOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL COMPLETE!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);

    this.ctx.font = '24px Arial';
    this.ctx.fillText('All Enemies Defeated!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 40);
    this.ctx.fillText('Press R for Next Level', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 70);
  }
}