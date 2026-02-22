import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useRegisterCollider, useRegisterStairZones } from './CollisionContext';

// Four corner towers — between gate openings
const TOWERS = [
  { id: 'ne', cx:  80, cz: -55, ry: -Math.PI / 4 },
  { id: 'nw', cx: -80, cz: -55, ry:  Math.PI / 4 },
  { id: 'se', cx:  80, cz:  55, ry: -3 * Math.PI / 4 },
  { id: 'sw', cx: -80, cz:  55, ry:  3 * Math.PI / 4 },
];

const TOWER_W = 14;   // wider so both lanes fit side-by-side
const TOWER_D = 12;   // depth (ramp run)
const TOWER_H = 40;   // tall enough to clear upper concourse y=33
const WALL_T  = 0.5;  // wall thickness
const LANE_W  = 5.5;  // width of each ramp lane (up-lane and down-lane)

// Floor levels
const LEVELS = [0, 18, 21, 33];

// Each consecutive floor pair gets a ramp
const FLOOR_PAIRS = [[0, 18], [18, 21], [21, 33]];

// Stair trigger zones for one tower.
// UP lane  (-X half): ball enters at fromY, rises to toY
// DOWN lane (+X half): ball enters at toY, descends to fromY
function buildStairZones(cx, cz) {
  const zones = [];
  const hw = TOWER_W / 2;
  const hd = TOWER_D / 2;

  FLOOR_PAIRS.forEach(([lo, hi]) => {
    // UP side — enter at 'lo' level, exit at 'hi'
    zones.push({
      box: new THREE.Box3(
        new THREE.Vector3(cx - hw,       lo - 0.5, cz - hd),
        new THREE.Vector3(cx,             lo + 3.0, cz + hd)
      ),
      fromY: lo,
      toY:   hi,
    });
    // DOWN side — enter at 'hi' level, exit at 'lo'
    zones.push({
      box: new THREE.Box3(
        new THREE.Vector3(cx,             hi - 0.5, cz - hd),
        new THREE.Vector3(cx + hw,        hi + 3.0, cz + hd)
      ),
      fromY: hi,
      toY:   lo,
    });
  });
  return zones;
}

// ── Sub-component: a single registered box mesh ───────────────────────────────
function ColMesh({ meshRef, position, args, register, color = '#2a4070' }) {
  useEffect(() => {
    if (meshRef.current) register(meshRef.current);
  }, []);
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

// ── Tower component ───────────────────────────────────────────────────────────
function Tower({ cx, cz, ry }) {
  const register      = useRegisterCollider();
  const registerZones = useRegisterStairZones();

  // We need refs for each registered collision mesh.
  // Count: 2 side walls + 1 back wall + 1 center divider + 4 floor landings = 8
  const refs = useRef(Array.from({ length: 8 }, () => ({ current: null })));

  useEffect(() => {
    registerZones(buildStairZones(cx, cz));
  }, []);

  const hw = TOWER_W / 2;
  const hd = TOWER_D / 2;

  return (
    <group position={[cx, 0, cz]} rotation={[0, ry, 0]}>

      {/* ── Perimeter walls ─────────────────────────────────────────────── */}
      {/* Left wall (full height, no opening — solid side) */}
      <ColMesh
        meshRef={refs.current[0]}
        position={[-hw, TOWER_H / 2, 0]}
        args={[WALL_T, TOWER_H, TOWER_D]}
        register={register}
      />
      {/* Right wall */}
      <ColMesh
        meshRef={refs.current[1]}
        position={[hw, TOWER_H / 2, 0]}
        args={[WALL_T, TOWER_H, TOWER_D]}
        register={register}
      />
      {/* Back wall */}
      <ColMesh
        meshRef={refs.current[2]}
        position={[0, TOWER_H / 2, -hd]}
        args={[TOWER_W, TOWER_H, WALL_T]}
        register={register}
      />
      {/* Center divider — separates UP lane (−X) from DOWN lane (+X) */}
      <ColMesh
        meshRef={refs.current[3]}
        position={[0, TOWER_H / 2, 0]}
        args={[WALL_T, TOWER_H, TOWER_D]}
        register={register}
        color="#1e3460"
      />

      {/* Front face: open doorways at each level on both lanes.
          We render small walls above/between each doorway opening (4 tall x full width).
          Doorway height = 4m, doorway width = LANE_W each side. */}
      {LEVELS.map((y) => (
        <group key={y}>
          {/* Left-lane door header (above door opening) */}
          <mesh position={[-hw / 2, y + 5, hd]}>
            <boxGeometry args={[LANE_W, 2, WALL_T]} />
            <meshLambertMaterial color="#2a4070" />
          </mesh>
          {/* Right-lane door header */}
          <mesh position={[hw / 2, y + 5, hd]}>
            <boxGeometry args={[LANE_W, 2, WALL_T]} />
            <meshLambertMaterial color="#2a4070" />
          </mesh>
        </group>
      ))}

      {/* ── Floor landings at each level (walkable surfaces) ────────────── */}
      {LEVELS.map((y, i) => (
        <ColMesh
          key={i}
          meshRef={refs.current[4 + i]}
          position={[0, y + 0.15, 0]}
          args={[TOWER_W - WALL_T * 2, 0.3, TOWER_D - WALL_T * 2]}
          register={register}
          color="#243870"
        />
      ))}

      {/* ── Ramp slabs ──────────────────────────────────────────────────── */}
      {/* UP lane (−X half): rises from lo to hi */}
      {FLOOR_PAIRS.map(([lo, hi], i) => {
        const rise = hi - lo;
        const run  = TOWER_D - 1;
        const ang  = Math.atan2(rise, run);
        const slabLen = Math.sqrt(rise * rise + run * run);
        const midY = (lo + hi) / 2;
        return (
          <mesh key={`up-${i}`} position={[-hw / 2, midY, 0]} rotation={[ang, 0, 0]}>
            <boxGeometry args={[LANE_W - WALL_T, 0.3, slabLen]} />
            <meshLambertMaterial color="#2e4880" />
          </mesh>
        );
      })}
      {/* DOWN lane (+X half): descends from hi to lo — same slab, mirrored */}
      {FLOOR_PAIRS.map(([lo, hi], i) => {
        const rise = hi - lo;
        const run  = TOWER_D - 1;
        const ang  = -Math.atan2(rise, run); // negative angle = downward slope
        const slabLen = Math.sqrt(rise * rise + run * run);
        const midY = (lo + hi) / 2;
        return (
          <mesh key={`dn-${i}`} position={[hw / 2, midY, 0]} rotation={[ang, 0, 0]}>
            <boxGeometry args={[LANE_W - WALL_T, 0.3, slabLen]} />
            <meshLambertMaterial color="#1c3258" />
          </mesh>
        );
      })}

      {/* ── Roof cap + label ─────────────────────────────────────────────── */}
      <mesh position={[0, TOWER_H, 0]}>
        <boxGeometry args={[TOWER_W, 0.4, TOWER_D]} />
        <meshLambertMaterial color="#1a2a50" />
      </mesh>
      <mesh position={[0, TOWER_H + 1.5, 0]}>
        <boxGeometry args={[10, 2, 0.2]} />
        <meshLambertMaterial color="#0044cc" />
      </mesh>
    </group>
  );
}

export function StaircaseTowers() {
  return (
    <>
      {TOWERS.map(t => <Tower key={t.id} {...t} />)}
    </>
  );
}
