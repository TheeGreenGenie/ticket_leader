import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useRegisterCollider } from './CollisionContext';

const FLOORS = [
  { id: 'field',  y: 0,  outerA: 118, outerB: 90,  innerA: 62,  innerB: 46,  color: '#3a3a3a' },
  { id: 'lower',  y: 18, outerA: 118, outerB: 90,  innerA: 98,  innerB: 74,  color: '#6a6055' },
  { id: 'club',   y: 21, outerA: 128, outerB: 98,  innerA: 118, innerB: 90,  color: '#7a7060' },
  { id: 'upper',  y: 33, outerA: 148, outerB: 114, innerA: 112, innerB: 86,  color: '#6a6055' },
];

function makeEllipseRingGeom(outerA, outerB, innerA, innerB, segments = 64) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const x = outerA * Math.cos(ang);
    const y = outerB * Math.sin(ang);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  for (let i = segments; i >= 0; i--) {
    const ang = (i / segments) * Math.PI * 2;
    hole.lineTo(innerA * Math.cos(ang), innerB * Math.sin(ang));
  }
  shape.holes.push(hole);
  const geom = new THREE.ShapeGeometry(shape, segments);
  geom.rotateX(-Math.PI / 2);
  return geom;
}

function FloorRing({ id, y, outerA, outerB, innerA, innerB, color }) {
  const meshRef = useRef();
  const register = useRegisterCollider();
  const geom = useMemo(
    () => makeEllipseRingGeom(outerA, outerB, innerA, innerB),
    [outerA, outerB, innerA, innerB]
  );

  useEffect(() => {
    if (meshRef.current) register(meshRef.current);
  }, []);

  return (
    <mesh ref={meshRef} geometry={geom} position={[0, y, 0]}>
      <meshLambertMaterial color={color} side={THREE.FrontSide} />
    </mesh>
  );
}

export function ConcourseFloors() {
  return (
    <>
      {FLOORS.map(f => <FloorRing key={f.id} {...f} />)}
    </>
  );
}
