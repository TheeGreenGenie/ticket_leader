// pathFinder.js — computes waypoint path from ball position to a seat
// Used by SeatPath to draw an animated route preview.

const PATH_ELEV = 1.8; // lift every waypoint above ground/floor so tube never clips

const TOWERS = [
  { id: 'ne', cx:  80, cz: -55 },
  { id: 'nw', cx: -80, cz: -55 },
  { id: 'se', cx:  80, cz:  55 },
  { id: 'sw', cx: -80, cz:  55 },
];

const LEVELS = [0, 18, 21, 33]; // valid concourse floor Y values

const TIER_FLOOR_Y = { lower: 18, club: 21, upper: 33 };

// Walk radius (midpoint of navigable concourse ring) at each floor level
const CONCOURSE_WALK_RADIUS = {
  0:  { a: 90,  b: 68  },
  18: { a: 108, b: 82  },
  21: { a: 123, b: 94  },
  33: { a: 130, b: 100 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function nearestLevel(y) {
  return LEVELS.reduce((best, lvl) =>
    Math.abs(lvl - y) < Math.abs(best - y) ? lvl : best
  );
}

function pointAngle(x, z) {
  return Math.atan2(z, x);
}

function ellipsePoint(a, b, theta, y) {
  return { x: a * Math.cos(theta), y: y + PATH_ELEV, z: b * Math.sin(theta) };
}

// Walk along the concourse ring (shortest arc) from fromAngle to toAngle
function concourseArcWaypoints(fromAngle, toAngle, floorY, nPoints = 14) {
  const ring = CONCOURSE_WALK_RADIUS[floorY] ?? CONCOURSE_WALK_RADIUS[18];
  const { a, b } = ring;

  let delta = toAngle - fromAngle;
  while (delta >  Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  const pts = [];
  for (let i = 0; i <= nPoints; i++) {
    const theta = fromAngle + (i / nPoints) * delta;
    pts.push(ellipsePoint(a, b, theta, floorY));
  }
  return pts;
}

// Front-face opening of a tower at a given Y level
function towerEntryPoint(tower, y) {
  return { x: tower.cx, y: y + PATH_ELEV, z: tower.cz + 7 };
}

// Straight distance between two points (XZ only, ignoring Y)
function distXZ(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * computeWaypoints
 * @param {{ x: number, y: number, z: number }} ballPos — ball world position
 * @param {{ x: number, y: number, z: number }} seatPos — seat world position
 * @param {'lower'|'club'|'upper'} tierId
 * @returns {{ x: number, y: number, z: number }[]} ordered waypoints
 */
export function computeWaypoints(ballPos, seatPos, tierId) {
  if (!ballPos || !seatPos || !tierId) return [];

  const waypoints = [];

  // 1. Start at ball (elevate so path floats above ground)
  waypoints.push({ x: ballPos.x, y: ballPos.y + PATH_ELEV, z: ballPos.z });

  const ballFloorY = nearestLevel(ballPos.y);
  const seatFloorY = TIER_FLOOR_Y[tierId] ?? 18;
  const seatAngle  = pointAngle(seatPos.x, seatPos.z);

  // 2. Same floor — skip tower, just arc along concourse then walk to seat
  if (ballFloorY === seatFloorY) {
    const ballAngle = pointAngle(ballPos.x, ballPos.z);
    // Walk out to concourse ring radius first
    const ring = CONCOURSE_WALK_RADIUS[seatFloorY];
    const ballOnRing = ellipsePoint(ring.a, ring.b, ballAngle, seatFloorY);
    waypoints.push(ballOnRing);

    const arcPts = concourseArcWaypoints(ballAngle, seatAngle, seatFloorY, 14);
    waypoints.push(...arcPts.slice(1)); // skip duplicate
    waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });
    return waypoints;
  }

  // 3. Different floor — find nearest staircase tower
  let bestTower = null;
  let bestCost  = Infinity;

  for (const tower of TOWERS) {
    const entry = towerEntryPoint(tower, ballFloorY);
    const distToTower = distXZ({ x: ballPos.x, z: ballPos.z }, { x: entry.x, z: entry.z });

    const exit       = towerEntryPoint(tower, seatFloorY);
    const towerAngle = pointAngle(exit.x, exit.z);
    const ring       = CONCOURSE_WALK_RADIUS[seatFloorY];
    const avgR       = (ring.a + ring.b) / 2;

    let arcDelta = Math.abs(seatAngle - towerAngle);
    if (arcDelta > Math.PI) arcDelta = 2 * Math.PI - arcDelta;
    const arcDist = arcDelta * avgR;

    const cost = distToTower + arcDist;
    if (cost < bestCost) {
      bestCost  = cost;
      bestTower = tower;
    }
  }

  // 4. Ball → tower entry at ball's floor
  const towerEntry = towerEntryPoint(bestTower, ballFloorY);
  waypoints.push(towerEntry);

  // 5. Walk up/down through intermediate landings inside the tower
  const fromIdx = LEVELS.indexOf(ballFloorY);
  const toIdx   = LEVELS.indexOf(seatFloorY);
  const step    = toIdx > fromIdx ? 1 : -1;

  for (let idx = fromIdx + step; idx !== toIdx + step; idx += step) {
    waypoints.push({ x: bestTower.cx, y: LEVELS[idx] + PATH_ELEV, z: bestTower.cz });
  }

  // 6. Tower exit at seat's floor
  const towerExit = towerEntryPoint(bestTower, seatFloorY);
  waypoints.push(towerExit);

  // 7. Walk arc along concourse ring to seat's angle
  const towerAngle = pointAngle(towerExit.x, towerExit.z);
  const arcPts     = concourseArcWaypoints(towerAngle, seatAngle, seatFloorY, 14);
  waypoints.push(...arcPts.slice(1));

  // 8. End at seat
  waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });

  return waypoints;
}
