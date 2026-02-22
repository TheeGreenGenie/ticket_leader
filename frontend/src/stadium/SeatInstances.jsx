import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const _dummy   = new THREE.Object3D();
const _colBase = new THREE.Color();
const _colSec  = new THREE.Color('#ffaa00'); // section highlight — amber
const _colSeat = new THREE.Color('#ffff00'); // specific seat highlight — yellow

export function SeatInstances({ positions, meta, color, transparent, highlight, onSectionClick, tierId }) {
  // highlight: { section, row, seat } | null
  const meshRef = useRef();
  const count   = meta.length;

  const geom = useMemo(() => {
    const g = new THREE.BoxGeometry(0.46, 0.72, 0.42);
    g.translate(0, 0.36, 0);
    return g;
  }, []);

  const mat = useMemo(
    () => new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
      vertexColors: false,
    }),
    [color]
  );

  // Fade when player is on this level
  useEffect(() => {
    mat.opacity = transparent ? 0.5 : 1.0;
    mat.needsUpdate = true;
  }, [transparent, mat]);

  // Set matrices (only on mount / data change)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      _dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      _dummy.rotation.set(meta[i].pitch, meta[i].yaw, 0, 'YXZ');
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, positions, meta]);

  // Per-instance color for section / seat highlight
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    _colBase.set(color);

    const hl = highlight; // { section, row, seat, sectionOnly }

    for (let i = 0; i < count; i++) {
      const m = meta[i];

      if (hl && m.section === hl.section) {
        if (!hl.sectionOnly && m.row === hl.row && m.seat === hl.seat) {
          // Exact seat — bright yellow
          mesh.setColorAt(i, _colSeat);
        } else {
          // Same section — amber
          mesh.setColorAt(i, _colSec);
        }
      } else {
        // Dimmed — darken non-highlighted seats when something is highlighted
        if (hl) {
          mesh.setColorAt(i, _colBase.clone().multiplyScalar(0.35));
        } else {
          mesh.setColorAt(i, _colBase);
        }
      }
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [highlight, count, meta, color]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geom, mat, count]}
      frustumCulled={false}
      onClick={(e) => {
        e.stopPropagation();
        if (onSectionClick && e.instanceId != null) {
          const m = meta[e.instanceId];
          if (m) onSectionClick({ tierId, section: m.section });
        }
      }}
    />
  );
}
