// pathFinder.js - computes waypoint paths from ball position to a seat.
// Route policy:
// 1) Stay on walkable concourse rings.
// 2) Use the nearest real staircase tower for floor changes.
// 3) Never route through field center; use ring arcs for horizontal travel.

const PATH_ELEV = 1.8;
const WALK_SPEED_MPS = 1.4; // ~5.0 km/h

const LEVELS = [0, 18, 21, 33];
const TIER_FLOOR_Y = { lower: 18, club: 21, upper: 33 };

// Walk radius (navigable concourse ring) at each floor level.
const CONCOURSE_WALK_RADIUS = {
  0:  { a: 90,  b: 68  },
  18: { a: 108, b: 82  },
  21: { a: 123, b: 94  },
  33: { a: 130, b: 100 },
};

// The four real staircase towers (matching StaircaseTowers.jsx).
// TOWER_D = 12, so hd = 6.  The front face (opening toward concourse) is
// offset outward from the tower centre by FRONT_DIST along the radial direction.
const TOWERS = (() => {
  const FRONT_DIST = 6; // TOWER_D / 2
  return [
    { id: 'ne', cx:  80, cz: -55 },
    { id: 'nw', cx: -80, cz: -55 },
    { id: 'se', cx:  80, cz:  55 },
    { id: 'sw', cx: -80, cz:  55 },
  ].map(t => {
    const len = Math.sqrt(t.cx * t.cx + t.cz * t.cz);
    // fdx/fdz: outward unit vector × FRONT_DIST (points away from field)
    return { ...t, fdx: (t.cx / len) * FRONT_DIST, fdz: (t.cz / len) * FRONT_DIST };
  });
})();

// ── Geometry helpers ──────────────────────────────────────────────────────────

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

/** World-space point at the front face opening of a tower at a given floor. */
function towerFrontPoint(tower, floorY) {
  return {
    x: tower.cx + tower.fdx,
    y: floorY + PATH_ELEV,
    z: tower.cz + tower.fdz,
  };
}

/** Centre of the tower structure at a given floor (for vertical landings). */
function towerCenterPoint(tower, floorY) {
  return {
    x: tower.cx,
    y: floorY + PATH_ELEV,
    z: tower.cz,
  };
}

function normAngleDelta(fromAngle, toAngle) {
  let delta = toAngle - fromAngle;
  while (delta > Math.PI)  delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

function arcDistance(fromAngle, toAngle, floorY) {
  const ring = CONCOURSE_WALK_RADIUS[floorY] ?? CONCOURSE_WALK_RADIUS[18];
  const avgR = (ring.a + ring.b) / 2;
  return Math.abs(normAngleDelta(fromAngle, toAngle)) * avgR;
}

function concourseArcWaypoints(fromAngle, toAngle, floorY, nPoints = 16) {
  const ring = CONCOURSE_WALK_RADIUS[floorY] ?? CONCOURSE_WALK_RADIUS[18];
  const { a, b } = ring;
  const delta = normAngleDelta(fromAngle, toAngle);
  const pts = [];
  for (let i = 0; i <= nPoints; i++) {
    const theta = fromAngle + (i / nPoints) * delta;
    pts.push(ellipsePoint(a, b, theta, floorY));
  }
  return pts;
}

function waypointLengthMeters(waypoints) {
  if (!waypoints || waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

/**
 * Pick the tower that minimises total travel cost:
 *   arc(ball → tower entry on ballFloor) + arc(tower exit on seatFloor → seat)
 */
function pickBestTower(ballPos, ballFloorY, seatFloorY, seatAngle) {
  const ballAngle = pointAngle(ballPos.x, ballPos.z);
  let best = null;
  let bestCost = Infinity;

  for (const tower of TOWERS) {
    const entry = towerFrontPoint(tower, ballFloorY);
    const exit  = towerFrontPoint(tower, seatFloorY);

    const entryAngle = pointAngle(entry.x, entry.z);
    const exitAngle  = pointAngle(exit.x,  exit.z);

    const approachArc = arcDistance(ballAngle, entryAngle, ballFloorY);
    const departArc   = arcDistance(exitAngle, seatAngle,  seatFloorY);
    const vertical    = Math.abs(seatFloorY - ballFloorY);

    const cost = approachArc + departArc + vertical;
    if (cost < bestCost) {
      bestCost = cost;
      best = tower;
    }
  }

  return best;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computePathPlan(ballPos, seatPos, tierId) {
  if (!ballPos || !seatPos || !tierId) {
    return { waypoints: [], connector: null, distanceMeters: 0, distanceFeet: 0, etaMinutes: 0 };
  }

  const ballFloorY = nearestLevel(ballPos.y);
  const seatFloorY = TIER_FLOOR_Y[tierId] ?? 18;
  const seatAngle  = pointAngle(seatPos.x, seatPos.z);
  const ballAngle  = pointAngle(ballPos.x, ballPos.z);

  const waypoints = [];
  waypoints.push({ x: ballPos.x, y: ballPos.y + PATH_ELEV, z: ballPos.z });

  // ── Project ball onto concourse ring at its current floor ─────────────────
  const ballRing = CONCOURSE_WALK_RADIUS[ballFloorY] ?? CONCOURSE_WALK_RADIUS[18];
  const ballOnRing = ellipsePoint(ballRing.a, ballRing.b, ballAngle, ballFloorY);
  waypoints.push(ballOnRing);

  if (ballFloorY === seatFloorY) {
    // ── Same floor: arc directly to seat angle, then final approach ──────────
    const arcPts = concourseArcWaypoints(ballAngle, seatAngle, ballFloorY, 16);
    waypoints.push(...arcPts.slice(1)); // skip duplicate of ballOnRing
    waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });

    const distanceMeters = waypointLengthMeters(waypoints);
    return {
      waypoints,
      connector: null,
      distanceMeters,
      distanceFeet: distanceMeters * 3.28084,
      etaMinutes: distanceMeters / WALK_SPEED_MPS / 60,
    };
  }

  // ── Different floor: route via nearest staircase tower ────────────────────
  const tower = pickBestTower(ballPos, ballFloorY, seatFloorY, seatAngle);
  if (!tower) {
    // Fallback straight line (should never happen with 4 towers)
    waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });
    const d = waypointLengthMeters(waypoints);
    return { waypoints, connector: null, distanceMeters: d, distanceFeet: d * 3.28084, etaMinutes: d / WALK_SPEED_MPS / 60 };
  }

  // Arc along current floor ring to tower front face
  const entryFront = towerFrontPoint(tower, ballFloorY);
  const entryAngle = pointAngle(entryFront.x, entryFront.z);
  const approachArc = concourseArcWaypoints(ballAngle, entryAngle, ballFloorY, 14);
  waypoints.push(...approachArc.slice(1));
  waypoints.push(entryFront);

  // Enter tower centre at current floor
  waypoints.push(towerCenterPoint(tower, ballFloorY));

  // Step through intermediate floor landings inside the tower
  const fromIdx = LEVELS.indexOf(ballFloorY);
  const toIdx   = LEVELS.indexOf(seatFloorY);
  const step    = toIdx > fromIdx ? 1 : -1;
  for (let idx = fromIdx + step; idx !== toIdx + step; idx += step) {
    waypoints.push(towerCenterPoint(tower, LEVELS[idx]));
  }

  // Exit tower via front face onto destination floor concourse
  const exitFront = towerFrontPoint(tower, seatFloorY);
  waypoints.push(exitFront);

  // Arc along destination floor ring to seat angle
  const exitAngle = pointAngle(exitFront.x, exitFront.z);
  const departArc = concourseArcWaypoints(exitAngle, seatAngle, seatFloorY, 16);
  waypoints.push(...departArc.slice(1));

  // Final approach to seat
  waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });

  const distanceMeters = waypointLengthMeters(waypoints);

  return {
    waypoints,
    connector: { id: tower.id, type: 'stair' },
    distanceMeters,
    distanceFeet: distanceMeters * 3.28084,
    etaMinutes: distanceMeters / WALK_SPEED_MPS / 60,
  };
}

// Backward-compatible helper used by existing renderer.
export function computeWaypoints(ballPos, seatPos, tierId) {
  return computePathPlan(ballPos, seatPos, tierId).waypoints;
}
