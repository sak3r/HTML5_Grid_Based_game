import { GRID_COLS, GRID_ROWS } from '../config/GameConfig';
import { Position, Enemy, Player, Projectile } from '../types/GameTypes';

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};

export const isValidPosition = (x: number, y: number, allowExit: boolean = false): boolean => {
  if (allowExit && y === -1 && x >= 0 && x < GRID_COLS) {
    return true; // Allow exit through top
  }
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
};

export const moveTowardsTarget = (current: Position, target: Position): Position => {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  
  let moveX = 0;
  let moveY = 0;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    moveX = dx > 0 ? 1 : -1;
  } else if (dy !== 0) {
    moveY = dy > 0 ? 1 : -1;
  } else if (dx !== 0) {
    moveX = dx > 0 ? 1 : -1;
  }
  
  const newX = Math.max(0, Math.min(GRID_COLS - 1, current.x + moveX));
  const newY = Math.max(0, Math.min(GRID_ROWS - 1, current.y + moveY));
  
  return { x: newX, y: newY };
};

export const isInLineOfSight = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x || pos1.y === pos2.y;
};

export const getDirectionToTarget = (from: Position, to: Position): Position => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  return {
    x: dx === 0 ? 0 : dx > 0 ? 1 : -1,
    y: dy === 0 ? 0 : dy > 0 ? 1 : -1,
  };
};

export const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const calculateBoomerangPosition = (startPos: Position, currentPos: Position, direction: Position, range: number): Position => {
  const distance = calculateDistance(startPos, currentPos);
  
  if (distance >= range) {
    // Start returning
    return {
      x: currentPos.x - direction.x,
      y: currentPos.y - direction.y,
    };
  }
  
  return {
    x: currentPos.x + direction.x,
    y: currentPos.y + direction.y,
  };
};

export const getExplosionPositions = (center: Position, radius: number): Position[] => {
  const positions: Position[] = [];
  
  for (let x = center.x - radius; x <= center.x + radius; x++) {
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      const distance = calculateDistance(center, { x, y });
      if (distance <= radius && isValidPosition(x, y)) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
};

export const getFlamePositions = (start: Position, end: Position): Position[] => {
  const positions: Position[] = [];
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;
  let err = dx - dy;
  
  let x = start.x;
  let y = start.y;
  
  while (true) {
    if (isValidPosition(x, y)) {
      positions.push({ x, y });
    }
    
    if (x === end.x && y === end.y) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return positions;
};