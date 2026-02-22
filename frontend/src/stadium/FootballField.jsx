import { useMemo } from 'react';
import * as THREE from 'three';
import { buildFieldTexture, STADIUM } from './stadiumMath';

export function FootballField() {
  const texture = useMemo(() => buildFieldTexture(), []);

  return (
    <group>
      {/* Field surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow={false}>
        <planeGeometry args={[STADIUM.FIELD_LENGTH, STADIUM.FIELD_WIDTH]} />
        <meshLambertMaterial map={texture} />
      </mesh>

      {/* Concrete apron around field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[STADIUM.FIELD_LENGTH + 24, STADIUM.FIELD_WIDTH + 20]} />
        <meshLambertMaterial color="#4a4a55" />
      </mesh>

      {/* Ground plane (full stadium footprint) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[400, 320]} />
        <meshLambertMaterial color="#222228" />
      </mesh>
    </group>
  );
}
