import { Html } from '@react-three/drei';

const WALL_R = 112;

// Gate angles match GatedOuterWall.jsx GATE_CENTERS
// angle=0 is East (+X), CCW. World Z = -sin(angle) * R
const GATES = [
  { id: 'K', label: 'ENTRY K', angle: Math.PI / 2 + 0.18 },
  { id: 'F', label: 'ENTRY F', angle: 3 * Math.PI / 2 - 0.18 },
  { id: 'E', label: 'ENTRY E', angle: 3 * Math.PI / 2 + 0.18 },
  { id: 'B', label: 'ENTRY B', angle: 0.45 },
  { id: 'C', label: 'ENTRY C', angle: 0.0 },
  { id: 'D', label: 'ENTRY D', angle: -0.45 + Math.PI * 2 },
  { id: 'J', label: 'ENTRY J', angle: Math.PI - 0.45 },
  { id: 'H', label: 'ENTRY H', angle: Math.PI },
  { id: 'G', label: 'ENTRY G', angle: Math.PI + 0.45 },
].map(g => ({
  ...g,
  x: Math.cos(g.angle) * WALL_R,
  y: 16,
  z: -Math.sin(g.angle) * WALL_R,
}));

export function GateLabels() {
  return (
    <>
      {GATES.map(({ id, label, x, y, z }) => (
        <Html key={id} position={[x, y, z]} center occlude>
          <div style={{
            background: 'rgba(0,10,50,0.90)',
            border: '2px solid #4488ff',
            borderRadius: 8,
            padding: '5px 14px',
            color: 'white',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontSize: 16,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {label}
          </div>
        </Html>
      ))}
    </>
  );
}
