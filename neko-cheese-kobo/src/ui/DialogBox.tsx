import { useEffect, useMemo, useRef, useState } from 'react';
import { dialog, useCat, useDialog } from '../game/dialog';
import { parseRuby, sliceSegs, unitLength } from '../game/ruby';
import { speech } from '../audio/speech';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { RubyText } from './RubyText';
import { PawIcon } from './Icons';

const CHAR_MS = 42;

/**
 * 会話ウィンドウ。文字が 1つずつ出て、ねこが しゃべる（読み上げ）。
 * タップ: 文字送り中 → 全部表示 / 表示ずみ → つぎへ
 */
export function DialogBox() {
  const line = useDialog((s) => s.line);
  const choices = useDialog((s) => s.choices);
  const segs = useMemo(() => (line ? parseRuby(line.text) : []), [line]);
  const total = useMemo(() => unitLength(segs), [segs]);
  const [shown, setShown] = useState(0);
  const [voiceDone, setVoiceDone] = useState(true);
  const lineRef = useRef(line?.id ?? 0);
  const typing = shown < total;

  // 新しい台詞
  useEffect(() => {
    if (!line) {
      useCat.setState({ talking: false });
      music.duck(false);
      return;
    }
    lineRef.current = line.id;
    setShown(0);
    setVoiceDone(false);
    const id = line.id;
    const spoke = speech.speak(
      line.text,
      line.who,
      () => {
        if (lineRef.current === id && line.who === 'milk') useCat.setState({ talking: true });
        music.duck(true);
      },
      () => {
        if (lineRef.current !== id) return;
        setVoiceDone(true);
        music.duck(false);
      },
    );
    if (!spoke) setVoiceDone(true);
    if (line.who === 'milk') useCat.setState({ talking: true });
  }, [line]);

  // 文字送り
  useEffect(() => {
    if (!line || shown >= total) return;
    const tm = setTimeout(() => setShown((n) => n + 1), CHAR_MS);
    return () => clearTimeout(tm);
  }, [line, shown, total]);

  // 口パクは「文字送り中」か「読み上げ中」
  useEffect(() => {
    if (!line) return;
    useCat.setState({ talking: line.who === 'milk' && (typing || !voiceDone) });
  }, [line, typing, voiceDone]);

  // 自動で次へ
  useEffect(() => {
    if (!line?.auto || typing) return;
    const tm = setTimeout(() => {
      if (lineRef.current === line.id) dialog.advance();
    }, line.auto);
    return () => clearTimeout(tm);
  }, [line, typing]);

  if (!line) return null;

  const onTap = () => {
    if (choices && !typing) return;
    if (typing) {
      setShown(total);
      return;
    }
    playSfx('tap');
    speech.cancel();
    dialog.advance();
  };

  const visible = sliceSegs(segs, shown);
  const who = line.who;

  return (
    <div className="dialog" data-testid="dialog">
      <div className={`bubble ${who}`} onClick={onTap} role="button" aria-label="つぎへ" data-testid="bubble">
        <div className="name-tag">
          {who === 'milk' ? (
            <>
              <PawIcon /> ミルク
            </>
          ) : (
            'わたし'
          )}
        </div>
        <span aria-hidden={typing}>
          <RubyText segs={visible} />
        </span>
        {!typing && !choices && <span className="next-mark">▼</span>}
      </div>
      {choices && !typing && (
        <div className="choices" data-testid="choices">
          {choices.map((c, i) => (
            <button
              key={line.id + ':' + i}
              className="choice"
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => {
                playSfx('pop');
                speech.cancel();
                dialog.choose(i);
              }}
            >
              <span className="tag">{'ABCD'[i]}</span>
              <span>
                <RubyText segs={parseRuby(c)} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HintBar() {
  const task = useDialog((s) => s.task);
  const line = useDialog((s) => s.line);
  if (!task || line) return null;
  const segs = parseRuby(task.hint);
  return (
    <div className="hint" key={task.id} data-testid="hint">
      <span className="hand">👆</span>
      <span>
        <RubyText segs={segs} />
        {task.progress && <span className="progress">{task.progress}</span>}
      </span>
    </div>
  );
}
