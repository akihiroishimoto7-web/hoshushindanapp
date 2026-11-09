import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { game } from './game';
import type { Step } from './types';

/**
 * 章シーンの共通処理: 最初の数フレームを描いたら「じゅんび完了」、
 * ローディングが消えてから 台本を はじめる。
 */
export function useChapterStart(script: Step[], delay = 700) {
  const frames = useRef(0);
  const started = useRef(false);
  useFrame(() => {
    if (started.current) return;
    frames.current++;
    if (frames.current === 3) {
      started.current = true;
      game.sceneReady();
    }
  });
  useEffect(() => {
    const t = setTimeout(() => game.startScript(script), delay + 250);
    return () => clearTimeout(t);
    // 台本は章ごとに固定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
