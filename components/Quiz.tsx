"use client";

import { useState } from "react";
import { Choice, QUESTIONS } from "@/lib/questions";

export default function Quiz({ onComplete }: { onComplete: (answers: Choice[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const q = QUESTIONS[index];
  const total = QUESTIONS.length;

  function handlePick(i: number) {
    setSelected(i);
    const nextAnswers = [...answers, q.choices[i]];
    setTimeout(() => {
      if (index + 1 >= total) {
        onComplete(nextAnswers);
      } else {
        setAnswers(nextAnswers);
        setIndex(index + 1);
        setSelected(null);
      }
    }, 380);
  }

  return (
    <section className="relative min-h-[100svh] px-6 py-12 flex flex-col">
      {/* progress */}
      <div className="max-w-md mx-auto w-full mb-12 mt-4">
        <div className="flex items-center justify-between text-[10px] font-mincho tracking-widest2 text-washi/40 mb-3">
          <span>第 {String(index + 1).padStart(2, "0")} 問</span>
          <span>{q.category}</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>
        <div className="relative h-px bg-washi/10 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-kinDeep via-kin to-kinDeep transition-all duration-700 ease-out"
            style={{ width: `${((index) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* question */}
      <div key={q.id} className="max-w-md mx-auto w-full flex-1 animate-fade-up">
        <h2 className="font-mincho text-xl sm:text-2xl leading-[2] mb-12 text-washi">
          {q.text}
        </h2>

        <div className="space-y-3">
          {q.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={selected !== null}
              className={`choice w-full text-left px-5 py-4 rounded-sm font-mincho text-[15px] ${
                selected === i ? "selected" : ""
              }`}
            >
              <span className="text-kin/70 text-[10px] tracking-widest mr-3">
                {["一", "二", "三", "四"][i]}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-washi/30 font-mincho mt-12">
        ― 直 感 で 答 え よ ―
      </p>
    </section>
  );
}
