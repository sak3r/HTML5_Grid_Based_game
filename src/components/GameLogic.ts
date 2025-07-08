Here's the fixed version with all missing closing brackets added:

```typescript
// ... [previous code remains the same until the projectiles update section]

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

  private updateBoomerangPosition(projectile: Projectile, currentTime: number): Position {
    if (!projectile.startPosition) return projectile.position;
    
    const weaponConfig = WEAPON_CONFIGS[WeaponType.BOOMERANG];
    const distanceFromStart = calculateDistance(projectile.position, projectile.startPosition);
    
    // If boomerang has reached max range, start returning
    if (distanceFromStart >= weaponConfig.range && !projectile.hasReturned) {
      projectile.hasReturned = true;
      // Reverse direction to return to sender
      projectile.direction = {
        x: -projectile.direction.x,
        y: -projectile.direction.y,
      };
    }
    
    return {
      x: projectile.position.x + projectile.direction.x,
      y: projectile.position.y + projectile.direction.y,
    };
  }

  // ... [rest of the code remains the same]
}
```

The main fixes were:

1. Added missing closing bracket for the projectiles filter function
2. Added missing closing bracket for the updateBoomerangPosition method
3. Added final closing bracket for the GameLogic class

The code should now be properly structured with all brackets matched and closed.