import { Position } from '../types/GameTypes';

export interface KeyMapping {
  up: string;
  down: string;
  left: string;
  right: string;
  shoot_up: string;
  shoot_down: string;
  shoot_left: string;
  shoot_right: string;
}

export interface InputState {
  pressedKeys: Set<string>;
  lastInputTimestamp: number;
  inputBuffer: InputCommand[];
}

export interface InputCommand {
  type: 'move' | 'shoot' | 'action';
  direction?: Position;
  playerId: string;
  timestamp: number;
}

export interface PlayerControls {
  playerId: string;
  keyMapping: KeyMapping;
  isEnabled: boolean;
}

/**
 * InputHandler manages keyboard and mouse input for the game
 */
export class InputHandler {
  private inputState: InputState;
  private playerControls: Map<string, PlayerControls>;
  private keyDownHandler: (event: KeyboardEvent) => void;
  private keyUpHandler: (event: KeyboardEvent) => void;
  private isListening: boolean;

  constructor() {
    this.inputState = {
      pressedKeys: new Set<string>(),
      lastInputTimestamp: 0,
      inputBuffer: []
    };
    
    this.playerControls = new Map();
    this.isListening = false;
    
    // Bind event handlers to maintain context
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
  }

  /**
   * Register player controls
   */
  public registerPlayerControls(playerId: string, keyMapping: KeyMapping): void {
    this.playerControls.set(playerId, {
      playerId,
      keyMapping,
      isEnabled: true
    });
  }

  /**
   * Set up default player controls
   */
  public setupDefaultControls(): void {
    // Player 1 controls (WASD + Arrow keys)
    this.registerPlayerControls('player1', {
      up: 'KeyW',
      down: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
      shoot_up: 'ArrowUp',
      shoot_down: 'ArrowDown',
      shoot_left: 'ArrowLeft',
      shoot_right: 'ArrowRight'
    });

    // Player 2 controls (IJKL + Numpad)
    this.registerPlayerControls('player2', {
      up: 'KeyI',
      down: 'KeyK',
      left: 'KeyJ',
      right: 'KeyL',
      shoot_up: 'Numpad8',
      shoot_down: 'Numpad2',
      shoot_left: 'Numpad4',
      shoot_right: 'Numpad6'
    });
  }

  /**
   * Start listening for input events
   */
  public startListening(): void {
    if (this.isListening) {
      return;
    }

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.isListening = true;
  }

  /**
   * Stop listening for input events
   */
  public stopListening(): void {
    if (!this.isListening) {
      return;
    }

    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.isListening = false;
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const keyCode = event.code;
    const currentTimestamp = Date.now();

    // Prevent default behavior for game keys
    if (this.isGameKey(keyCode)) {
      event.preventDefault();
    }

    // Add key to pressed keys set
    this.inputState.pressedKeys.add(keyCode);
    this.inputState.lastInputTimestamp = currentTimestamp;

    // Process input commands
    this.processKeyInput(keyCode, currentTimestamp);
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const keyCode = event.code;

    // Prevent default behavior for game keys
    if (this.isGameKey(keyCode)) {
      event.preventDefault();
    }

    // Remove key from pressed keys set
    this.inputState.pressedKeys.delete(keyCode);
  }

  /**
   * Check if a key is a game control key
   */
  private isGameKey(keyCode: string): boolean {
    const gameKeys = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD', // Player 1 movement
      'KeyI', 'KeyJ', 'KeyK', 'KeyL', // Player 2 movement
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', // Player 1 shooting
      'Numpad8', 'Numpad2', 'Numpad4', 'Numpad6', // Player 2 shooting
      'KeyE', 'KeyR', 'Escape', 'Delete' // Game controls
    ];
    
    return gameKeys.includes(keyCode);
  }

  /**
   * Process key input and generate commands
   */
  private processKeyInput(keyCode: string, timestamp: number): void {
    // Check each player's controls
    for (const [playerId, controls] of this.playerControls) {
      if (!controls.isEnabled) {
        continue;
      }

      const command = this.mapKeyToCommand(keyCode, controls, timestamp);
      if (command) {
        this.inputState.inputBuffer.push(command);
      }
    }
  }

  /**
   * Map key code to input command
   */
  private mapKeyToCommand(
    keyCode: string, 
    controls: PlayerControls, 
    timestamp: number
  ): InputCommand | null {
    const { keyMapping, playerId } = controls;

    // Movement commands
    if (keyCode === keyMapping.up) {
      return {
        type: 'move',
        direction: { x: 0, y: -1 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.down) {
      return {
        type: 'move',
        direction: { x: 0, y: 1 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.left) {
      return {
        type: 'move',
        direction: { x: -1, y: 0 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.right) {
      return {
        type: 'move',
        direction: { x: 1, y: 0 },
        playerId,
        timestamp
      };
    }

    // Shooting commands
    if (keyCode === keyMapping.shoot_up) {
      return {
        type: 'shoot',
        direction: { x: 0, y: -1 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.shoot_down) {
      return {
        type: 'shoot',
        direction: { x: 0, y: 1 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.shoot_left) {
      return {
        type: 'shoot',
        direction: { x: -1, y: 0 },
        playerId,
        timestamp
      };
    }
    
    if (keyCode === keyMapping.shoot_right) {
      return {
        type: 'shoot',
        direction: { x: 1, y: 0 },
        playerId,
        timestamp
      };
    }

    return null;
  }

  /**
   * Get and clear input buffer
   */
  public getInputCommands(): InputCommand[] {
    const commands = [...this.inputState.inputBuffer];
    this.inputState.inputBuffer = [];
    return commands;
  }

  /**
   * Check if key is currently pressed
   */
  public isKeyPressed(keyCode: string): boolean {
    return this.inputState.pressedKeys.has(keyCode);
  }

  /**
   * Get current movement direction for player
   */
  public getMovementDirection(playerId: string): Position | null {
    const controls = this.playerControls.get(playerId);
    if (!controls || !controls.isEnabled) {
      return null;
    }

    const { keyMapping } = controls;
    let directionX = 0;
    let directionY = 0;

    if (this.isKeyPressed(keyMapping.up)) directionY -= 1;
    if (this.isKeyPressed(keyMapping.down)) directionY += 1;
    if (this.isKeyPressed(keyMapping.left)) directionX -= 1;
    if (this.isKeyPressed(keyMapping.right)) directionX += 1;

    if (directionX === 0 && directionY === 0) {
      return null;
    }

    return { x: directionX, y: directionY };
  }

  /**
   * Enable/disable controls for a player
   */
  public setPlayerControlsEnabled(playerId: string, enabled: boolean): void {
    const controls = this.playerControls.get(playerId);
    if (controls) {
      controls.isEnabled = enabled;
    }
  }

  /**
   * Clear all pressed keys (useful for game state changes)
   */
  public clearAllInput(): void {
    this.inputState.pressedKeys.clear();
    this.inputState.inputBuffer = [];
  }

  /**
   * Get input state for debugging
   */
  public getInputState(): Readonly<InputState> {
    return {
      pressedKeys: new Set(this.inputState.pressedKeys),
      lastInputTimestamp: this.inputState.lastInputTimestamp,
      inputBuffer: [...this.inputState.inputBuffer]
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopListening();
    this.playerControls.clear();
    this.inputState.pressedKeys.clear();
    this.inputState.inputBuffer = [];
  }
}