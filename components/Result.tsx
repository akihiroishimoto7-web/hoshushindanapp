"use client";

import { useRef } from "react";
import { Choice } from "@/lib/questions";
import { AXIS_META, calcScores, classify, MAX, pct } from "@/lib/scoring";
import AxisBar from "./AxisBar";

export default function Result({
  answers,
  onRetry,
}: {
  answers: Choice[];
  onRetry: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const scores = calcScores(answers);
  const result = classify(scores);

  const axes = (Object.keys(AXIS_META) as (keyof typeof AXIS_META)[]).map((k) => ({
    key: k,
    value: pct(scores[k], MAX[k]),
    ...AXIS_META[k],
  }));

  async function saveImage() {
    if (!cardRef.current) return;
    try {
      const mod = await import("html-to-image");
      const dataUrl = await mod.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "hoshudo-shindan.png";
      a.click();
    } catch (e) {
      alert("画像保存に失敗しました。");
    }
  }

  function share() {
    const text = `【保守度診断】私は「${result.name}」でした。\nあなたの思想は、どこに属するのか。`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweet, "_blank");
  }

  return (
    <section className={`relative min-h-[100svh] px-6 py-14 ${result.themeClass}`}>
      <div ref={cardRef} className="relative max-w-md mx-auto bg-ink/60 backdrop-blur-sm border border-kin/15 px-7 py-12 sm:px-10 sm:py-14 shadow-kin animate-fade-up">
        <p className="font-mincho text-[10px] tracking-widest2 text-kin text-center mb-6">
          解 析 結 果
        </p>
        <div className="hairline w-20 mx-auto mb-8" />

        <p className="text-center font-mincho text-[10px] tracking-widest text-washi/40 mb-3">
          {result.subtitle}
        </p>
        <h2 className="font-mincho text-center text-3xl sm:text-[34px] leading-snug kin-text mb-8">
          {result.name}
        </h2>

        <p className="font-mincho text-[14px] leading-[2] text-washi/85 text-center mb-10">
          {result.description}
        </p>

        <div className="hairline w-12 mx-auto mb-10" />

        <div className="space-y-6 mb-10">
          {axes.map((a) => (
            <AxisBar key={a.key} label={a.label} sub={a.sub} value={a.value} />
          ))}
        </div>

        <div className="hairline w-12 mx-auto mb-8" />

        <ul className="space-y-4 mb-2">
          {result.satire.map((s, i) => (
            <li key={i} className="font-mincho text-[13px] leading-[2] text-washi/75 pl-4 border-l border-kin/30">
              {s}
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center font-mincho text-[9px] tracking-widest2 text-washi/30">
          保 守 思 想 解 析 シ ス テ ム ／ HOSHUDO
        </p>
      </div>

      <div className="max-w-md mx-auto mt-10 grid grid-cols-2 gap-3">
        <button
          onClick={share}
          className="choice py-3.5 font-mincho text-[12px] tracking-widest2 text-washi/80"
        >
          X で 共 有
        </button>
        <button
          onClick={saveImage}
          className="choice py-3.5 font-mincho text-[12px] tracking-widest2 text-kin"
        >
          画 像 を 保 存
        </button>
      </div>

      <div className="max-w-md mx-auto mt-8 text-center">
        <button onClick={onRetry} className="btn-line font-mincho text-[11px] tracking-widest2 text-washi/50">
          も う 一 度 診 断 す る
        </button>
      </div>
    </section>
  );
}
