import { useState } from 'react';
import { useGame, game } from '../game/game';
import { useProgress } from '../game/progress';
import { CHAPTERS } from '../game/chapterMeta';
import { HomeIcon, SoundIcon, VoiceIcon } from './Icons';
import { playSfx } from '../audio/sfx';
import { speech } from '../audio/speech';

export function Hud() {
  const chapter = useGame((s) => s.chapter);
  const settings = useProgress((s) => s.settings);
  const setSetting = useProgress((s) => s.setSetting);
  const [confirm, setConfirm] = useState(false);
  const meta = CHAPTERS[chapter];
  return (
    <>
      <div className="hud">
        <button className="icon-btn" aria-label="タイトルへ" onClick={() => setConfirm(true)}>
          <HomeIcon />
        </button>
        <div className="chapter-pill">
          <small>{meta.label}</small>
          {meta.title}
        </div>
        <div className="spacer" />
        {speech.available && (
          <button
            className={`icon-btn ${settings.voice ? '' : 'off'}`}
            aria-label={settings.voice ? 'こえを けす' : 'こえを だす'}
            aria-pressed={settings.voice}
            onClick={() => setSetting('voice', !settings.voice)}
          >
            <VoiceIcon on={settings.voice} />
          </button>
        )}
        <button
          className={`icon-btn ${settings.sound ? '' : 'off'}`}
          aria-label={settings.sound ? 'おとを けす' : 'おとを だす'}
          aria-pressed={settings.sound}
          onClick={() => {
            setSetting('sound', !settings.sound);
            if (!settings.sound) setTimeout(() => playSfx('pop'), 30);
          }}
        >
          <SoundIcon on={settings.sound} />
        </button>
      </div>
      {confirm && (
        <div className="screen dim" onClick={() => setConfirm(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h2>タイトルに もどる？</h2>
            <p>
              この おはなしは さいしょから に なるよ。
              <br />
              あつめた スタンプは きえないよ。
            </p>
            <div className="row">
              <button className="btn" onClick={() => game.toTitle()}>
                もどる
              </button>
              <button className="btn sub" onClick={() => setConfirm(false)}>
                つづける
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
