import { create } from 'zustand';
import { dialog } from './dialog';
import { useProgress } from './progress';
import { CHAPTER_COUNT } from './chapterMeta';
import { speech } from '../audio/speech';
import { music } from '../audio/music';
import type { Step } from './types';

export type Screen = 'title' | 'play' | 'clear' | 'ending';

interface GameState {
  screen: Screen;
  chapter: number;
  /** 章が読みこまれて最初の描画がおわったか */
  sceneReady: boolean;
  /** 章をやりなおすたびに増やして、シーンを作りなおす */
  runId: number;
  /** 画面全体をおおう白いフラッシュ（ちぢむ まほう など） */
  flash: number;
}

export const useGame = create<GameState>(() => ({
  screen: 'title',
  chapter: 0,
  sceneReady: false,
  runId: 0,
  flash: 0,
}));

export const game = {
  play(chapter: number) {
    const c = Math.max(0, Math.min(CHAPTER_COUNT - 1, chapter));
    dialog.stop();
    speech.cancel();
    useProgress.getState().setCurrent(c);
    useGame.setState((s) => ({ screen: 'play', chapter: c, sceneReady: false, runId: s.runId + 1 }));
    music.setTheme(c);
  },

  toTitle() {
    dialog.stop();
    speech.cancel();
    useGame.setState((s) => ({ screen: 'title', sceneReady: false, runId: s.runId + 1 }));
    music.setTheme(-1);
  },

  sceneReady() {
    useGame.setState({ sceneReady: true });
  },

  /** 章の台本を開始。終わったらクリア画面へ */
  startScript(steps: Step[]) {
    const { chapter } = useGame.getState();
    dialog.start(steps, () => game.chapterClear(chapter));
  },

  chapterClear(chapter: number) {
    useProgress.getState().completeChapter(chapter);
    useGame.setState({ screen: chapter >= CHAPTER_COUNT - 1 ? 'ending' : 'clear' });
  },

  next() {
    const { chapter } = useGame.getState();
    game.play(chapter + 1);
  },

  flash() {
    useGame.setState((s) => ({ flash: s.flash + 1 }));
  },
};
