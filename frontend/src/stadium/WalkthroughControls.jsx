import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCollisionContext } from './CollisionContext';

// ── Constants ────────────────────────────────────────────────────────────────
const SPEED           = 18;    // units/s horizontal
const VERT_SPEED      = 12;    // units/s for O/L float
const ZOOM_SPEED      = 80;    // units/s for Q/E zoom
const BALL_R          = 0.9;   // visual + physical radius
const MIN_FLOOR_Y     = 0;     // field level — hard floor
const SNAP_SPEED      = 3;     // slow vertical snap
const TRANSITION_TIME = 2.2;   // seconds for stair level change

const BOUND_R = 113;           // hard radius cap — ball can't exit this (walkthrough)

// Camera follow settings (walkthrough)
const CAM_DIST      = 14;
const CAM_SMOOTH    = 6;
const YAW_SPEED     = 1.4;
const PITCH_SPEED   = 0.8;
const MOVE_ZOOM_MULT = 0.82; // walkthrough: slightly tighter while moving

// Parking overhead camera settings
const PARK_CAM_HEIGHT  = 120;  // fixed height above ball
const PARK_CAM_SMOOTH  = 4;    // how fast camera re-centers on ball
const PARK_MOVE_ZOOM_DIST = 18; // parking: close to 3rd-person feel while moving
const PARK_MOVE_ZOOM_SMOOTH = 9;

// Mouse drag state (module-level so it persists across re-renders)
let isDragging = false;
let dragYaw    = Math.PI;   // start facing south
let dragPitch  = 0.35;
let lastMouseX = 0;
let lastMouseY = 0;

const _down          = new THREE.Vector3(0, -1, 0);
const _rayCasterDown = new THREE.Raycaster();

const _ballGeo = new THREE.SphereGeometry(BALL_R, 14, 10);
const _ballMat = new THREE.MeshLambertMaterial({ color: '#e63946' });

export function WalkthroughControls({ active, spawnPoint, floorYRef, ballPosRef, parking }) {
  const { camera, scene } = useThree();
  const ctx = useCollisionContext();

  const keys            = useRef({});
  const ballPos         = useRef(new THREE.Vector3(-18, MIN_FLOOR_Y + BALL_R, -100));
  const floorY          = useRef(MIN_FLOOR_Y);
  const targetFloorY    = useRef(null);
  const transitioning   = useRef(false);
  const transitionTimer = useRef(0);
  const fromFloorY      = useRef(MIN_FLOOR_Y);
  const camTarget       = useRef(new THREE.Vector3());
  const ballMeshRef     = useRef(null);
  // When true the ball is floating freely (O/L held); floor-snap is suspended
  const floating        = useRef(false);
  // In parking mode: snap camera above ball only right after a spawn, then release
  const snapCam         = useRef(false);

  // ── Ball mesh ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const mesh = new THREE.Mesh(_ballGeo, _ballMat);
    mesh.position.copy(ballPos.current);
    scene.add(mesh);
    ballMeshRef.current = mesh;
    return () => { scene.remove(mesh); };
  }, [scene]);

  // ── Reset when walk mode activates (no explicit spawn) ────────────────────
  useEffect(() => {
    if (!active || spawnPoint) return;
    ballPos.current.set(-18, MIN_FLOOR_Y + BALL_R, -100);
    floorY.current        = MIN_FLOOR_Y;
    transitioning.current = false;
    targetFloorY.current  = null;
    floating.current      = false;
    dragYaw   = Math.PI;
    dragPitch = 0.35;
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e) => { keys.current[e.code] = true; };
    const onKeyUp   = (e) => { keys.current[e.code] = false; };

    const onMouseDown = (e) => {
      if (e.button === 0 && !parking) {
        isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY;
      }
    };
    const onMouseUp   = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      dragYaw   -= (e.clientX - lastMouseX) * 0.005;
      dragPitch -= (e.clientY - lastMouseY) * 0.004;
      dragPitch  = Math.max(0.05, Math.min(1.1, dragPitch));
      lastMouseX = e.clientX; lastMouseY = e.clientY;
    };
    const onCtxMenu = (e) => e.preventDefault();

    window.addEventListener('keydown',     onKeyDown);
    window.addEventListener('keyup',       onKeyUp);
    window.addEventListener('mousedown',   onMouseDown);
    window.addEventListener('mouseup',     onMouseUp);
    window.addEventListener('mousemove',   onMouseMove);
    window.addEventListener('contextmenu', onCtxMenu);
    return () => {
      window.removeEventListener('keydown',     onKeyDown);
      window.removeEventListener('keyup',       onKeyUp);
      window.removeEventListener('mousedown',   onMouseDown);
      window.removeEventListener('mouseup',     onMouseUp);
      window.removeEventListener('mousemove',   onMouseMove);
      window.removeEventListener('contextmenu', onCtxMenu);
      keys.current = {};
      isDragging   = false;
    };
  }, [active, parking]);

  // ── Teleport on spawnPoint change ─────────────────────────────────────────
  useEffect(() => {
    const sp = spawnPoint;
    if (!sp) return;
    const spawnX = sp.x ?? -18;
    const spawnZ = sp.z ?? -100;
    const spawnY = sp.y ?? MIN_FLOOR_Y;
    ballPos.current.set(spawnX, spawnY + BALL_R, spawnZ);
    floorY.current        = spawnY;
    transitioning.current = false;
    targetFloorY.current  = null;
    floating.current      = false;
    snapCam.current       = true; // trigger one-shot camera snap above new ball position
    if (sp.yaw != null) dragYaw = sp.yaw;
    dragPitch = 0.35;
  }, [spawnPoint]);

  // ── Per-frame ──────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!active) return;
    const colliders  = ctx?.meshesRef.current  ?? [];
    const stairZones = ctx?.stairZonesRef.current ?? [];
    const ball       = ballMeshRef.current;
    if (!ball) return;

    // ── Q / E — zoom camera in / out (all modes) ──────────────────────────
    {
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      if (keys.current['KeyQ']) camera.position.addScaledVector(fwd,  ZOOM_SPEED * delta);
      if (keys.current['KeyE']) camera.position.addScaledVector(fwd, -ZOOM_SPEED * delta);
    }

    // ── O / L — float ball up / down; Space — drop to floor ───────────────
    const wantUp   = keys.current['KeyO'];
    const wantDown = keys.current['KeyL'];
    const wantDrop = keys.current['Space'];

    if (wantUp || wantDown) {
      floating.current = true;
      transitioning.current = false; // cancel stair transition
      targetFloorY.current  = null;

      const dy = (wantUp ? 1 : -1) * VERT_SPEED * delta;
      ballPos.current.y += dy;

      // Hard clamp: never below ground
      if (ballPos.current.y < MIN_FLOOR_Y + BALL_R) {
        ballPos.current.y = MIN_FLOOR_Y + BALL_R;
        floorY.current    = MIN_FLOOR_Y;
        floating.current  = false;
      }
    } else if (wantDrop) {
      // Raycast straight down and snap to nearest floor
      floating.current = false;
      const castOrigin = new THREE.Vector3(
        ballPos.current.x, ballPos.current.y + 2, ballPos.current.z
      );
      _rayCasterDown.set(castOrigin, _down);
      _rayCasterDown.far = 999;
      const hits = _rayCasterDown.intersectObjects(colliders, false);
      if (hits.length > 0) {
        const hitY = hits[0].point.y;
        floorY.current    = Math.max(hitY, MIN_FLOOR_Y);
        ballPos.current.y = floorY.current + BALL_R;
      } else {
        floorY.current    = MIN_FLOOR_Y;
        ballPos.current.y = MIN_FLOOR_Y + BALL_R;
      }
      transitioning.current = false;
      targetFloorY.current  = null;
    }

    // ── Stair / floor logic (only when not floating) ───────────────────────
    if (!floating.current) {
      // 1. STAIR ZONE CHECK
      if (!transitioning.current) {
        const footPos = new THREE.Vector3(ballPos.current.x, floorY.current, ballPos.current.z);
        for (const zone of stairZones) {
          if (
            zone.box.containsPoint(footPos) &&
            Math.abs(floorY.current - zone.fromY) < 2.5
          ) {
            transitioning.current   = true;
            transitionTimer.current = 0;
            fromFloorY.current      = floorY.current;
            targetFloorY.current    = zone.toY;
            break;
          }
        }
      }

      // 2. FLOOR TRANSITION
      if (transitioning.current && targetFloorY.current !== null) {
        transitionTimer.current += delta;
        const t     = Math.min(transitionTimer.current / TRANSITION_TIME, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        ballPos.current.y = (fromFloorY.current + BALL_R) +
                            (targetFloorY.current - fromFloorY.current) * eased;
        if (t >= 1) {
          floorY.current        = targetFloorY.current;
          targetFloorY.current  = null;
          transitioning.current = false;
        }
      } else {
        // 3. FLOOR DETECTION — raycast down
        const castOrigin = new THREE.Vector3(
          ballPos.current.x, ballPos.current.y + 2, ballPos.current.z
        );
        _rayCasterDown.set(castOrigin, _down);
        _rayCasterDown.far = BALL_R + 6;
        const floorHits = _rayCasterDown.intersectObjects(colliders, false);
        if (floorHits.length > 0) {
          const hitY = floorHits[0].point.y;
          if (hitY >= MIN_FLOOR_Y - 0.5) floorY.current = hitY;
        }

        // Slow vertical snap
        const targetBallY = floorY.current + BALL_R;
        ballPos.current.y += (targetBallY - ballPos.current.y) *
                             Math.min(SNAP_SPEED * delta, 1);

        // Hard floor clamp
        if (ballPos.current.y < MIN_FLOOR_Y + BALL_R) {
          ballPos.current.y = MIN_FLOOR_Y + BALL_R;
          floorY.current    = MIN_FLOOR_Y;
        }
      }
    }

    // ── Arrow keys — rotate camera yaw/pitch (walkthrough only) ───────────
    if (!parking) {
      if (keys.current['ArrowLeft'])  dragYaw   += YAW_SPEED   * delta;
      if (keys.current['ArrowRight']) dragYaw   -= YAW_SPEED   * delta;
      if (keys.current['ArrowUp'])    dragPitch  = Math.min(dragPitch + PITCH_SPEED * delta, 1.1);
      if (keys.current['ArrowDown'])  dragPitch  = Math.max(dragPitch - PITCH_SPEED * delta, 0.05);
    }

    // ── WASD — move ball horizontally ─────────────────────────────────────
    let fwdX = -Math.sin(dragYaw);
    let fwdZ = -Math.cos(dragYaw);
    let rgtX =  Math.cos(dragYaw);
    let rgtZ = -Math.sin(dragYaw);

    // In parking mode, movement should follow the current camera heading.
    if (parking) {
      const camFwd = new THREE.Vector3();
      camera.getWorldDirection(camFwd);
      camFwd.y = 0;
      if (camFwd.lengthSq() > 1e-6) {
        camFwd.normalize();
        fwdX = camFwd.x;
        fwdZ = camFwd.z;
        rgtX = -camFwd.z;
        rgtZ = camFwd.x;
      }
    }

    let moveX = 0, moveZ = 0;
    if (keys.current['KeyW']) { moveX += fwdX; moveZ += fwdZ; }
    if (keys.current['KeyS']) { moveX -= fwdX; moveZ -= fwdZ; }
    if (keys.current['KeyA']) { moveX -= rgtX; moveZ -= rgtZ; }
    if (keys.current['KeyD']) { moveX += rgtX; moveZ += rgtZ; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      ballPos.current.x += (moveX / len) * SPEED * delta;
      ballPos.current.z += (moveZ / len) * SPEED * delta;
    }

    // ── Hard radial bound ─────────────────────────────────────────────────
    const boundR = parking ? 600 : BOUND_R;
    const distSq = ballPos.current.x * ballPos.current.x +
                   ballPos.current.z * ballPos.current.z;
    if (distSq > boundR * boundR) {
      const dist = Math.sqrt(distSq);
      ballPos.current.x = (ballPos.current.x / dist) * boundR;
      ballPos.current.z = (ballPos.current.z / dist) * boundR;
    }

    // ── Publish refs ──────────────────────────────────────────────────────
    if (floorYRef)  floorYRef.current = floorY.current;
    if (ballPosRef) ballPosRef.current.copy(ballPos.current);

    // ── Update ball mesh ──────────────────────────────────────────────────
    ball.position.copy(ballPos.current);

    // ── Camera ────────────────────────────────────────────────────────────
    if (parking) {
      // Only snap overhead after an explicit spawn (lot click / entry button).
      // Once converged, release so OrbitControls can orbit freely.
      if (snapCam.current) {
        const idealX = ballPos.current.x;
        const idealY = ballPos.current.y + PARK_CAM_HEIGHT;
        const idealZ = ballPos.current.z;
        const t = Math.min(PARK_CAM_SMOOTH * delta, 1);
        camera.position.lerp(new THREE.Vector3(idealX, idealY, idealZ), t);
        camera.lookAt(ballPos.current.x, ballPos.current.y, ballPos.current.z);
        // Stop snapping once close enough
        if (camera.position.distanceTo(new THREE.Vector3(idealX, idealY, idealZ)) < 2) {
          snapCam.current = false;
        }
      }

      // Auto-zoom only while moving in parking mode.
      if (len > 0) {
        // Movement should take priority over one-shot spawn snap.
        if (snapCam.current) snapCam.current = false;
        const offset = new THREE.Vector3().subVectors(camera.position, ballPos.current);
        const dist = offset.length();
        const t = Math.min(PARK_MOVE_ZOOM_SMOOTH * delta, 1);
        const nextDist = THREE.MathUtils.lerp(dist, PARK_MOVE_ZOOM_DIST, t);
        offset.setLength(nextDist);
        camera.position.copy(ballPos.current).add(offset);
      }
    } else {
      // Third-person follow
      const sinP = Math.sin(dragPitch);
      const cosP = Math.cos(dragPitch);
      const camDist = len > 0 ? CAM_DIST * MOVE_ZOOM_MULT : CAM_DIST;
      const idealCamX = ballPos.current.x + Math.sin(dragYaw) * camDist * cosP;
      const idealCamY = ballPos.current.y + sinP * camDist;
      const idealCamZ = ballPos.current.z + Math.cos(dragYaw) * camDist * cosP;
      camera.position.lerp(
        new THREE.Vector3(idealCamX, idealCamY, idealCamZ),
        Math.min(CAM_SMOOTH * delta, 1)
      );
      camTarget.current.lerp(ballPos.current, Math.min(CAM_SMOOTH * delta, 1));
      camera.lookAt(camTarget.current);
    }
  });

  return null;
}
