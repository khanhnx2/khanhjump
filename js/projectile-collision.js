export function findProjectileHit(projectile, obstacles, radius) {
  return obstacles.find((obstacle) => {
    const bounds = obstacleBounds(obstacle);
    return projectile.x + radius > obstacle.x &&
      projectile.x - radius < obstacle.x + 1 &&
      projectile.y + radius > bounds.bottom &&
      projectile.y - radius < bounds.top;
  });
}

function obstacleBounds(obstacle) {
  if (obstacle.type === 'ceiling-spike') return { bottom: obstacle.y - 1, top: obstacle.y };
  return { bottom: obstacle.y, top: obstacle.y + 1 };
}
