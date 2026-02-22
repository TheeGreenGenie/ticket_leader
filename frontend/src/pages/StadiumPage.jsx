import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import StadiumScene from '../stadium/StadiumScene';
import { parseSeatInput } from '../stadium/stadiumMath';
import { ENTRY_SPAWNS } from '../stadium/ParkingLots';
import { computeWaypoints } from '../stadium/pathFinder';
import '../styles/styles.css';

const MODES = [
  { id: 'orbit',       label: '🔭 Overview' },
  { id: 'walkthrough', label: '🚶 Walk (3rd Person)' },
  { id: 'parking',     label: '🅿️  Parking & Entry' },
];

export default function StadiumPage() {
  const navigate = useNavigate();

  const [mode, setMode]             = useState('orbit');
  const [targetSeat, setTargetSeat] = useState(null);
  const [spawnPoint, setSpawnPoint] = useState(null);
  const [playerFloorY, setPlayerFloorY] = useState(null);
  const [highlight, setHighlight]   = useState(null); // { tierId, section, row, seat, sectionOnly }
  const [pathWaypoints, setPathWaypoints] = useState(null);

  const seatLookupRef = useRef(null);
  // Tracks ball world position every frame (written by WalkthroughControls)
  const ballPosRef = useRef(new THREE.Vector3(-18, 0.9, -100));

  // Seat finder form state
  const [section,   setSection]   = useState('');
  const [row,       setRow]       = useState('');
  const [seat,      setSeat]      = useState('');
  const [seatError, setSeatError] = useState('');
  const [foundSeat, setFoundSeat] = useState(null);

  // Label shown when user clicks a section in the 3D view
  const [clickedSection, setClickedSection] = useState(null); // e.g. "L5"

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const handleLookupReady = useCallback((lookup) => {
    seatLookupRef.current = lookup;
  }, []);

  const TIER_LABEL = { lower: 'L', club: 'C', upper: 'U' };

  const handleSectionClick = useCallback(({ tierId, section: sectionIdx }) => {
    const label = `${TIER_LABEL[tierId] ?? '?'}${sectionIdx + 1}`;
    setClickedSection(label);
    // Highlight the whole section (sectionOnly)
    setHighlight({ tierId, section: sectionIdx, row: 0, seat: 0, sectionOnly: true });
    setFoundSeat(null);
    setSeatError('');
    setPathWaypoints(null);
  }, []);

  const handleFind = useCallback((e) => {
    e.preventDefault();
    const parsed = parseSeatInput(section, row, seat);
    if (!parsed) {
      setSeatError('Invalid section. Use: L1–L54, C1–C22, or U1–U36');
      setFoundSeat(null);
      setHighlight(null);
      return;
    }
    const lookup = seatLookupRef.current;
    let pos = lookup?.get(`${parsed.tierId}-${parsed.section}-${parsed.row}-${parsed.seat}`);

    // Section-only (or row/seat out of range): scan for any valid seat in this section
    if (!pos && lookup) {
      // Try seats 0..maxSeatsPerRow at the target row, then any row in the section
      for (let s = 0; s < 60 && !pos; s++) {
        pos = lookup.get(`${parsed.tierId}-${parsed.section}-${parsed.row}-${s}`);
      }
      // Still nothing — try any row/seat in the section
      for (let r = 0; r < 30 && !pos; r++) {
        for (let s = 0; s < 60 && !pos; s++) {
          pos = lookup.get(`${parsed.tierId}-${parsed.section}-${r}-${s}`);
        }
      }
    }

    if (!pos) {
      setSeatError('Section not found. Use: L1–L54, C1–C22, or U1–U36');
      setFoundSeat(null);
      setHighlight(null);
      return;
    }
    setSeatError('');
    setFoundSeat({ section, row: parsed.row + 1, seat: parsed.seat + 1, sectionOnly: parsed.sectionOnly });

    // Highlight: section always, specific seat only if row+seat were given
    setHighlight({
      tierId: parsed.tierId,
      section: parsed.section,
      row: parsed.row,
      seat: parsed.seat,
      sectionOnly: parsed.sectionOnly,
    });

    // Compute path from ball's current position to seat
    const waypoints = computeWaypoints(ballPosRef.current, pos, parsed.tierId);
    setPathWaypoints(waypoints);

    // Keep current mode so ball stays movable while path is visible
    setTargetSeat(null);
  }, [section, row, seat]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode !== 'orbit') setTargetSeat(null);
    if (newMode !== 'walkthrough') setPlayerFloorY(null);
    setHighlight(null);
    setFoundSeat(null);
    setSeatError('');
    setPathWaypoints(null);
    setClickedSection(null);
  }, []);

  // Called when user clicks an entry beacon in parking mode
  const handleEnterStadium = useCallback((entryId) => {
    const spawn = ENTRY_SPAWNS[entryId];
    if (!spawn) return;
    setSpawnPoint({ ...spawn });
    setMode('walkthrough'); // switch to 3rd-person inside
  }, []);

  // Called when user clicks a parking lot — spawn ball at lot center
  const handleSpawnAtLot = useCallback((pos) => {
    setSpawnPoint({ x: pos.x, y: 0, z: pos.z, yaw: Math.PI });
  }, []);

  // Called every frame by StadiumScene's FloorPoller
  const handleFloorChange = useCallback((y) => {
    setPlayerFloorY(y);
  }, []);

  // ── Styles ───────────────────────────────────────────────────────────────────
  const panelBase = {
    background: 'rgba(0,0,0,0.82)',
    border: '1px solid #444',
    borderRadius: 10,
    color: 'white',
    fontFamily: 'sans-serif',
    fontSize: 13,
    padding: 16,
    pointerEvents: 'auto',
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    marginBottom: 8,
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #555',
    background: '#1a1a1a',
    color: 'white',
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const floorLabel = playerFloorY != null
    ? playerFloorY < 5  ? 'Field / Lower Concourse'
    : playerFloorY < 20 ? 'Lower Concourse (Level 1)'
    : playerFloorY < 25 ? 'Club Level (Level 2)'
    : 'Upper Concourse (Level 3)'
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0d0d1a' }}>
      <Header />
      <Navbar />

      {/* ── Page body — scrollable if content overflows ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {/* ── Stadium preview card ── */}
        <div style={{
          background: '#12122a',
          border: '1px solid #2a2a4a',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,50,0.6)',
        }}>

          {/* Card header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#0a0a20',
            borderBottom: '1px solid #2a2a4a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏟️</span>
              <span style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: 15 }}>
                AT&amp;T Stadium — Interactive Preview
              </span>
            </div>
            {/* Mode buttons inline in header */}
            <div style={{ display: 'flex', gap: 6 }}>
              {MODES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleModeChange(id)}
                  style={{
                    padding: '6px 12px',
                    background: mode === id ? '#003594' : 'rgba(255,255,255,0.07)',
                    border: mode === id ? '1px solid #4488ff' : '1px solid #333',
                    borderRadius: 6,
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: mode === id ? 'bold' : 'normal',
                    fontFamily: 'sans-serif',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-D canvas area + overlays */}
          <div style={{ position: 'relative', height: '72vh' }}>

            <StadiumScene
              mode={mode}
              targetSeat={targetSeat}
              onLookupReady={handleLookupReady}
              spawnPoint={spawnPoint}
              onEnterStadium={handleEnterStadium}
              onSpawnAtLot={handleSpawnAtLot}
              onFloorChange={handleFloorChange}
              onSectionClick={handleSectionClick}
              playerFloorY={playerFloorY}
              highlight={highlight}
              pathWaypoints={pathWaypoints}
              ballPosRef={ballPosRef}
            />

            {/* Controls / floor hint — top-right overlay inside canvas */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
              zIndex: 10, pointerEvents: 'none',
            }}>
              {mode === 'walkthrough' && (
                <div style={{ ...panelBase, fontSize: 11, color: '#aaa', lineHeight: 1.7, pointerEvents: 'none' }}>
                  <strong style={{ color: 'white' }}>Controls</strong><br />
                  WASD — move ball<br />
                  O / L — float up / down<br />
                  Space — drop to floor<br />
                  Q / E — zoom in / out<br />
                  Arrow keys — rotate view<br />
                  Left-drag — rotate camera<br />
                  Walk into corner towers to change floors
                </div>
              )}
              {mode === 'parking' && (
                <div style={{ ...panelBase, fontSize: 11, color: '#aaa', lineHeight: 1.7, pointerEvents: 'none' }}>
                  <strong style={{ color: 'white' }}>Parking Mode</strong><br />
                  Click <span style={{ color: '#aac8ff' }}>LOT — Start here</span> to place ball<br />
                  WASD — move · Q/E — zoom in/out<br />
                  Right-drag — orbit camera<br />
                  Click <span style={{ color: '#00aaff' }}>ENTRY</span> beacon to enter stadium
                </div>
              )}
              {mode === 'walkthrough' && floorLabel && (
                <div style={{ ...panelBase, fontSize: 12, color: '#aac8ff', textAlign: 'center', pointerEvents: 'none' }}>
                  📍 {floorLabel}
                </div>
              )}
            </div>

            {/* Section name badge — shown when user clicks a section */}
            {clickedSection && (
              <div style={{
                position: 'absolute', top: 14, left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10, pointerEvents: 'auto',
                background: 'rgba(0,0,0,0.88)',
                border: '1px solid #ffaa00',
                borderRadius: 10,
                padding: '10px 22px',
                display: 'flex', alignItems: 'center', gap: 12,
                fontFamily: 'sans-serif',
                boxShadow: '0 0 18px #ffaa0044',
              }}>
                <span style={{ fontSize: 22 }}>🪑</span>
                <div>
                  <div style={{ fontSize: 11, color: '#ffaa00', marginBottom: 2 }}>Section</div>
                  <div style={{ fontSize: 22, fontWeight: 'bold', color: 'white', letterSpacing: 2 }}>
                    {clickedSection}
                  </div>
                </div>
                <button
                  onClick={() => { setClickedSection(null); setHighlight(null); }}
                  style={{
                    marginLeft: 8,
                    background: 'none', border: 'none',
                    color: '#888', fontSize: 18, cursor: 'pointer',
                    lineHeight: 1, padding: 2,
                  }}
                  title="Dismiss"
                >✕</button>
              </div>
            )}

            {/* Seat finder — bottom-left overlay inside canvas */}
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              width: 230, zIndex: 10,
              ...panelBase,
            }}>
              <div style={{ marginBottom: 12, fontSize: 15, color: '#aac8ff', fontWeight: 'bold' }}>
                🎯 Find My Seat
              </div>
              <form onSubmit={handleFind}>
                <label style={{ fontSize: 11, color: '#aaa' }}>Section <span style={{ color: '#666' }}>(required)</span></label>
                <input
                  style={inputStyle}
                  placeholder="e.g. L5, C3, U12"
                  value={section}
                  onChange={e => { setSection(e.target.value); setHighlight(null); setFoundSeat(null); setPathWaypoints(null); }}
                />
                <label style={{ fontSize: 11, color: '#aaa' }}>Row <span style={{ color: '#555' }}>(optional)</span></label>
                <input
                  style={inputStyle}
                  type="number" min="1" placeholder="leave blank for section view"
                  value={row}
                  onChange={e => setRow(e.target.value)}
                />
                <label style={{ fontSize: 11, color: '#aaa' }}>Seat <span style={{ color: '#555' }}>(optional)</span></label>
                <input
                  style={inputStyle}
                  type="number" min="1" placeholder="leave blank for section view"
                  value={seat}
                  onChange={e => setSeat(e.target.value)}
                />
                {seatError && (
                  <p style={{ color: '#ff7070', fontSize: 11, margin: '0 0 8px' }}>{seatError}</p>
                )}
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '8px 0',
                    background: '#003594', color: 'white',
                    border: 'none', borderRadius: 5,
                    cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
                  }}
                >
                  Find Section / Seat
                </button>
              </form>

              {foundSeat && (
                <div style={{
                  marginTop: 10, padding: 10,
                  background: '#1a2a3a', borderRadius: 6,
                  borderLeft: `3px solid ${foundSeat.sectionOnly ? '#ffaa00' : '#ffff00'}`,
                  fontSize: 12,
                }}>
                  <div style={{ color: '#aac8ff', marginBottom: 4 }}>
                    {foundSeat.sectionOnly ? '🟠 Section highlighted' : '🟡 Seat highlighted'}
                  </div>
                  <div>Section <strong>{foundSeat.section}</strong></div>
                  {!foundSeat.sectionOnly && (
                    <div>Row <strong>{foundSeat.row}</strong> · Seat <strong>{foundSeat.seat}</strong></div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
                L1–L54 · C1–C22 · U1–U36
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
