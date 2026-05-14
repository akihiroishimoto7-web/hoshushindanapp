"use client";

import { useState } from "react";
import Intro from "@/components/Intro";
import Quiz from "@/components/Quiz";
import Loading from "@/components/Loading";
import Result from "@/components/Result";
import { Choice } from "@/lib/questions";

type Phase = "intro" | "quiz" | "loading" | "result";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Choice[]>([]);

  return (
    <main className="relative z-10">
      {phase === "intro" && <Intro onStart={() => setPhase("quiz")} />}
      {phase === "quiz" && (
        <Quiz
          onComplete={(a) => {
            setAnswers(a);
            setPhase("loading");
          }}
        />
      )}
      {phase === "loading" && <Loading onDone={() => setPhase("result")} />}
      {phase === "result" && (
        <Result
          answers={answers}
          onRetry={() => {
            setAnswers([]);
            setPhase("intro");
          }}
        />
      )}
    </main>
  );
}
