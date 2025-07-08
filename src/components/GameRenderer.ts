import { GameState, Position, Enemy, Projectile } from '../types/GameTypes';
import { GAME_CONFIG, COLORS } from '../config/GameConfig';

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

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      if (!enemy.isDestroyed) {
        this.drawEnemy(enemy);
      } else {
        this.drawDestroyingEnemy(enemy);
      }
    });

    // Draw player
    this.drawPlayer(gameState.player);

    // Draw game over overlay if needed
    if (gameState.gameStatus === 'gameOver') {
      this.drawGameOverOverlay();
    } else if (gameState.gameStatus === 'victory') {
      this.drawVictoryOverlay();
    } else if (gameState.gameStatus === 'levelComplete') {
      this.drawLevelCompleteOverlay();
    }
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

    this.ctx.fillStyle = projectile.color;
    this.ctx.fillRect(pixelX, pixelY, 8, 8);

    // Add glow effect
    this.ctx.shadowColor = projectile.color;
    this.ctx.shadowBlur = 4;
    this.ctx.fillRect(pixelX, pixelY, 8, 8);
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
    this.ctx.fillText('Press R to Restart', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50);
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