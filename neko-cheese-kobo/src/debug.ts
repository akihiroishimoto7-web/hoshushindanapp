import { game, useGame } from './game/game';
import { dialog, useDialog } from './game/dialog';
import { useProgress } from './game/progress';
import { listTargets, screenPosOf, threeRef } from './three/targets';
import { bus } from './game/bus';

/** ?debug をつけて開くと、ブラウザのコンソール・自動テストから操作できる */
export function installDebug() {
  (window as unknown as Record<string, unknown>).__neko = {
    game,
    dialog,
    bus,
    state: () => ({
      game: useGame.getState(),
      dialog: { ...useDialog.getState() },
      progress: useProgress.getState(),
    }),
    targets: listTargets,
    screenPos: screenPosOf,
    perf: () => ({ ...threeRef, camera: undefined }),
  };
}
