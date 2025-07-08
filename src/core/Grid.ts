import { Position, GridCell, GridConfig } from '../types/GameTypes';
import { GRID_COLS, GRID_ROWS, GAME_CONFIG } from '../config/GameConfig';

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

/**
 * Grid class manages the game grid data structure, cell states, and spatial queries
 */
export class Grid {
  private gridCells: GridCell[][];
  private readonly gridConfig: GridConfig;

  constructor(config?: Partial<GridConfig>) {
    this.gridConfig = {
      columns: GRID_COLS,
      rows: GRID_ROWS,
      cellSize: GAME_CONFIG.GRID_SIZE,
      canvasWidth: GAME_CONFIG.CANVAS_WIDTH,
      canvasHeight: GAME_CONFIG.CANVAS_HEIGHT,
      ...config
    };

    this.initializeGrid();
  }

  /**
   * Initialize the grid with empty cells
   */
  private initializeGrid(): void {
    this.gridCells = [];
    
    for (let row = 0; row < this.gridConfig.rows; row++) {
      this.gridCells[row] = [];
      for (let col = 0; col < this.gridConfig.columns; col++) {
        this.gridCells[row][col] = {
          position: { x: col, y: row },
          isOccupied: false,
          occupantType: null,
          occupantId: null,
          isWalkable: true,
          isVisible: true
        };
      }
    }
  }

  /**
   * Check if a position is within grid bounds
   */
  public isValidPosition(position: Position): boolean {
    return position.x >= 0 && 
           position.x < this.gridConfig.columns && 
           position.y >= 0 && 
           position.y < this.gridConfig.rows;
  }

  /**
   * Get cell at specific position
   */
  public getCellAt(position: Position): GridCell | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.gridCells[position.y][position.x];
  }

  /**
   * Set cell occupancy
   */
  public setCellOccupancy(
    position: Position, 
    occupantType: GridCell['occupantType'], 
    occupantId: string | null = null
  ): boolean {
    const cell = this.getCellAt(position);
    if (!cell) {
      console.warn(`Attempted to set occupancy for invalid position: ${position.x}, ${position.y}`);
      return false;
    }

    cell.isOccupied = occupantType !== null;
    cell.occupantType = occupantType;
    cell.occupantId = occupantId;
    cell.isWalkable = occupantType !== 'wall';

    return true;
  }

  /**
   * Clear cell occupancy
   */
  public clearCellOccupancy(position: Position): boolean {
    return this.setCellOccupancy(position, null, null);
  }

  /**
   * Check if a cell is walkable
   */
  public isCellWalkable(position: Position): boolean {
    const cell = this.getCellAt(position);
    return cell ? cell.isWalkable : false;
  }

  /**
   * Check if a cell is occupied
   */
  public isCellOccupied(position: Position): boolean {
    const cell = this.getCellAt(position);
    return cell ? cell.isOccupied : true; // Treat invalid positions as occupied
  }

  /**
   * Get all cells within a radius
   */
  public getCellsInRadius(centerPosition: Position, radius: number): GridCell[] {
    const cellsInRadius: GridCell[] = [];
    
    for (let x = centerPosition.x - radius; x <= centerPosition.x + radius; x++) {
      for (let y = centerPosition.y - radius; y <= centerPosition.y + radius; y++) {
        const position = { x, y };
        const distance = this.calculateDistance(centerPosition, position);
        
        if (distance <= radius) {
          const cell = this.getCellAt(position);
          if (cell) {
            cellsInRadius.push(cell);
          }
        }
      }
    }
    
    return cellsInRadius;
  }

  /**
   * Calculate distance between two positions
   */
  public calculateDistance(position1: Position, position2: Position): number {
    const deltaX = position1.x - position2.x;
    const deltaY = position1.y - position2.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Convert grid position to pixel coordinates
   */
  public gridToPixel(gridPosition: Position): Position {
    return {
      x: gridPosition.x * this.gridConfig.cellSize,
      y: gridPosition.y * this.gridConfig.cellSize
    };
  }

  /**
   * Convert pixel coordinates to grid position
   */
  public pixelToGrid(pixelPosition: Position): Position {
    return {
      x: Math.floor(pixelPosition.x / this.gridConfig.cellSize),
      y: Math.floor(pixelPosition.y / this.gridConfig.cellSize)
    };
  }

  /**
   * Get grid configuration
   */
  public getConfig(): GridConfig {
    return { ...this.gridConfig };
  }

  /**
   * Reset grid to initial state
   */
  public reset(): void {
    this.initializeGrid();
  }

  /**
   * Get all cells of a specific type
   */
  public getCellsByType(occupantType: GridCell['occupantType']): GridCell[] {
    const cells: GridCell[] = [];
    
    for (let row = 0; row < this.gridConfig.rows; row++) {
      for (let col = 0; col < this.gridConfig.columns; col++) {
        const cell = this.gridCells[row][col];
        if (cell.occupantType === occupantType) {
          cells.push(cell);
        }
      }
    }
    
    return cells;
  }

  /**
   * Check line of sight between two positions
   */
  public hasLineOfSight(startPosition: Position, endPosition: Position): boolean {
    // Simple line of sight check - can be enhanced with Bresenham's algorithm
    const deltaX = Math.abs(endPosition.x - startPosition.x);
    const deltaY = Math.abs(endPosition.y - startPosition.y);
    
    // Check if positions are on same row or column
    if (startPosition.x === endPosition.x) {
      // Same column - check vertical line
      const minY = Math.min(startPosition.y, endPosition.y);
      const maxY = Math.max(startPosition.y, endPosition.y);
      
      for (let y = minY + 1; y < maxY; y++) {
        const cell = this.getCellAt({ x: startPosition.x, y });
        if (cell && !cell.isWalkable) {
          return false;
        }
      }
      return true;
    }
    
    if (startPosition.y === endPosition.y) {
      // Same row - check horizontal line
      const minX = Math.min(startPosition.x, endPosition.x);
      const maxX = Math.max(startPosition.x, endPosition.x);
      
      for (let x = minX + 1; x < maxX; x++) {
        const cell = this.getCellAt({ x, y: startPosition.y });
        if (cell && !cell.isWalkable) {
          return false;
        }
      }
      return true;
    }
    
    // For diagonal or complex paths, implement Bresenham's line algorithm
    return this.bresenhamLineOfSight(startPosition, endPosition);
  }

  /**
   * Bresenham's line algorithm for line of sight
   */
  private bresenhamLineOfSight(startPosition: Position, endPosition: Position): boolean {
    const deltaX = Math.abs(endPosition.x - startPosition.x);
    const deltaY = Math.abs(endPosition.y - startPosition.y);
    const stepX = startPosition.x < endPosition.x ? 1 : -1;
    const stepY = startPosition.y < endPosition.y ? 1 : -1;
    let error = deltaX - deltaY;
    
    let currentX = startPosition.x;
    let currentY = startPosition.y;
    
    while (currentX !== endPosition.x || currentY !== endPosition.y) {
      const doubleError = 2 * error;
      
      if (doubleError > -deltaY) {
        error -= deltaY;
        currentX += stepX;
      }
      
      if (doubleError < deltaX) {
        error += deltaX;
        currentY += stepY;
      }
      
      // Check if current position blocks line of sight
      const cell = this.getCellAt({ x: currentX, y: currentY });
      if (cell && !cell.isWalkable) {
        return false;
      }
    }
    
    return true;
  }
}