"use client";

export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <span className="kanji-bg" style={{ top: "-3rem", right: "-3rem" }}>守</span>
      <span className="kanji-bg" style={{ bottom: "-6rem", left: "-4rem", fontSize: "18rem" }}>静</span>

      <div className="relative z-10 text-center max-w-md mx-auto animate-fade-up">
        <p className="font-mincho text-[10px] tracking-widest2 text-kin mb-8">
          保 守 思 想 解 析 シ ス テ ム
        </p>

        <div className="hairline w-24 mx-auto mb-8" />

        <h1 className="font-mincho text-4xl sm:text-5xl leading-[1.4] mb-10 kin-text">
          保守度
          <br />
          診断
        </h1>

        <p className="font-mincho text-sm leading-loose text-washi/80 mb-12">
          あなたの思想は、
          <br />
          どこに属するのか。
        </p>

        <div className="hairline w-16 mx-auto mb-10" />

        <ul className="text-[11px] text-washi/50 space-y-2 mb-14 font-mincho">
          <li>― 全 13 問</li>
          <li>― 所要 約 3 分</li>
          <li>― 結果は 6 軸で解析</li>
        </ul>

        <button
          onClick={onStart}
          className="btn-line font-mincho text-[13px] tracking-[0.5em] text-kin pl-2"
        >
          診 断 を 始 め る
        </button>
      </div>

      <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-washi/30 font-mincho z-10">
        ※ 本診断はエンタメです。
      </p>
    </section>
  );
}
