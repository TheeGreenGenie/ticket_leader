import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';

export function CameraRig({ targetSeat, controlsRef }) {
  const { camera } = useThree();
  const prevTarget = useRef(null);

  useEffect(() => {
    if (!targetSeat) return;
    if (
      prevTarget.current &&
      prevTarget.current.x === targetSeat.x &&
      prevTarget.current.z === targetSeat.z
    ) return;
    prevTarget.current = targetSeat;

    // Camera hovers slightly above and behind the seat, looking at field center
    const camX = targetSeat.x * 0.82;
    const camY = targetSeat.y + 2.8;
    const camZ = targetSeat.z * 0.82;

    // Disable orbit controls during animation
    if (controlsRef?.current) controlsRef.current.enabled = false;

    gsap.to(camera.position, {
      x: camX, y: camY, z: camZ,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 5, 0); // look at field center
      },
      onComplete: () => {
        if (controlsRef?.current) controlsRef.current.enabled = true;
      },
    });
  }, [targetSeat, camera, controlsRef]);

  return null;
}

// Flies camera to an overhead position showing the full seat path
export function PathCameraRig({ pathWaypoints, controlsRef }) {
  const { camera } = useThree();
  const prevLen = useRef(0);

  useEffect(() => {
    if (!pathWaypoints || pathWaypoints.length === 0) return;
    if (pathWaypoints.length === prevLen.current) return;
    prevLen.current = pathWaypoints.length;

    // Bounding box of all waypoints
    const box = new THREE.Box3();
    pathWaypoints.forEach(p =>
      box.expandByPoint(new THREE.Vector3(p.x, p.y, p.z))
    );

    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const horizontalSpan = Math.max(size.x, size.z);

    // Camera height: enough to see the full path, always clears outer wall (~y=68)
    const camY = Math.max(center.y + horizontalSpan * 0.85, 82);
    // Shift toward field center so wall doesn't clip the view
    const camX = center.x * 0.3;
    const camZ = center.z * 0.3;

    if (controlsRef?.current) controlsRef.current.enabled = false;

    gsap.to(camera.position, {
      x: camX, y: camY, z: camZ,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(center.x, center.y, center.z);
      },
      onComplete: () => {
        if (controlsRef?.current) {
          controlsRef.current.target.copy(center);
          controlsRef.current.enabled = true;
        }
      },
    });
  }, [pathWaypoints, camera, controlsRef]);

  return null;
}
