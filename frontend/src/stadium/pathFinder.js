// pathFinder.js - computes waypoint paths from ball position to a seat.
// Route policy:
// 1) Stay on walkable concourse rings.
// 2) Use the nearest viable connector (stairs/elevator) for floor changes.
// 3) Never route through field center by using ring arcs for horizontal travel.

const PATH_ELEV = 1.8;
const WALK_SPEED_MPS = 1.4; // ~5.0 km/h

const LEVELS = [0, 18, 21, 33];
const TIER_FLOOR_Y = { lower: 18, club: 21, upper: 33 };

// Walk radius (navigable concourse ring) at each floor level.
const CONCOURSE_WALK_RADIUS = {
  0: { a: 90, b: 68 },
  18: { a: 108, b: 82 },
  21: { a: 123, b: 94 },
  33: { a: 130, b: 100 },
};

// Mixed set of vertical connectors.
const CONNECTORS = [
  { id: 'stair-ne', type: 'stair', x: 80, z: -55, exitOffsetZ: 7 },
  { id: 'stair-nw', type: 'stair', x: -80, z: -55, exitOffsetZ: 7 },
  { id: 'stair-se', type: 'stair', x: 80, z: 55, exitOffsetZ: 7 },
  { id: 'stair-sw', type: 'stair', x: -80, z: 55, exitOffsetZ: 7 },
  { id: 'elev-n', type: 'elevator', x: 0, z: -88, exitOffsetZ: 5 },
  { id: 'elev-s', type: 'elevator', x: 0, z: 88, exitOffsetZ: -5 },
  { id: 'elev-e', type: 'elevator', x: 102, z: 0, exitOffsetZ: 0 },
  { id: 'elev-w', type: 'elevator', x: -102, z: 0, exitOffsetZ: 0 },
];

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

function connectorEntryPoint(connector, floorY) {
  const z = connector.z + (connector.exitOffsetZ ?? 0);
  return { x: connector.x, y: floorY + PATH_ELEV, z };
}

function distXZ(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function normAngleDelta(fromAngle, toAngle) {
  let delta = toAngle - fromAngle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

function arcDistance(fromAngle, toAngle, floorY) {
  const ring = CONCOURSE_WALK_RADIUS[floorY] ?? CONCOURSE_WALK_RADIUS[18];
  const avgR = (ring.a + ring.b) / 2;
  return Math.abs(normAngleDelta(fromAngle, toAngle)) * avgR;
}

function radialDistanceToRing(pos, floorY) {
  const ring = CONCOURSE_WALK_RADIUS[floorY] ?? CONCOURSE_WALK_RADIUS[18];
  const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  const avgR = (ring.a + ring.b) / 2;
  return Math.abs(avgR - r);
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

function pickBestConnector(ballPos, ballFloorY, seatFloorY, seatAngle) {
  let best = null;
  let bestCost = Infinity;
  const ballAngle = pointAngle(ballPos.x, ballPos.z);

  for (const connector of CONNECTORS) {
    const entryStart = connectorEntryPoint(connector, ballFloorY);
    const entryDest = connectorEntryPoint(connector, seatFloorY);
    const connectorStartAngle = pointAngle(entryStart.x, entryStart.z);

    // Horizontal travel policy: move to ring, arc around ring, then connector.
    const approachToRing = radialDistanceToRing(ballPos, ballFloorY);
    const startArcDist = arcDistance(ballAngle, connectorStartAngle, ballFloorY);
    const connectorAngle = pointAngle(entryDest.x, entryDest.z);
    const endArcDist = arcDistance(connectorAngle, seatAngle, seatFloorY);
    const vertical = Math.abs(seatFloorY - ballFloorY);

    const cost = approachToRing + startArcDist + endArcDist + vertical;
    if (cost < bestCost) {
      bestCost = cost;
      best = connector;
    }
  }

  return best;
}

export function computePathPlan(ballPos, seatPos, tierId) {
  if (!ballPos || !seatPos || !tierId) {
    return {
      waypoints: [],
      connector: null,
      distanceMeters: 0,
      distanceFeet: 0,
      etaMinutes: 0,
    };
  }

  const waypoints = [];
  waypoints.push({ x: ballPos.x, y: ballPos.y + PATH_ELEV, z: ballPos.z });

  const ballFloorY = nearestLevel(ballPos.y);
  const seatFloorY = TIER_FLOOR_Y[tierId] ?? 18;
  const seatAngle = pointAngle(seatPos.x, seatPos.z);
  const ballAngle = pointAngle(ballPos.x, ballPos.z);

  const connector = pickBestConnector(ballPos, ballFloorY, seatFloorY, seatAngle);
  if (!connector) {
    const fallback = [
      { x: ballPos.x, y: ballPos.y + PATH_ELEV, z: ballPos.z },
      { x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z },
    ];
    const d = waypointLengthMeters(fallback);
    return {
      waypoints: fallback,
      connector: null,
      distanceMeters: d,
      distanceFeet: d * 3.28084,
      etaMinutes: d / WALK_SPEED_MPS / 60,
    };
  }

  // Move from current location to concourse ring first.
  const ring = CONCOURSE_WALK_RADIUS[ballFloorY] ?? CONCOURSE_WALK_RADIUS[18];
  const ballOnRing = ellipsePoint(ring.a, ring.b, ballAngle, ballFloorY);
  waypoints.push(ballOnRing);

  // Follow the ring to the selected connector on current floor.
  const startEntry = connectorEntryPoint(connector, ballFloorY);
  const startEntryAngle = pointAngle(startEntry.x, startEntry.z);
  const approachArc = concourseArcWaypoints(ballAngle, startEntryAngle, ballFloorY, 14);
  waypoints.push(...approachArc.slice(1));
  waypoints.push(startEntry);

  // Vertical transition through connector if needed.
  if (ballFloorY !== seatFloorY) {
    const fromIdx = LEVELS.indexOf(ballFloorY);
    const toIdx = LEVELS.indexOf(seatFloorY);
    const step = toIdx > fromIdx ? 1 : -1;

    for (let idx = fromIdx + step; idx !== toIdx + step; idx += step) {
      waypoints.push({
        x: connector.x,
        y: LEVELS[idx] + PATH_ELEV,
        z: connector.z,
      });
    }
  }

  // Exit connector and travel around the concourse ring to seat angle.
  const exit = connectorEntryPoint(connector, seatFloorY);
  const exitAngle = pointAngle(exit.x, exit.z);
  waypoints.push(exit);

  const arcPts = concourseArcWaypoints(exitAngle, seatAngle, seatFloorY, 16);
  waypoints.push(...arcPts.slice(1));

  // Final approach to seat.
  waypoints.push({ x: seatPos.x, y: seatPos.y + PATH_ELEV, z: seatPos.z });

  const distanceMeters = waypointLengthMeters(waypoints);

  return {
    waypoints,
    connector,
    distanceMeters,
    distanceFeet: distanceMeters * 3.28084,
    etaMinutes: distanceMeters / WALK_SPEED_MPS / 60,
  };
}

// Backward-compatible helper used by existing renderer.
export function computeWaypoints(ballPos, seatPos, tierId) {
  return computePathPlan(ballPos, seatPos, tierId).waypoints;
}
