import { useMemo } from 'react';
import { buildBowlGeometry, STADIUM } from './stadiumMath';

export function StadiumShell() {
  const bowlGeom = useMemo(() => buildBowlGeometry(), []);

  return (
    <group>
      {/* Main concrete bowl — wall + concourse rings now in GatedOuterWall + ConcourseFloors */}
      <mesh geometry={bowlGeom} position={[0, STADIUM.LOWER_TIER_BASE, 0]}>
        <meshLambertMaterial color="#2a3f6a" side={2} />
      </mesh>
    </group>
  );
}
