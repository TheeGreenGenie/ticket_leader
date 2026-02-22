import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const ZOOM_SPEED   = 80;  // units/s
const ORBIT_YAW    = 1.2; // rad/s for arrow left/right
const ORBIT_PITCH  = 0.8; // rad/s for arrow up/down

// Keyboard controls for orbit camera: arrows rotate around target, optional Q/E zoom.
function OrbitKeyboard({
  controlsRef,
  enableZoom = true,
  minPhi = 0.05,
  maxPhi = Math.PI / 2.05,
}) {
  const { camera } = useThree();
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => { keys.current[e.code] = true; };
    const up   = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  useFrame((_, delta) => {
    // Q/E — dolly along look direction
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    if (enableZoom && keys.current['KeyQ']) camera.position.addScaledVector(fwd,  ZOOM_SPEED * delta);
    if (enableZoom && keys.current['KeyE']) camera.position.addScaledVector(fwd, -ZOOM_SPEED * delta);

    // Arrow keys — orbit camera around the OrbitControls target
    const ctrl = controlsRef?.current;
    const target = ctrl ? ctrl.target : new THREE.Vector3(0, 0, 0);

    const arrowL = keys.current['ArrowLeft'];
    const arrowR = keys.current['ArrowRight'];
    const arrowU = keys.current['ArrowUp'];
    const arrowD = keys.current['ArrowDown'];

    if (arrowL || arrowR || arrowU || arrowD) {
      // Express camera position relative to target in spherical coords
      const offset = new THREE.Vector3().subVectors(camera.position, target);
      const spherical = new THREE.Spherical().setFromVector3(offset);

      if (arrowL) spherical.theta -= ORBIT_YAW   * delta;
      if (arrowR) spherical.theta += ORBIT_YAW   * delta;
      if (arrowU) spherical.phi   -= ORBIT_PITCH * delta;
      if (arrowD) spherical.phi   += ORBIT_PITCH * delta;

      // Clamp phi to caller-provided range.
      spherical.phi = Math.max(minPhi, Math.min(maxPhi, spherical.phi));
      spherical.makeSafe();

      offset.setFromSpherical(spherical);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);

      // Keep OrbitControls in sync so damping/mouse picks up from correct state
      if (ctrl) ctrl.update();
    }
  });

  return null;
}

import { CollisionProvider }   from './CollisionContext';
import { StadiumLighting }     from './StadiumLighting';
import { FootballField }       from './FootballField';
import { StadiumShell }        from './StadiumShell';
import { GatedOuterWall }      from './GatedOuterWall';
import { ConcourseFloors }     from './ConcourseFloors';
import { StaircaseTowers }     from './StaircaseTowers';
import { GateLabels }          from './GateLabels';
import { SeatingTiers }        from './SeatingTiers';
import { RoofStructure }       from './RoofStructure';
import { Jumbotron }           from './Jumbotron';
import { ParkingLots }         from './ParkingLots';
import { WalkthroughControls } from './WalkthroughControls';
import { CameraRig, PathCameraRig } from './CameraRig';
import { SeatPath }           from './SeatPath';

// Inner component that can use useFrame to poll floorYRef → onFloorChange
function FloorPoller({ floorYRef, onFloorChange }) {
  const lastReported = useRef(null);
  useFrame(() => {
    if (!floorYRef || floorYRef.current == null) return;
    const v = floorYRef.current;
    if (v !== lastReported.current) {
      lastReported.current = v;
      onFloorChange?.(v);
    }
  });
  return null;
}

// Keep OrbitControls pivot locked to the moving ball in parking mode.
function ParkingBallTarget({ active, controlsRef, ballPosRef }) {
  useFrame(() => {
    if (!active) return;
    const ctrl = controlsRef?.current;
    const ballPos = ballPosRef?.current;
    if (!ctrl || !ballPos) return;
    ctrl.target.copy(ballPos);
    ctrl.update();
  });
  return null;
}

export default function StadiumScene({
  mode,
  targetSeat,
  onLookupReady,
  spawnPoint,
  onEnterStadium,
  onSpawnAtLot,
  onFloorChange,
  onSectionClick,
  playerFloorY,
  highlight,
  pathWaypoints,
  ballPosRef,
}) {
  const controlsRef = useRef();
  const floorYRef   = useRef(0); // written by WalkthroughControls every frame

  const isWalk    = mode === 'walkthrough';
  const isParking = mode === 'parking';
  const isOrbit   = mode === 'orbit';

  // Parking mode uses a wide exterior camera
  const initCam = isParking
    ? { position: [0, 280, 350], fov: 55, near: 1, far: 3000 }
    : { position: [200, 120, 200], fov: 60, near: 0.5, far: 2000 };

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
      camera={initCam}
      shadows={false}
      style={{ background: isParking ? '#0e1a0e' : '#1a1a2e', width: '100%', height: '100%' }}
    >
      <CollisionProvider>
        <Suspense fallback={null}>
          <StadiumLighting />
          <FootballField />
          <StadiumShell />
          <GatedOuterWall />
          <ConcourseFloors />
          <StaircaseTowers />
          <GateLabels />
          <SeatingTiers onLookupReady={onLookupReady} playerFloorY={playerFloorY} highlight={highlight} onSectionClick={onSectionClick} />
          <RoofStructure />
          <Jumbotron />

          {/* Parking lots — only rendered in parking mode */}
          {isParking && (
            <ParkingLots
              onEnterStadium={onEnterStadium}
              onSpawnAtLot={onSpawnAtLot}
            />
          )}

          <CameraRig targetSeat={targetSeat} controlsRef={controlsRef} />
          <PathCameraRig pathWaypoints={pathWaypoints} controlsRef={controlsRef} />

          {pathWaypoints && pathWaypoints.length > 1 && (
            <SeatPath waypoints={pathWaypoints} />
          )}

          {/* Ball active in walkthrough AND parking modes */}
          <WalkthroughControls
            active={isWalk || isParking}
            parking={isParking}
            spawnPoint={spawnPoint}
            floorYRef={floorYRef}
            ballPosRef={ballPosRef}
          />

          {/* Poll floorYRef and bubble up to parent for seat transparency */}
          <FloorPoller floorYRef={floorYRef} onFloorChange={onFloorChange} />

          {isOrbit && (
            <>
              <OrbitControls
                ref={controlsRef}
                minDistance={30}
                maxDistance={700}
                maxPolarAngle={Math.PI / 2.05}
                enableDamping
                dampingFactor={0.08}
                enableKeys={false}
                enableZoom={false}
              />
              <OrbitKeyboard controlsRef={controlsRef} />
            </>
          )}

          {/* Parking: keyboard arrow orbit; Q/E handles zoom via WalkthroughControls */}
          {isParking && (
            <>
              <OrbitControls
                ref={controlsRef}
                minDistance={12}
                maxDistance={1200}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                enableDamping
                dampingFactor={0.08}
                enableKeys={false}
                enablePan={false}
                enableZoom={false}
                mouseButtons={{
                  LEFT:   null,
                  MIDDLE: null,
                  RIGHT:  null,
                }}
              />
              <OrbitKeyboard
                controlsRef={controlsRef}
                enableZoom={false}
                minPhi={0.05}
                maxPhi={Math.PI - 0.05}
              />
              <ParkingBallTarget
                active={isParking}
                controlsRef={controlsRef}
                ballPosRef={ballPosRef}
              />
            </>
          )}
        </Suspense>
      </CollisionProvider>
    </Canvas>
  );
}
