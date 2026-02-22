import { useState } from 'react';
import { Html } from '@react-three/drei';

export function SeatFinderUI({ onFind }) {
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [error, setError] = useState('');
  const [found, setFound] = useState(null);

  const inputStyle = {
    display: 'block', width: '100%', marginBottom: 8,
    padding: '6px 8px', borderRadius: 4, border: '1px solid #555',
    background: '#1a1a1a', color: 'white', fontSize: 13,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = onFind(section, row, seat);
    if (!result) {
      setError('Seat not found. Use format: L-5, C-3, or U-12');
      setFound(null);
    } else {
      setError('');
      setFound({ section, row, seat });
    }
  };

  return (
    <Html fullscreen>
      <div style={{
        position: 'absolute', bottom: 24, left: 24,
        background: 'rgba(0,0,0,0.82)', color: 'white',
        padding: 18, borderRadius: 10, width: 230,
        fontFamily: 'sans-serif', fontSize: 13,
        border: '1px solid #444',
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#aac8ff' }}>
          🎯 Find My Seat
        </h3>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 11, color: '#aaa' }}>Section (e.g. L-5, C-3, U-12)</label>
          <input
            style={inputStyle}
            placeholder="L-5"
            value={section}
            onChange={e => setSection(e.target.value)}
          />
          <label style={{ fontSize: 11, color: '#aaa' }}>Row</label>
          <input
            style={inputStyle}
            type="number" min="1" placeholder="1"
            value={row}
            onChange={e => setRow(e.target.value)}
          />
          <label style={{ fontSize: 11, color: '#aaa' }}>Seat</label>
          <input
            style={inputStyle}
            type="number" min="1" placeholder="1"
            value={seat}
            onChange={e => setSeat(e.target.value)}
          />
          {error && <p style={{ color: '#ff7070', fontSize: 11, margin: '4px 0 8px' }}>{error}</p>}
          <button type="submit" style={{
            width: '100%', padding: '8px 0',
            background: '#003594', color: 'white',
            border: 'none', borderRadius: 5,
            cursor: 'pointer', fontSize: 13,
          }}>
            Go To Seat
          </button>
        </form>

        {found && (
          <div style={{
            marginTop: 12, padding: 10,
            background: '#1a2a3a', borderRadius: 6,
            borderLeft: '3px solid #4488ff',
          }}>
            <div style={{ color: '#aac8ff', fontSize: 11, marginBottom: 4 }}>📍 Viewing</div>
            <div>Section <strong>{found.section}</strong></div>
            <div>Row <strong>{found.row}</strong> · Seat <strong>{found.seat}</strong></div>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 10, color: '#666' }}>
          Sections: L1–L54 · C1–C22 · U1–U36
        </div>
      </div>
    </Html>
  );
}
