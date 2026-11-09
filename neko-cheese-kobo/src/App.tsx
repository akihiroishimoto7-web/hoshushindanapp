import { Suspense, useEffect, useState } from 'react';
import { Stage } from './three/Stage';
import { useGame, game } from './game/game';
import { SCENES } from './chapters';
import { TitleScene } from './chapters/TitleScene';
import { DialogBox, HintBar } from './ui/DialogBox';
import { Hud } from './ui/Hud';
import { ChapterClear, Ending, Flash, Loading, TitleScreen } from './ui/Screens';
import { ui } from './ui/tunnel';
import { bus } from './game/bus';
import { playSfx, type SfxName } from './audio/sfx';
import { installDebug } from './debug';

bus.on('sfx', (n) => playSfx(n as SfxName));
if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) installDebug();

export function App() {
  const screen = useGame((s) => s.screen);
  const chapter = useGame((s) => s.chapter);
  const runId = useGame((s) => s.runId);
  const [lost, setLost] = useState(false);
  const Scene = SCENES[chapter];

  // 次の章を先読みして、切り替えを はやくする
  useEffect(() => {
    if (screen === 'clear') {
      const next = chapter + 1;
      const loaders = [
        () => import('./chapters/ch2-micro/Scene'),
        () => import('./chapters/ch3-curd/Scene'),
        () => import('./chapters/ch4-maker/Scene'),
        () => import('./chapters/ch5-aging/Scene'),
        () => import('./chapters/ch6-shop/Scene'),
      ];
      void loaders[next - 1]?.();
    }
  }, [screen, chapter]);

  return (
    <div className="app">
      <Stage onLost={() => setLost(true)}>
        {screen === 'title' ? (
          <TitleScene key={'title' + runId} />
        ) : (
          <Suspense fallback={null}>
            <Scene key={runId} />
          </Suspense>
        )}
      </Stage>

      <div className="layer">
        {screen === 'title' && <TitleScreen />}
        {screen !== 'title' && (
          <>
            <ui.Out />
            <HintBar />
            <DialogBox />
            <Hud />
          </>
        )}
        {screen === 'clear' && <ChapterClear />}
        {screen === 'ending' && <Ending />}
      </div>
      <Loading />
      <Flash />
      {lost && (
        <div className="screen dim lost">
          <div className="card">
            <h2>ひとやすみ ニャ</h2>
            <p>がめんが つかれちゃったみたい。 もういちど よみこもう。</p>
            <div className="row">
              <button className="btn" onClick={() => window.location.reload()}>
                よみこみなおす
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 開発中の確認用
export { game };
