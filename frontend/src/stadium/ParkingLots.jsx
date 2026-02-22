import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

// ── Entry positions (world space, matching GatedOuterWall angles) ─────────
// angle=0 is East (+X), CCW. x=cos(a)*R, z=-sin(a)*R at wall face R≈115
const WALL_R = 118;
function entryPos(angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * WALL_R, z: -Math.sin(a) * WALL_R };
}

// Entry angles derived from GatedOuterWall GATE_CENTERS (converted to degrees)
// angle=0 East, CCW: North=90, West=180, South=270
export const ENTRIES = {
  A: entryPos(70),    // NE upper level — spawn inside
  B: entryPos(26),    // East upper
  C: entryPos(0),     // East mid
  D: entryPos(-26),   // East lower (334 deg)
  E: entryPos(-80),   // South right (280 deg)
  F: entryPos(-100),  // South left (260 deg)
  G: entryPos(-206),  // West lower (154 deg)
  H: entryPos(180),   // West mid
  J: entryPos(206),   // West upper (154 deg going CCW → 206)
  K: entryPos(100),   // North left (slightly west of north)
};

// Interior spawn points — just inside the wall facing inward
export const ENTRY_SPAWNS = Object.fromEntries(
  Object.entries(ENTRIES).map(([id, { x, z }]) => {
    // Inward direction from wall: normalize toward origin
    const dist = Math.sqrt(x * x + z * z);
    const inX = x - (x / dist) * 12;
    const inZ = z - (z / dist) * 12;
    // Yaw to face inward (toward field)
    const yaw = Math.atan2(x, z); // face toward 0,0
    return [id, { x: inX, z: inZ, y: 0, yaw }];
  })
);

// ── Parking lots from the map ─────────────────────────────────────────────
// The stadium exterior edge is ~183m long x 137m wide (half = 91.5 x 68.5)
// Parking lots extend outward. Map shows lots 1-15.
// Each lot is a rough rectangle: [cx, cz, width, depth, nearestEntry]
const LOTS = [
  { id: '1',  cx: -20,  cz: -210, w: 60,  d: 55, entry: 'K' },
  { id: '2',  cx:  45,  cz: -215, w: 60,  d: 50, entry: 'A' },
  { id: '3',  cx: 130,  cz: -210, w: 75,  d: 55, entry: 'B' },
  { id: '4',  cx: 220,  cz: -90,  w: 65,  d: 90, entry: 'C' },
  { id: '5',  cx: 210,  cz:  20,  w: 65,  d: 70, entry: 'D' },
  { id: '6',  cx: 110,  cz: 175,  w: 130, d: 50, entry: 'E' },
  { id: '7',  cx: -30,  cz: 210,  w: 90,  d: 60, entry: 'F' },
  { id: '10', cx: -160, cz: -155, w: 100, d: 80, entry: 'J' },
  { id: '11', cx: -120, cz: 230,  w: 100, d: 90, entry: 'G' },
  { id: '12', cx:  150, cz: 250,  w: 70,  d: 70, entry: 'E' },
  { id: '15', cx: -220, cz: -80,  w: 65,  d: 70, entry: 'H' },
];

// ── Fence segment ─────────────────────────────────────────────────────────
function FenceLine({ x1, z1, x2, z2 }) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const cx  = (x1 + x2) / 2;
  const cz  = (z1 + z2) / 2;
  const ang = Math.atan2(dz, dx);
  return (
    <mesh position={[cx, 1.5, cz]} rotation={[0, -ang, 0]}>
      <boxGeometry args={[len, 3, 0.3]} />
      <meshLambertMaterial color="#777766" transparent opacity={0.55} />
    </mesh>
  );
}

// ── Single lot ────────────────────────────────────────────────────────────
function ParkingLot({ id, cx, cz, w, d, onSpawnHere }) {
  const hw = w / 2, hd = d / 2;

  return (
    <group>
      {/* Ground plane — clickable to spawn ball at lot center */}
      <mesh
        position={[cx, 0.05, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSpawnHere?.({ x: cx, y: 0, z: cz }); }}
      >
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color="#2a2a2a" />
      </mesh>

      {/* Parking stripes */}
      {Array.from({ length: Math.floor(d / 8) }, (_, i) => (
        <mesh key={i} position={[cx, 0.08, cz - hd + 4 + i * 8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 4, 0.4]} />
          <meshLambertMaterial color="#555555" />
        </mesh>
      ))}

      {/* Fence — 4 sides */}
      <FenceLine x1={cx - hw} z1={cz - hd} x2={cx + hw} z2={cz - hd} />
      <FenceLine x1={cx - hw} z1={cz + hd} x2={cx + hw} z2={cz + hd} />
      <FenceLine x1={cx - hw} z1={cz - hd} x2={cx - hw} z2={cz + hd} />
      <FenceLine x1={cx + hw} z1={cz - hd} x2={cx + hw} z2={cz + hd} />

      {/* Lot label — click to start from this lot */}
      <Html position={[cx, 8, cz]} center>
        <div
          onClick={() => onSpawnHere?.({ x: cx, y: 0, z: cz })}
          style={{
            background: 'rgba(0,40,80,0.88)',
            color: '#aac8ff',
            fontFamily: 'sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: 5,
            border: '1px solid #004488',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 8px #00448844',
          }}
        >
          LOT {id} — Start here
        </div>
      </Html>
    </group>
  );
}

// ── Entry highlight beacon ────────────────────────────────────────────────
export function EntryBeacon({ entryId, pos, onEnter }) {
  const pulseRef = useRef(0);

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Glowing pillar */}
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 20, 12]} />
        <meshLambertMaterial color="#00aaff" transparent opacity={0.7} emissive="#0044ff" emissiveIntensity={0.8} />
      </mesh>

      {/* Pulsing ring at ground */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 24]} />
        <meshLambertMaterial color="#00aaff" transparent opacity={0.6} />
      </mesh>

      <pointLight position={[0, 12, 0]} intensity={3} distance={60} color="#0088ff" />

      {/* Clickable enter label */}
      <Html position={[0, 22, 0]} center>
        <div
          onClick={onEnter}
          style={{
            background: '#003594',
            border: '2px solid #00aaff',
            borderRadius: 8,
            color: 'white',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontSize: 14,
            padding: '6px 14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textAlign: 'center',
            boxShadow: '0 0 12px #00aaff88',
          }}
        >
          ENTRY {entryId}<br />
          <span style={{ fontSize: 10, fontWeight: 'normal', color: '#aac8ff' }}>
            Click to enter stadium
          </span>
        </div>
      </Html>
    </group>
  );
}

// ── Arrow path from lot to entry ──────────────────────────────────────────
function PathArrow({ fromX, fromZ, toX, toZ }) {
  const dx = toX - fromX, dz = toZ - fromZ;
  const len = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.max(3, Math.floor(len / 20));
  const ang = Math.atan2(dz, dx);

  return (
    <>
      {Array.from({ length: steps }, (_, i) => {
        const t = (i + 0.5) / steps;
        return (
          <mesh key={i} position={[fromX + dx * t, 0.15, fromZ + dz * t]} rotation={[0, -ang, 0]}>
            <boxGeometry args={[8, 0.1, 1]} />
            <meshLambertMaterial color="#00aaff" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
export function ParkingLots({ onEnterStadium, onSpawnAtLot }) {
  return (
    <group>
      {/* Outer ground plane (roads/surroundings) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[800, 800]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>

      {/* Lots — clickable to place ball */}
      {LOTS.map(lot => (
        <ParkingLot key={lot.id} {...lot} onSpawnHere={onSpawnAtLot} />
      ))}

      {/* Entry beacons — one per unique entry used by lots */}
      {[...new Set(LOTS.map(l => l.entry))].map(entryId => {
        const entryWorldPos = ENTRIES[entryId];
        if (!entryWorldPos) return null;
        const lotsForEntry = LOTS.filter(l => l.entry === entryId);
        return (
          <group key={entryId}>
            <EntryBeacon
              entryId={entryId}
              pos={entryWorldPos}
              onEnter={() => onEnterStadium(entryId)}
            />
            {/* Path arrows from each lot to this entry */}
            {lotsForEntry.map(lot => (
              <PathArrow
                key={lot.id}
                fromX={lot.cx}
                fromZ={lot.cz}
                toX={entryWorldPos.x}
                toZ={entryWorldPos.z}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
