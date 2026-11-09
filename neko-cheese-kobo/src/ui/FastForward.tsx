import { useEffect, useState } from 'react';
import { playSfx } from '../audio/sfx';

/** 「はやおくり」の時計。ほんとうに かかる時間も いっしょに しめす */
export function FastForward({ label, ms = 2600 }: { label: string; ms?: number }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let lastTick = 0;
    const loop = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setDeg(k * 360 * 6);
      if (now - lastTick > 160) {
        lastTick = now;
        playSfx('tick');
      }
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ms]);
  return (
    <div className="panel top" style={{ top: 'calc(120px + var(--safe-t))' }}>
      <div className="dial-wrap" data-testid="ff">
        <svg viewBox="0 0 100 100" width="84" height="84">
          <circle cx="50" cy="50" r="44" fill="#fffdf5" stroke="#f2a91f" strokeWidth="7" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="50" y1="12" x2="50" y2="18" stroke="#8c5b32" strokeWidth="3" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <line x1="50" y1="50" x2="50" y2="28" stroke="#6b4423" strokeWidth="5" strokeLinecap="round" transform={`rotate(${deg / 12} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="18" stroke="#e2574c" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />
          <circle cx="50" cy="50" r="4" fill="#6b4423" />
        </svg>
        <div className="dial-info">
          はやおくり ⏩
          <small>{label}</small>
        </div>
      </div>
    </div>
  );
}
