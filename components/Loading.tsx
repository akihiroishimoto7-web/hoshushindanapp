"use client";

import { useEffect, useState } from "react";

const ORACLE = [
  "天 岩 戸 の 奥 へ 問 う ―",
  "高 天 原 に 兆 し あ り ―",
  "神 慮 を 待 ち た ま え ―",
  "思 想 の 純 度 を 計 測 中 ―",
];

export default function Loading({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const a = setInterval(() => setI((p) => (p + 1) % ORACLE.length), 900);
    const t = setTimeout(onDone, 3300);
    return () => {
      clearInterval(a);
      clearTimeout(t);
    };
  }, [onDone]);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-kin/30 animate-ink-spread" />
        <div className="absolute inset-2 rounded-full border border-kin/20 animate-ink-spread" style={{ animationDelay: "0.8s" }} />
        <div className="absolute inset-4 rounded-full border border-kin/10 animate-ink-spread" style={{ animationDelay: "1.6s" }} />
        <div className="relative font-mincho text-5xl kin-text animate-slow-pulse">卜</div>
      </div>

      <p className="font-mincho text-[11px] tracking-widest2 text-kin/80 mb-3 transition-all duration-500">
        {ORACLE[i]}
      </p>
      <p className="font-mincho text-[10px] text-washi/30">
        ANALYZING ...
      </p>
    </section>
  );
}
