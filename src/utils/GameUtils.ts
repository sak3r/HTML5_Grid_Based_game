import { Position, Enemy, Player, Projectile } from '../types/GameTypes';
import { GRID_COLS, GRID_ROWS } from '../config/GameConfig';

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