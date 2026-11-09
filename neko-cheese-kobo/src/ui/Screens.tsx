import { useEffect, useMemo, useState } from 'react';
import { game, useGame } from '../game/game';
import { hasProgress, useProgress, type Settings } from '../game/progress';
import { CHAPTERS } from '../game/chapterMeta';
import { unlockAudio } from '../audio/context';
import { speech } from '../audio/speech';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';

function unlockAll() {
  unlockAudio();
  speech.unlock();
  music.refresh();
}

function Stamps({ fresh }: { fresh?: number }) {
  const stamps = useProgress((s) => s.stamps);
  return (
    <div className="stamps">
      {CHAPTERS.map((c, i) => (
        <div key={c.id} className={`stamp ${stamps[i] ? 'got' : ''} ${fresh === i ? 'new' : ''}`}>
          {stamps[i] ? c.stamp : '？'}
          <span className="lbl">{stamps[i] ? c.stampName : `${i + 1}`}</span>
        </div>
      ))}
    </div>
  );
}

export function TitleScreen() {
  const [panel, setPanel] = useState<null | 'chapters' | 'settings' | 'reset'>(null);
  const progress = useProgress();
  const resume = hasProgress();
  const start = (i: number) => {
    unlockAll();
    playSfx('magic');
    game.play(i);
  };
  const next = progress.finished ? 0 : Math.min(progress.current, progress.unlocked);
  return (
    <div className="title-wrap">
      <div className="logo">
        <div className="main">
          ねこの<span className="y">チーズ</span>
          <br />
          こうぼう
        </div>
        <div className="sub">〜 ミルクから うまれる まほう 〜</div>
      </div>
      <div className="title-menu">
        <button className="btn big" data-testid="start" onClick={() => start(next)}>
          {resume && !progress.finished ? '▶ つづきから' : '▶ あそぶ'}
        </button>
        <div className="mini">
          <button
            className="btn sub"
            onClick={() => {
              unlockAll();
              playSfx('tap');
              setPanel('chapters');
            }}
          >
            📖 おはなしを えらぶ
          </button>
          <button
            className="btn sub"
            onClick={() => {
              unlockAll();
              playSfx('tap');
              setPanel('settings');
            }}
          >
            ⚙️ せってい
          </button>
        </div>
      </div>
      {panel === 'chapters' && (
        <div className="screen dim" onClick={() => setPanel(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h2>おはなしを えらぶ</h2>
            <Stamps />
            <div className="chapter-list">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  className="chapter-item"
                  disabled={i > progress.unlocked}
                  onClick={() => start(i)}
                  data-testid={`chapter-${i}`}
                >
                  <span className="em" style={{ background: c.color }}>
                    {i > progress.unlocked ? '🔒' : c.stamp}
                  </span>
                  <span>
                    <small>{c.label}</small>
                    {c.title}
                  </span>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn sub" onClick={() => setPanel(null)}>
                とじる
              </button>
            </div>
          </div>
        </div>
      )}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} onReset={() => setPanel('reset')} />}
      {panel === 'reset' && (
        <div className="screen dim" onClick={() => setPanel(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h2>さいしょから にする？</h2>
            <p>スタンプと つくった チーズが きえるよ。</p>
            <div className="row">
              <button
                className="btn pink"
                onClick={() => {
                  useProgress.getState().reset();
                  setPanel(null);
                }}
              >
                けして さいしょから
              </button>
              <button className="btn sub" onClick={() => setPanel(null)}>
                やめる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const settings = useProgress((s) => s.settings);
  const setSetting = useProgress((s) => s.setSetting);
  const rows: [keyof Settings, string, boolean][] = [
    ['voice', '🗣️ ねこの こえ（よみあげ）', speech.available],
    ['sound', '🔔 こうかおん', true],
    ['music', '🎵 おんがく', true],
  ];
  return (
    <div className="screen dim" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>せってい</h2>
        {rows
          .filter((r) => r[2])
          .map(([k, label]) => (
            <div key={k} className="toggle-row">
              <span>{label}</span>
              <button
                className={`switch ${settings[k] ? 'on' : ''}`}
                aria-pressed={settings[k]}
                aria-label={label}
                onClick={() => setSetting(k, !settings[k])}
              />
            </div>
          ))}
        {!speech.available && <p style={{ fontSize: 15 }}>この ブラウザでは よみあげが つかえないので、もじで おはなしするよ。</p>}
        <p className="parents">
          <b>おうちの かたへ</b>
          <br />
          ぎゅうにゅうから チーズが できるまでを、ねこの しょくにん「ミルク」と いっしょに たいけんする 3D えほんです。乳酸菌・レンネット・カードとホエイ・熟成などを、7さいくらいの お子さま向けに やさしく、でも科学的に まちがえないように 説明しています。乳酸菌の「かお」は わかりやすくするための 表現です。
          <br />
          声はブラウザの読み上げ機能を使います（インターネットや APIキーは不要）。進みぐあいは この端末の中だけに保存されます。
        </p>
        <div className="row">
          <button className="btn sub" onClick={onReset}>
            さいしょから
          </button>
          <button className="btn" onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChapterClear() {
  const chapter = useGame((s) => s.chapter);
  const meta = CHAPTERS[chapter];
  useEffect(() => {
    const t = setTimeout(() => playSfx('stamp'), 250);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="screen dim" data-testid="clear">
      <Confetti n={28} />
      <div className="card">
        <h2>🎉 {meta.label} クリア！</h2>
        <p>「{meta.title}」の スタンプを もらったよ！</p>
        <Stamps fresh={chapter} />
        <div className="row">
          <button className="btn big" data-testid="next" onClick={() => game.next()}>
            つぎの おはなしへ ▶
          </button>
        </div>
        <div className="row">
          <button className="btn sub" onClick={() => game.play(chapter)}>
            もういちど
          </button>
          <button className="btn sub" onClick={() => game.toTitle()}>
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}

export function Ending() {
  const cheese = useProgress((s) => s.cheese);
  const [show, setShow] = useState(true);
  useEffect(() => {
    playSfx('success');
    const t = setTimeout(() => playSfx('stamp'), 600);
    return () => clearTimeout(t);
  }, []);
  if (!show)
    return (
      <div className="panel">
        <button className="btn" onClick={() => setShow(true)}>
          🏅 にんていしょを みる
        </button>
      </div>
    );
  const kind = cheese?.type === 'soft' ? 'やわらかい' : cheese?.type === 'hard' ? 'かたい' : 'ほどよい かたさの';
  return (
    <div className="screen dim" data-testid="ending">
      <Confetti n={40} />
      <div className="card">
        <h2>🏅 チーズはかせ にんてい！</h2>
        <p>
          きみは ぎゅうにゅうから
          <br />
          {kind} チーズを つくったよ。
        </p>
        <p>
          うしさん、 ちいさな いきもの、
          <br />
          そして しょくにんの きみ。
          <br />
          みんなの ちからで できた まほうだね。
        </p>
        <Stamps />
        <div className="row">
          <button className="btn big" onClick={() => game.play(0)}>
            もういちど あそぶ
          </button>
        </div>
        <div className="row">
          <button className="btn sub" onClick={() => setShow(false)}>
            🧀 ショップを みる
          </button>
          <button className="btn sub" onClick={() => game.toTitle()}>
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}

export function Confetti({ n }: { n: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 3,
        dur: 3 + Math.random() * 3,
        color: ['#ffd34d', '#ff8fa3', '#7cc576', '#7cc8f5', '#f2a91f'][i % 5],
        rot: Math.random() * 360,
      })),
    [n],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            background: b.color,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            transform: `rotate(${b.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function Loading() {
  const ready = useGame((s) => s.sceneReady);
  const screen = useGame((s) => s.screen);
  const chapter = useGame((s) => s.chapter);
  const hide = screen === 'title' || ready;
  return (
    <div className={`loading ${hide ? 'hide' : ''}`} aria-hidden={hide}>
      <div>
        <div className="cheese">🧀</div>
        <p>
          {CHAPTERS[chapter].label}
          <br />
          じゅんび ちゅう ニャ…
        </p>
      </div>
    </div>
  );
}

export function Flash() {
  const n = useGame((s) => s.flash);
  if (!n) return null;
  return <div key={n} className="flash" />;
}
