import { STADIUM } from './stadiumMath';

// AT&T Stadium's iconic center-hung video board
// Real dimensions: 160ft wide x 72ft tall (48.8m x 22m), hung at ~27m
const BOARD_W  = 48;   // width (matches field width roughly)
const BOARD_H  = 20;   // height
const HANG_Y   = 32;   // bottom of board y (above lower concourse)
const MID_Y    = HANG_Y + BOARD_H / 2;

// The board has four faces (N, S, E, W) — simplified as two opposing rectangles
// matching real AT&T jumbotron which faces end zones
export function Jumbotron() {
  return (
    <group position={[0, 0, 0]}>
      {/* Suspension cables from roof ridge down to board corners */}
      {[[-BOARD_W / 2, -14], [BOARD_W / 2, -14], [-BOARD_W / 2, 14], [BOARD_W / 2, 14]].map(([x, z], i) => {
        const cableH = STADIUM.ROOF_HEIGHT - MID_Y - 2;
        return (
          <mesh key={i} position={[x, MID_Y + cableH / 2, z]}>
            <cylinderGeometry args={[0.08, 0.08, cableH, 4]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
        );
      })}

      {/* Main board housing (dark frame) */}
      <mesh position={[0, MID_Y, 0]}>
        <boxGeometry args={[BOARD_W + 2, BOARD_H + 2, 30]} />
        <meshLambertMaterial color="#222222" />
      </mesh>

      {/* North-facing screen (Cowboys end zone side) */}
      <mesh position={[0, MID_Y, -14]}>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
        <meshLambertMaterial color="#1a1a4a" emissive="#0a0a2a" emissiveIntensity={0.6} />
      </mesh>

      {/* South-facing screen (Visitors end zone side) */}
      <mesh position={[0, MID_Y, 14]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
        <meshLambertMaterial color="#1a1a4a" emissive="#0a0a2a" emissiveIntensity={0.6} />
      </mesh>

      {/* East-facing side panel */}
      <mesh position={[BOARD_W / 2 + 0.5, MID_Y, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[28, BOARD_H]} />
        <meshLambertMaterial color="#111144" emissive="#080822" emissiveIntensity={0.4} />
      </mesh>

      {/* West-facing side panel */}
      <mesh position={[-BOARD_W / 2 - 0.5, MID_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[28, BOARD_H]} />
        <meshLambertMaterial color="#111144" emissive="#080822" emissiveIntensity={0.4} />
      </mesh>

      {/* Glow light from board */}
      <pointLight position={[0, MID_Y, -14]} intensity={0.8} distance={80} color="#4466ff" />
      <pointLight position={[0, MID_Y,  14]} intensity={0.8} distance={80} color="#4466ff" />
    </group>
  );
}
