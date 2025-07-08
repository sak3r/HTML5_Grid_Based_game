import { GameState, Position, HeroType } from '../types/GameTypes';
import { Grid } from './Grid';
import { Player } from './Player';
import { InputHandler, InputCommand } from './InputHandler';
import { GameRenderer } from './GameRenderer';
import { GAME_CONFIG } from '../config/GameConfig';

export interface GameEngineConfig {
  targetFrameRate: number;
  enableDebugMode: boolean;
  maxDeltaTime: number;
}

export interface GameLoopStats {
  currentFrameRate: number;
  averageFrameTime: number;
  totalFrames: number;
  lastUpdateTime: number;
}

/**
 * GameEngine orchestrates the overall game flow, state management, and updates
 */
export class GameEngine {
  private gameGrid: Grid;
  private players: Map<string, Player>;
  private inputHandler: InputHandler;
  private gameRenderer: GameRenderer | null;
  private gameState: GameState | null;
  
  private isRunning: boolean;
  private isPaused: boolean;
  private animationFrameId: number | null;
  private lastFrameTimestamp: number;
  
  private readonly engineConfig: GameEngineConfig;
  private gameLoopStats: GameLoopStats;

  constructor(config?: Partial<GameEngineConfig>) {
    this.engineConfig = {
      targetFrameRate: 60,
      enableDebugMode: false,
      maxDeltaTime: 50, // Maximum delta time in ms to prevent large jumps
      ...config
    };

    // Initialize core systems
    this.gameGrid = new Grid();
    this.players = new Map();
    this.inputHandler = new InputHandler();
    this.gameRenderer = null;
    this.gameState = null;

    // Game loop state
    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastFrameTimestamp = 0;

    // Performance tracking
    this.gameLoopStats = {
      currentFrameRate: 0,
      averageFrameTime: 0,
      totalFrames: 0,
      lastUpdateTime: 0
    };

    // Setup default input controls
    this.inputHandler.setupDefaultControls();
  }

  /**
   * Initialize the game engine with canvas context
   */
  public initialize(canvasContext: CanvasRenderingContext2D): void {
    try {
      this.gameRenderer = new GameRenderer(canvasContext);
      this.inputHandler.startListening();
      
      if (this.engineConfig.enableDebugMode) {
        console.log('GameEngine initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize GameEngine:', error);
      throw new Error('GameEngine initialization failed');
    }
  }

  /**
   * Create a new game with specified parameters
   */
  public createNewGame(
    player1HeroType: HeroType,
    player2HeroType: HeroType,
    gameMode: 'cooperative' | 'turnBased' = 'cooperative'
  ): void {
    try {
      // Reset grid
      this.gameGrid.reset();

      // Create players
      this.createPlayers(player1HeroType, player2HeroType);

      // Initialize game state
      this.gameState = this.createInitialGameState(gameMode);

      // Update grid with player positions
      this.updateGridWithPlayers();

      if (this.engineConfig.enableDebugMode) {
        console.log('New game created:', { gameMode, player1HeroType, player2HeroType });
      }
    } catch (error) {
      console.error('Failed to create new game:', error);
      throw new Error('Game creation failed');
    }
  }

  /**
   * Start the game loop
   */
  public startGameLoop(): void {
    if (this.isRunning) {
      console.warn('Game loop is already running');
      return;
    }

    if (!this.gameState || !this.gameRenderer) {
      throw new Error('Game must be initialized before starting');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTimestamp = performance.now();
    this.gameLoopStats.totalFrames = 0;

    this.gameLoop(this.lastFrameTimestamp);

    if (this.engineConfig.enableDebugMode) {
      console.log('Game loop started');
    }
  }

  /**
   * Stop the game loop
   */
  public stopGameLoop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.engineConfig.enableDebugMode) {
      console.log('Game loop stopped');
    }
  }

  /**
   * Pause/unpause the game
   */
  public togglePause(): void {
    this.isPaused = !this.isPaused;
    
    if (this.engineConfig.enableDebugMode) {
      console.log(`Game ${this.isPaused ? 'paused' : 'unpaused'}`);
    }
  }

  /**
   * Main game loop
   */
  private gameLoop(currentTimestamp: number): void {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time
    const deltaTime = Math.min(
      currentTimestamp - this.lastFrameTimestamp,
      this.engineConfig.maxDeltaTime
    );

    // Update performance stats
    this.updatePerformanceStats(deltaTime);

    // Process game update if not paused
    if (!this.isPaused && this.gameState) {
      try {
        // Process input
        this.processInput(currentTimestamp);

        // Update game state
        this.updateGameState(deltaTime, currentTimestamp);

        // Render frame
        if (this.gameRenderer) {
          this.gameRenderer.render(this.gameState);
        }
      } catch (error) {
        console.error('Error in game loop:', error);
        this.stopGameLoop();
        return;
      }
    }

    // Store timestamp for next frame
    this.lastFrameTimestamp = currentTimestamp;

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  /**
   * Process player input
   */
  private processInput(currentTimestamp: number): void {
    const inputCommands = this.inputHandler.getInputCommands();

    for (const command of inputCommands) {
      this.executeInputCommand(command, currentTimestamp);
    }

    // Also check for continuous movement
    this.processContinuousMovement(currentTimestamp);
  }

  /**
   * Execute a single input command
   */
  private executeInputCommand(command: InputCommand, currentTimestamp: number): void {
    const player = this.players.get(command.playerId);
    if (!player || !this.gameState) {
      return;
    }

    switch (command.type) {
      case 'move':
        if (command.direction) {
          this.handlePlayerMovement(player, command.direction, currentTimestamp);
        }
        break;

      case 'shoot':
        if (command.direction) {
          this.handlePlayerShooting(player, command.direction, currentTimestamp);
        }
        break;

      case 'action':
        // Handle special actions (interact, use item, etc.)
        break;
    }
  }

  /**
   * Process continuous movement for held keys
   */
  private processContinuousMovement(currentTimestamp: number): void {
    for (const [playerId, player] of this.players) {
      const movementDirection = this.inputHandler.getMovementDirection(playerId);
      
      if (movementDirection && player.canPerformAction('move', currentTimestamp)) {
        this.handlePlayerMovement(player, movementDirection, currentTimestamp);
      }
    }
  }

  /**
   * Handle player movement
   */
  private handlePlayerMovement(
    player: Player, 
    direction: Position, 
    currentTimestamp: number
  ): void {
    const currentPosition = player.getState().currentPosition;
    const targetPosition = {
      x: currentPosition.x + direction.x,
      y: currentPosition.y + direction.y
    };

    // Validate movement
    const isValidMovement = (position: Position): boolean => {
      // Check grid bounds
      if (!this.gameGrid.isValidPosition(position)) {
        return false;
      }

      // Check for walls
      if (!this.gameGrid.isCellWalkable(position)) {
        return false;
      }

      // Check for other players
      for (const [otherPlayerId, otherPlayer] of this.players) {
        if (otherPlayerId !== player.getPlayerId() && 
            otherPlayer.isAtPosition(position)) {
          return false;
        }
      }

      return true;
    };

    const movementResult = player.attemptMovement(
      targetPosition, 
      currentTimestamp, 
      isValidMovement
    );

    if (movementResult.success) {
      // Update grid
      this.gameGrid.clearCellOccupancy(currentPosition);
      this.gameGrid.setCellOccupancy(targetPosition, 'player', player.getPlayerId());

      // Check for interactions (collectibles, power-ups, etc.)
      this.checkPlayerInteractions(player, targetPosition);
    }
  }

  /**
   * Handle player shooting
   */
  private handlePlayerShooting(
    player: Player, 
    direction: Position, 
    currentTimestamp: number
  ): void {
    const shootingResult = player.attemptShooting(direction, currentTimestamp);

    if (shootingResult.success && shootingResult.projectileId && this.gameState) {
      // Create projectile in game state
      // This would integrate with the existing projectile system
      console.log(`Player ${player.getPlayerId()} shot in direction:`, direction);
    }
  }

  /**
   * Check for player interactions at position
   */
  private checkPlayerInteractions(player: Player, position: Position): void {
    // Check for collectibles, power-ups, captives, etc.
    // This would integrate with the existing game systems
  }

  /**
   * Update game state
   */
  private updateGameState(deltaTime: number, currentTimestamp: number): void {
    if (!this.gameState) {
      return;
    }

    // Update player hit flash states
    for (const player of this.players.values()) {
      player.updateHitFlash(currentTimestamp);
    }

    // Update other game systems (enemies, projectiles, etc.)
    // This would integrate with existing game logic
  }

  /**
   * Create players
   */
  private createPlayers(player1HeroType: HeroType, player2HeroType: HeroType): void {
    // Clear existing players
    this.players.clear();

    // Create player 1
    const player1StartPosition = { x: 1, y: 17 }; // Bottom-left area
    const player1 = new Player('player1', player1StartPosition, player1HeroType);
    this.players.set('player1', player1);

    // Create player 2
    const player2StartPosition = { x: 2, y: 17 }; // Next to player 1
    const player2 = new Player('player2', player2StartPosition, player2HeroType);
    this.players.set('player2', player2);
  }

  /**
   * Create initial game state
   */
  private createInitialGameState(gameMode: 'cooperative' | 'turnBased'): GameState {
    const player1 = this.players.get('player1');
    const player2 = this.players.get('player2');

    if (!player1 || !player2) {
      throw new Error('Players must be created before game state');
    }

    // Convert Player objects to GameState player format
    const player1State = player1.getState();
    const player2State = player2.getState();

    return {
      player1: {
        position: player1State.currentPosition,
        lastMoveTime: player1State.lastMoveTimestamp,
        lastShootTime: player1State.lastShootTimestamp,
        health: player1State.currentHealth,
        maxHealth: player1State.maximumHealth,
        isHit: player1State.isHitRecently,
        hitTime: player1State.hitTimestamp
      },
      player2: {
        position: player2State.currentPosition,
        lastMoveTime: player2State.lastMoveTimestamp,
        lastShootTime: player2State.lastShootTimestamp,
        health: player2State.currentHealth,
        maxHealth: player2State.maximumHealth,
        isHit: player2State.isHitRecently,
        hitTime: player2State.hitTimestamp
      },
      currentPlayer: 1,
      gameMode,
      enemies: [],
      projectiles: [],
      collectibleHeroes: [],
      powerUps: [],
      partyHeroes: [],
      captives: [],
      activePartyMembers: [],
      activePowerUps: [],
      gameStatus: 'playing',
      score: 0,
      level: 1,
      selectedHeroType: player1State.heroType,
      player1HeroType: player1State.heroType,
      player2HeroType: player2State.heroType,
      editorMode: false,
      selectedTool: 'enemy',
      editorObjects: [],
      selectedObject: null,
      hoveredObject: null,
      isDragging: false,
      dragStart: null,
      enemyConfigPanel: null,
      selectedEnemyType: { 
        id: 'guard', 
        name: 'Guard', 
        description: 'Basic enemy', 
        color: '#ef4444', 
        borderColor: '#dc2626', 
        icon: '🛡️', 
        maxHealth: 2, 
        moveSpeed: 800, 
        shootCooldown: 1000, 
        shootRange: 5, 
        defaultPatrolRadius: 3, 
        defaultBehavior: 'patrol' 
      },
      timeLimit: GAME_CONFIG.DEFAULT_TIME_LIMIT,
      timeRemaining: GAME_CONFIG.DEFAULT_TIME_LIMIT,
      gameStartTime: Date.now(),
      lastTimerUpdate: Date.now(),
      timerAlerts: {
        at60s: false,
        at30s: false,
        at10s: false,
      },
      campaignMode: false,
      currentCampaignLevel: 0,
    };
  }

  /**
   * Update grid with current player positions
   */
  private updateGridWithPlayers(): void {
    for (const player of this.players.values()) {
      const playerState = player.getState();
      this.gameGrid.setCellOccupancy(
        playerState.currentPosition, 
        'player', 
        player.getPlayerId()
      );
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(deltaTime: number): void {
    this.gameLoopStats.totalFrames++;
    this.gameLoopStats.lastUpdateTime = performance.now();
    
    // Calculate frame rate
    if (deltaTime > 0) {
      this.gameLoopStats.currentFrameRate = 1000 / deltaTime;
    }

    // Calculate average frame time (simple moving average)
    const alpha = 0.1; // Smoothing factor
    this.gameLoopStats.averageFrameTime = 
      (1 - alpha) * this.gameLoopStats.averageFrameTime + alpha * deltaTime;
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): Readonly<GameLoopStats> {
    return { ...this.gameLoopStats };
  }

  /**
   * Get grid instance
   */
  public getGrid(): Grid {
    return this.gameGrid;
  }

  /**
   * Get player by ID
   */
  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopGameLoop();
    this.inputHandler.destroy();
    this.players.clear();
    this.gameGrid.reset();
    this.gameState = null;
    this.gameRenderer = null;

    if (this.engineConfig.enableDebugMode) {
      console.log('GameEngine destroyed');
    }
  }
}