import { useRef } from 'react';
import { playSfx } from '../audio/sfx';

/**
 * 時間を すすめる ダイヤル。ゆびで ぐるっと まわす。
 * まわすのが むずかしい子のために「すすめる」ボタンも ある。
 */
const SWEEP = 320;

export function Dial({ value, onChange, label, sub }: { value: number; onChange: (v: number) => void; label: string; sub?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastTick = useRef(0);

  const fromEvent = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    // 上(12時)を 0 として 時計回り
    let a = (Math.atan2(x, -y) * 180) / Math.PI;
    if (a < 0) a += 360;
    return Math.min(1, a / SWEEP);
  };
  const set = (v: number) => {
    // 急に 反対がわへ とばないように
    if (Math.abs(v - value) > 0.35) return;
    if (Math.abs(v - lastTick.current) > 0.03) {
      lastTick.current = v;
      playSfx('tick');
    }
    onChange(v);
  };
  const angle = value * SWEEP;
  const rad = ((angle - 90) * Math.PI) / 180;
  const kx = 50 + Math.cos(rad) * 34;
  const ky = 50 + Math.sin(rad) * 34;
  const arc = (deg: number) => {
    const r2 = ((deg - 90) * Math.PI) / 180;
    return `${50 + Math.cos(r2) * 40} ${50 + Math.sin(r2) * 40}`;
  };
  return (
    <div className="dial-wrap" data-testid="dial">
      <svg
        ref={svg}
        className="dial"
        viewBox="0 0 100 100"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          set(fromEvent(e));
        }}
        onPointerMove={(e) => dragging.current && set(fromEvent(e))}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <circle cx="50" cy="50" r="46" fill="#fff6e0" stroke="#c99a6b" strokeWidth="5" />
        <path d={`M ${arc(0)} A 40 40 0 1 1 ${arc(SWEEP)}`} fill="none" stroke="#efe3c8" strokeWidth="8" strokeLinecap="round" />
        {value > 0.002 && (
          <path d={`M ${arc(0)} A 40 40 0 ${angle > 180 ? 1 : 0} 1 ${arc(angle)}`} fill="none" stroke="#f2a91f" strokeWidth="8" strokeLinecap="round" />
        )}
        <circle cx="50" cy="50" r="22" fill="#ffd34d" stroke="#c99a6b" strokeWidth="3" />
        <text x="50" y="56" textAnchor="middle" fontSize="16">
          ⏳
        </text>
        <circle cx={kx} cy={ky} r="10" fill="#e8604c" stroke="#fff" strokeWidth="3" />
      </svg>
      <div className="dial-info">
        {label}
        {sub && <small>{sub}</small>}
        <button
          className="btn sub"
          style={{ minHeight: 44, padding: '6px 14px', fontSize: 16, marginTop: 6 }}
          onClick={() => {
            playSfx('tick');
            onChange(Math.min(1, value + 0.1));
          }}
          data-testid="dial-plus"
        >
          すすめる ▶
        </button>
      </div>
    </div>
  );
}
