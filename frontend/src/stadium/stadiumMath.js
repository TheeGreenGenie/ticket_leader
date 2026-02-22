import * as THREE from 'three';

// ── Real AT&T Stadium dimensions (meters) ─────────────────────────────────
export const STADIUM = {
  EXTERIOR_LENGTH: 365.76,
  EXTERIOR_WIDTH:  274.32,
  FIELD_LENGTH:    109.7,
  FIELD_WIDTH:     48.8,
  FIELD_ELEVATION: 0,
  LOWER_TIER_BASE: 3,
  LOWER_TIER_TOP:  18,
  CLUB_TIER_BASE:  21,
  CLUB_TIER_TOP:   30,
  UPPER_TIER_BASE: 33,
  UPPER_TIER_TOP:  58,
  ROOF_HEIGHT:     89,
};

// ── Tier configurations ────────────────────────────────────────────────────
export const TIER_CONFIGS = [
  {
    id: 'lower',
    label: 'L',
    sectionCount: 54,
    rowsPerSection: 30,
    maxSeatsPerRow: 50,
    yBase: STADIUM.LOWER_TIER_BASE,
    yTop:  STADIUM.LOWER_TIER_TOP,
    innerA: 62, innerB: 46,   // ellipse semi-axes at field edge
    outerA: 98, outerB: 74,   // ellipse semi-axes at back of tier
    tiltAngle: 0.50,
    color: '#003594',
  },
  {
    id: 'club',
    label: 'C',
    sectionCount: 22,
    rowsPerSection: 20,
    maxSeatsPerRow: 22,
    yBase: STADIUM.CLUB_TIER_BASE,
    yTop:  STADIUM.CLUB_TIER_TOP,
    innerA: 100, innerB: 76,
    outerA: 118, outerB: 90,
    tiltAngle: 0.45,
    color: '#7a8b8b',
  },
  {
    id: 'upper',
    label: 'U',
    sectionCount: 36,
    rowsPerSection: 20,
    maxSeatsPerRow: 20,
    yBase: STADIUM.UPPER_TIER_BASE,
    yTop:  STADIUM.UPPER_TIER_TOP,
    innerA: 112, innerB: 86,
    outerA: 148, outerB: 114,
    tiltAngle: 0.72,
    color: '#003594',
  },
];

// ── Generate all seat positions for one tier ───────────────────────────────
export function generateTierSeatPositions(cfg) {
  const {
    sectionCount, rowsPerSection, maxSeatsPerRow,
    yBase, yTop,
    innerA, innerB, outerA, outerB,
    tiltAngle,
  } = cfg;

  const posArr = [];   // flat [x,y,z, x,y,z, ...]
  const metaArr = [];  // { section, row, seat, yaw, pitch }

  const angStep = (2 * Math.PI) / sectionCount;

  for (let s = 0; s < sectionCount; s++) {
    const sAngStart = s * angStep;
    const midAng = sAngStart + angStep / 2;

    for (let r = 0; r < rowsPerSection; r++) {
      const t = rowsPerSection > 1 ? r / (rowsPerSection - 1) : 0;

      // Radial distance for this row (interpolate inner→outer)
      const ra = innerA + (outerA - innerA) * t;
      const rb = innerB + (outerB - innerB) * t;

      // Y elevation for this row
      const y = yBase + (yTop - yBase) * t;

      // Arc length of this section at this radius to compute seat count
      const cosMid = Math.cos(midAng);
      const sinMid = Math.sin(midAng);
      const effectiveR = Math.sqrt((ra * cosMid) ** 2 + (rb * sinMid) ** 2);
      const arcLen = angStep * effectiveR;
      const seatCount = Math.min(maxSeatsPerRow, Math.max(4, Math.floor(arcLen / 0.56)));

      for (let seat = 0; seat < seatCount; seat++) {
        const seatT = seatCount > 1 ? seat / (seatCount - 1) : 0.5;
        const seatAng = sAngStart + seatT * angStep;

        const x = ra * Math.cos(seatAng);
        const z = rb * Math.sin(seatAng);

        // Yaw: face inward toward field center
        const yaw = Math.atan2(-x, -z);

        posArr.push(x, y, z);
        metaArr.push({ section: s, row: r, seat, yaw, pitch: -tiltAngle });
      }
    }
  }

  return { positions: posArr, meta: metaArr };
}

// ── Seat lookup map ────────────────────────────────────────────────────────
export function buildSeatLookup(allTierData) {
  const map = new Map();
  for (const { tierId, positions, meta } of allTierData) {
    for (let i = 0; i < meta.length; i++) {
      const { section, row, seat } = meta[i];
      const key = `${tierId}-${section}-${row}-${seat}`;
      map.set(key, {
        x: positions[i * 3],
        y: positions[i * 3 + 1],
        z: positions[i * 3 + 2],
      });
    }
  }
  return map;
}

// ── Determine which section the ball is currently inside ──────────────────
// Returns { tierId, section, label } or null if not inside any seating tier.
//
// The ball walks on the concourse ring which sits just outside the seat blocks,
// so we match by Y floor level rather than tight radial bounds.
// Each tier owns a distinct Y range so there is no overlap risk.
//
// Concourse walk radii (from pathFinder) vs seat inner radii:
//   lower  floor y≈18  concourse r≈95   seats inner r≈54
//   club   floor y≈21  concourse r≈108  seats inner r≈88
//   upper  floor y≈33  concourse r≈115  seats inner r≈99
//
// We use innerA/B as the minimum radius so the field itself never triggers,
// and set a generous outer cap well beyond the concourse ring.
export function sectionFromBallPos(pos) {
  if (!pos) return null;
  const { x, y, z } = pos;
  const r = Math.sqrt(x * x + z * z);

  // Y bands that encompass each tier's seating + its concourse walkway.
  // Lower:  y  0 – 22   Club: y 18 – 28   Upper: y 29 – 62
  // Ordered most-specific first so overlap edges resolve correctly.
  const Y_BANDS = [
    { cfg: TIER_CONFIGS[1], yMin: 18, yMax: 28 },  // club
    { cfg: TIER_CONFIGS[2], yMin: 29, yMax: 62 },  // upper
    { cfg: TIER_CONFIGS[0], yMin:  0, yMax: 22 },  // lower (widest, last)
  ];

  for (const { cfg, yMin, yMax } of Y_BANDS) {
    if (y < yMin || y > yMax) continue;

    // Exclude field center — anything inside half the inner seat ellipse is not a section.
    const minR = (cfg.innerA + cfg.innerB) / 4;
    if (r < minR) continue;

    // Compute section index from horizontal angle only.
    const angle = Math.atan2(z, x); // [-π, π]
    const norm = angle < 0 ? angle + 2 * Math.PI : angle; // [0, 2π)
    const angStep = (2 * Math.PI) / cfg.sectionCount;
    const section = Math.floor(norm / angStep) % cfg.sectionCount;

    return { tierId: cfg.id, section, label: `${cfg.label}${section + 1}` };
  }
  return null;
}

// ── Parse user input → { tierId, section, row, seat, sectionOnly }
// Row and seat are optional — if omitted, defaults to middle of section.
export function parseSeatInput(sectionLabel, rowInput, seatInput) {
  if (!sectionLabel) return null;
  const prefix = sectionLabel.trim()[0]?.toUpperCase();
  const num = parseInt(sectionLabel.trim().slice(1)) - 1; // 1-indexed → 0-indexed

  const tierMap = { L: 'lower', C: 'club', U: 'upper' };
  const tierId = tierMap[prefix];
  if (!tierId || isNaN(num)) return null;

  const cfg = TIER_CONFIGS.find(c => c.id === tierId);
  if (!cfg) return null;

  const sectionOnly = !rowInput && !seatInput;

  // Default to middle row / middle seat when not specified
  const row  = rowInput  ? parseInt(rowInput)  - 1 : Math.floor(cfg.rowsPerSection / 2);
  const seat = seatInput ? parseInt(seatInput) - 1 : Math.floor(cfg.maxSeatsPerRow  / 2);

  if (isNaN(row) || isNaN(seat)) return null;

  return { tierId, section: num, row, seat, sectionOnly };
}

// ── Football field canvas texture ─────────────────────────────────────────
export function buildFieldTexture() {
  const W = 2048, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Alternating green stripes (5-yard bands)
  const bands = 24;
  const bandW = W / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1fa84a' : '#178038';
    ctx.fillRect(i * bandW, 0, bandW, H);
  }

  // End zones (blue)
  const ezW = (10 / 120) * W;
  ctx.fillStyle = '#002aac';
  ctx.fillRect(0, 0, ezW, H);
  ctx.fillRect(W - ezW, 0, ezW, H);

  // White yard lines (every 10 yards = 8 lines between end zones)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  for (let yard = 10; yard <= 100; yard += 10) {
    const x = ((yard + 10) / 120) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  // Hash marks (simplified)
  ctx.lineWidth = 3;
  const hashY1 = H * 0.44, hashY2 = H * 0.56;
  for (let yard = 5; yard <= 115; yard += 5) {
    const x = (yard / 120) * W;
    ctx.beginPath(); ctx.moveTo(x, hashY1 - 12); ctx.lineTo(x, hashY1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, hashY2); ctx.lineTo(x, hashY2 + 12); ctx.stroke();
  }

  // Sidelines
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(ezW, 0); ctx.lineTo(ezW, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - ezW, 0); ctx.lineTo(W - ezW, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(W, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H - 8); ctx.lineTo(W, H - 8); ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// ── Bowl extrude geometry ─────────────────────────────────────────────────
export function buildBowlGeometry() {
  // Profile: cross-section of concrete seating slab (in local 2D space)
  // Will be extruded along the elliptical bowl path
  const profile = new THREE.Shape();
  profile.moveTo(0, 0);
  profile.lineTo(52, 0);   // depth of slab (outer - inner radius difference)
  profile.lineTo(52, 3);
  profile.lineTo(0, 3);
  profile.closePath();

  // Elliptical path for extrusion (plan view)
  const ellipsePts = [];
  const steps = 128;
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    ellipsePts.push(new THREE.Vector3(
      62 * Math.cos(ang),   // inner radius A
      0,
      46 * Math.sin(ang),   // inner radius B
    ));
  }
  const path = new THREE.CatmullRomCurve3(ellipsePts, true);

  return new THREE.ExtrudeGeometry(profile, {
    steps: 128,
    bevelEnabled: false,
    extrudePath: path,
  });
}
