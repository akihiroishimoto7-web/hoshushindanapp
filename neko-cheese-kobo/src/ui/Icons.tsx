const P = { fill: 'none', stroke: '#6b4423', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function HomeIcon() {
  return (
    <svg viewBox="0 0 32 32">
      <path {...P} d="M5 15 16 6l11 9" />
      <path {...P} fill="#ffd34d" d="M8 13v13h6v-7h4v7h6V13" />
    </svg>
  );
}

export function VoiceIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 32 32">
      <path {...P} fill="#fff" d="M6 8h20v13H15l-6 5v-5H6z" />
      {on ? (
        <>
          <circle cx="11" cy="14.5" r="1.6" fill="#6b4423" />
          <circle cx="16" cy="14.5" r="1.6" fill="#6b4423" />
          <circle cx="21" cy="14.5" r="1.6" fill="#6b4423" />
        </>
      ) : (
        <path {...P} d="M4 4l24 24" stroke="#e2574c" />
      )}
    </svg>
  );
}

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 32 32">
      <path {...P} fill="#ffd34d" d="M5 12h5l7-6v20l-7-6H5z" />
      {on ? (
        <>
          <path {...P} d="M21 11c2 2.5 2 7.5 0 10" />
          <path {...P} d="M24.5 8c4 4.5 4 11.5 0 16" />
        </>
      ) : (
        <path {...P} d="M21 12l7 8M28 12l-7 8" stroke="#e2574c" />
      )}
    </svg>
  );
}

export function PawIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <g fill={color}>
        <ellipse cx="16" cy="21" rx="7" ry="6" />
        <ellipse cx="8" cy="13" rx="3" ry="3.6" />
        <ellipse cx="13" cy="8" rx="3" ry="3.6" />
        <ellipse cx="19" cy="8" rx="3" ry="3.6" />
        <ellipse cx="24" cy="13" rx="3" ry="3.6" />
      </g>
    </svg>
  );
}
