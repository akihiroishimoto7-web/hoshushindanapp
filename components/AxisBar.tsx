"use client";

export default function AxisBar({
  label,
  sub,
  value,
}: {
  label: string;
  sub: string;
  value: number;
}) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="font-mincho text-[14px] text-washi/90">{label}</span>
          <span className="ml-2 text-[9px] tracking-widest text-washi/30">{sub}</span>
        </div>
        <span className="font-mincho text-kin text-[13px] tabular-nums">{value}<span className="text-[10px] text-washi/40 ml-0.5">%</span></span>
      </div>
      <div className="relative h-[2px] bg-washi/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-kinDeep via-kin to-kinDeep transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
