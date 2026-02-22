import { Html } from '@react-three/drei';

const MODES = [
  { id: 'orbit',       label: '🔭 Overview'   },
  { id: 'walkthrough', label: '🚶 Walk'        },
  { id: 'finder',      label: '🎯 Find Seat'  },
];

export function ModeToggleUI({ currentMode, onModeChange }) {
  return (
    <Html fullscreen>
      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
        fontFamily: 'sans-serif',
      }}>
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            style={{
              padding: '8px 16px',
              background: currentMode === id ? '#003594' : 'rgba(0,0,0,0.75)',
              color: 'white',
              border: currentMode === id ? '1px solid #4488ff' : '1px solid #444',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: currentMode === id ? 'bold' : 'normal',
              minWidth: 130,
              textAlign: 'left',
            }}
          >
            {label}
          </button>
        ))}

        {currentMode === 'walkthrough' && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid #444', borderRadius: 6,
            color: '#aaa', fontSize: 11, lineHeight: 1.6,
          }}>
            Click canvas to capture mouse<br />
            WASD to move<br />
            Mouse to look<br />
            ESC to release
          </div>
        )}
      </div>
    </Html>
  );
}
