import { useEffect, useRef } from 'react';
import { useRegisterCollider } from './CollisionContext';
import { STADIUM } from './stadiumMath';

const WALL_R_IN  = 115;
const WALL_R_OUT = 118;
const WALL_H     = STADIUM.UPPER_TIER_TOP + 10; // ~68m
const WALL_Y     = WALL_H / 2;
const GAP_HALF   = 0.09; // radians — ~10m gate opening at radius 118

// AT&T Stadium entry positions in radians around the ellipse.
// Three.js CylinderGeometry theta=0 is +X (East), going counter-clockwise.
// Stadium orientation: +Z = South, -Z = North, +X = East, -X = West
// Angle convention: East=0, North=PI/2, West=PI, South=3PI/2 (CCW from East)
//
// Real entries from map:
//   North wall (top): K ~ slightly left of center, A ~ slightly right of center (upper level, skip gap)
//   South wall (bottom): F ~ left of center, E ~ right of center
//   East wall (right): B (upper), C (middle), D (lower)
//   West wall (left): J (upper), H (middle), G (lower)
//
// We model ground-level walkable entries only (A is Hall of Fame level, skip ground gap):
//   North: Entry K  => angle ~PI/2 + 0.15 (slightly left of true North)
//   South: Entry F  => angle ~3PI/2 - 0.15, Entry E => 3PI/2 + 0.15
//   East:  Entry B  => ~0.5, Entry C => ~0.0, Entry D => ~-0.5 (= 5.78)
//   West:  Entry J  => ~PI - 0.5, Entry H => ~PI, Entry G => ~PI + 0.5

const GATE_CENTERS = [
  // North
  { id: 'K', angle: Math.PI / 2 + 0.18 },
  // South
  { id: 'F', angle: 3 * Math.PI / 2 - 0.18 },
  { id: 'E', angle: 3 * Math.PI / 2 + 0.18 },
  // East
  { id: 'B', angle: 0.45 },
  { id: 'C', angle: 0.0 },
  { id: 'D', angle: -0.45 + Math.PI * 2 }, // same as ~5.83
  // West
  { id: 'J', angle: Math.PI - 0.45 },
  { id: 'H', angle: Math.PI },
  { id: 'G', angle: Math.PI + 0.45 },
];

// Build arc segments filling the wall between gate gaps
function buildArcs(gates) {
  // Sort gate centers by angle
  const sorted = [...gates].map(g => ({ ...g, angle: g.angle % (Math.PI * 2) }))
    .sort((a, b) => a.angle - b.angle);

  const arcs = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const next = sorted[(i + 1) % sorted.length];
    const gapEnd   = cur.angle  + GAP_HALF;
    const gapStart = next.angle - GAP_HALF;

    let length = gapStart - gapEnd;
    if (length < 0) length += Math.PI * 2;
    if (length > 0.01) {
      arcs.push({ start: gapEnd, length });
    }
  }
  return arcs;
}

const ARCS = buildArcs(GATE_CENTERS);

// Lintel beams above each gate — positioned at the gate's world X/Z
const GATE_LINTELS = GATE_CENTERS.map(({ id, angle }) => ({
  id,
  x: Math.cos(angle) * WALL_R_IN,
  z: -Math.sin(angle) * WALL_R_IN, // negative because Three.js CylinderGeometry goes CW in XZ
  ry: angle,
}));

function ArcWall({ start, length, wallRef, register }) {
  useEffect(() => {
    if (wallRef.current) register(wallRef.current);
  }, []);

  return (
    <mesh ref={wallRef} position={[0, WALL_Y, 0]}>
      <cylinderGeometry
        args={[WALL_R_IN, WALL_R_OUT, WALL_H, 32, 1, true, start, length]}
      />
      <meshLambertMaterial color="#1e3560" side={2} />
    </mesh>
  );
}

export function GatedOuterWall() {
  const register  = useRegisterCollider();
  const arcRefs   = useRef(ARCS.map(() => ({ current: null })));
  const lintelRefs = useRef(GATE_LINTELS.map(() => ({ current: null })));

  useEffect(() => {
    lintelRefs.current.forEach(r => { if (r.current) register(r.current); });
  }, []);

  return (
    <group>
      {ARCS.map((arc, i) => (
        <ArcWall
          key={i}
          start={arc.start}
          length={arc.length}
          wallRef={arcRefs.current[i]}
          register={register}
        />
      ))}

      {/* Lintel beams above each gate opening */}
      {GATE_LINTELS.map(({ id, x, z, ry }) => (
        <mesh
          key={id}
          ref={lintelRefs.current[GATE_LINTELS.findIndex(g => g.id === id)]}
          position={[x, WALL_H, z]}
          rotation={[0, ry, 0]}
        >
          <boxGeometry args={[14, 4, 2]} />
          <meshLambertMaterial color="#182d52" />
        </mesh>
      ))}
    </group>
  );
}
