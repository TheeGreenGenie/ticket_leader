import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VERT_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_SHADER = `
  uniform float uTime;
  uniform vec3  uColor;
  varying vec2  vUv;

  void main() {
    float freq  = 8.0;
    float speed = 0.6;
    float phase = vUv.x * freq - uTime * speed;
    float dash  = smoothstep(0.3, 0.5, fract(phase))
                - smoothstep(0.7, 0.9, fract(phase));
    float alpha = 0.55 + dash * 0.45;
    gl_FragColor = vec4(uColor * (0.7 + dash * 0.8), alpha);
  }
`;

export function SeatPath({ waypoints }) {
  const materialRef = useRef();

  const curve = useMemo(() => {
    if (!waypoints || waypoints.length < 2) return null;
    const pts = waypoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }, [waypoints]);

  const geometry = useMemo(() => {
    if (!curve) return null;
    const segments = Math.max(64, (waypoints?.length ?? 0) * 12);
    return new THREE.TubeGeometry(curve, segments, 0.35, 8, false);
  }, [curve, waypoints]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   VERT_SHADER,
    fragmentShader: FRAG_SHADER,
    uniforms: {
      uTime:  { value: 0 },
      uColor: { value: new THREE.Color('#00ccff') },
    },
    transparent: true,
    depthWrite:  false,
    depthTest:   false,
    side:        THREE.DoubleSide,
  }), []);

  useFrame((_, delta) => {
    if (material?.uniforms?.uTime) {
      material.uniforms.uTime.value += delta;
    }
  });

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={10}
    />
  );
}
