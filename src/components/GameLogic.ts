// ... [previous code remains the same until the projectiles update section]

      trajectory,
      currentTrajectoryIndex: 0,
    };
  }

  private updateProjectiles(gameState: GameState, currentTime: number): GameState {
    const newState = { ...gameState };
    
    newState.projectiles = gameState.projectiles
      .map(projectile => {
        if (currentTime - projectile.lastMoveTime >= projectile.speed) {
          let newPosition: Position;
          
          switch (projectile.weaponType) {
            case WeaponType.BOOMERANG:
              newPosition = this.updateBoomerangPosition(projectile, currentTime);
              break;
            case WeaponType.FLAMETHROWER:
              newPosition = {
                x: projectile.position.x + projectile.direction.x,
                y: projectile.position.y + projectile.direction.y,
              };
              break;
            default:
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
        if (projectile.pierceWalls) {
          return projectile.position.x >= 0 && projectile.position.x < GRID_COLS && 
                 projectile.position.y >= 0 && projectile.position.y < GRID_ROWS;
        }
        
        if (projectile.melee) {
          return currentTime - projectile.lastMoveTime < 200;
        }
        
        if (projectile.weaponType === WeaponType.BOOMERANG) {
          if (projectile.hasReturned && projectile.startPosition) {
            return calculateDistance(projectile.position, projectile.startPosition) > 1;
          }
          return true;
        }
        
        if (projectile.weaponType === WeaponType.FLAMETHROWER) {
          const weaponConfig = WEAPON_CONFIGS[WeaponType.FLAMETHROWER];
          if (projectile.startPosition) {
            return calculateDistance(projectile.position, projectile.startPosition) <= weaponConfig.range;
          }
        }
        
        return isValidPosition(projectile.position.x, projectile.position.y);
      });
    
    return newState;
  }
}