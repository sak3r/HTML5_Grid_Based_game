Here's the fixed version with all missing closing brackets added:

```typescript
// ... [previous code remains the same until the projectiles update section]

      switch (projectile.weaponType) {
        case WeaponType.BOOMERANG:
          newPosition = this.updateBoomerangPosition(projectile, currentTime);
          break;
        case WeaponType.FLAMETHROWER:
          // Flamethrower projectiles move in straight line but have shorter range
          newPosition = {
            x: projectile.position.x + projectile.direction.x,
            y: projectile.position.y + projectile.direction.y,
          };
          break;
        default:
          // Standard movement for rifle, spear, grenade
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
    // Keep projectiles that can pierce walls or are in valid positions
    if (projectile.pierceWalls) {
      return projectile.position.x >= 0 && projectile.position.x < GRID_COLS && 
             projectile.position.y >= 0 && projectile.position.y < GRID_ROWS;
    }
    
    // Remove melee weapons after short duration
    if (projectile.melee) {
      return currentTime - projectile.lastMoveTime < 200;
    }
    
    // Standard boundary check
    return isValidPosition(projectile.position.x, projectile.position.y);
  });

  return newState;
}

// ... [rest of the code remains the same]
```

The main issues were:
1. Missing closing brackets for the projectile update switch statement
2. Missing closing brackets for the projectile filter function
3. Missing closing bracket for the updateProjectiles method

The code now properly closes all blocks and maintains the correct nesting structure.