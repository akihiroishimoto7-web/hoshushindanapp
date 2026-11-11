import { getAudio, noise } from './context';
import { useProgress } from '../game/progress';

/**
 * 効果音はすべて Web Audio で合成する（音声ファイル不要・オフラインでも鳴る）。
 */
export type SfxName =
  | 'tap'
  | 'pop'
  | 'moo'
  | 'mooSmall'
  | 'meow'
  | 'chirp'
  | 'sparkle'
  | 'success'
  | 'pour'
  | 'bubble'
  | 'squish'
  | 'cut'
  | 'door'
  | 'tick'
  | 'whoosh'
  | 'munch'
  | 'thud'
  | 'shake'
  | 'stamp'
  | 'drip'
  | 'magic'
  | 'boing'
  | 'bell'
  | 'purr'
  | 'yay'
  | 'secret'
  | 'squeak'
  | 'plop'
  | 'ting';

type A = NonNullable<ReturnType<typeof getAudio>>;

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(
  a: A,
  type: OscillatorType,
  f0: number,
  f1: number,
  dur: number,
  vol: number,
  when = 0,
  attack = 0.008,
) {
  const t = a.ctx.currentTime + when;
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  env(g, t, attack, vol, dur);
  o.connect(g).connect(a.sfx);
  o.start(t);
  o.stop(t + attack + dur + 0.05);
}

function noiseBurst(
  a: A,
  dur: number,
  vol: number,
  filter: BiquadFilterType,
  freq: number,
  q = 1,
  when = 0,
  attack = 0.005,
  freqEnd?: number,
) {
  const buf = noise();
  if (!buf) return;
  const t = a.ctx.currentTime + when;
  const s = a.ctx.createBufferSource();
  s.buffer = buf;
  const f = a.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  f.Q.value = q;
  const g = a.ctx.createGain();
  env(g, t, attack, vol, dur);
  s.connect(f).connect(g).connect(a.sfx);
  s.start(t, Math.random() * 1.5);
  s.stop(t + attack + dur + 0.05);
}

function moo(a: A, small: boolean) {
  const t = a.ctx.currentTime;
  const base = small ? 210 : 118;
  const dur = small ? 0.8 : 1.35;
  const out = a.ctx.createGain();
  env(out, t, 0.12, small ? 0.22 : 0.3, dur);
  const lp = a.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.35);
  lp.frequency.linearRampToValueAtTime(600, t + dur);
  const form = a.ctx.createBiquadFilter();
  form.type = 'peaking';
  form.frequency.value = small ? 900 : 650;
  form.gain.value = 9;
  form.Q.value = 1.5;
  [0, 1.007].forEach((detune, i) => {
    const o = a.ctx.createOscillator();
    o.type = 'sawtooth';
    const f = base * (detune || 1);
    o.frequency.setValueAtTime(f * 0.92, t);
    o.frequency.linearRampToValueAtTime(f * 1.12, t + dur * 0.3);
    o.frequency.linearRampToValueAtTime(f * 0.86, t + dur);
    const vib = a.ctx.createOscillator();
    const vg = a.ctx.createGain();
    vib.frequency.value = 5.5;
    vg.gain.value = f * 0.015;
    vib.connect(vg).connect(o.frequency);
    o.connect(lp);
    o.start(t + i * 0.01);
    vib.start(t);
    o.stop(t + dur + 0.2);
    vib.stop(t + dur + 0.2);
  });
  lp.connect(form).connect(out).connect(a.sfx);
}

function meow(a: A) {
  const t = a.ctx.currentTime;
  const dur = 0.55;
  const o = a.ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(560, t);
  o.frequency.linearRampToValueAtTime(880, t + 0.16);
  o.frequency.linearRampToValueAtTime(620, t + dur);
  const bp = a.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.linearRampToValueAtTime(1800, t + 0.15);
  bp.frequency.linearRampToValueAtTime(1000, t + dur);
  bp.Q.value = 1.2;
  const g = a.ctx.createGain();
  env(g, t, 0.05, 0.35, dur);
  o.connect(bp).connect(g).connect(a.sfx);
  o.start(t);
  o.stop(t + dur + 0.1);
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export function playSfx(name: SfxName) {
  if (!useProgress.getState().settings.sound) return;
  const a = getAudio();
  if (!a) return;
  // 再開まちでも 予約しておけば、再開した 瞬間に 鳴る（タップ直後の 音が 消えないように）
  if (a.ctx.state !== 'running') void a.ctx.resume().catch(() => {});
  switch (name) {
    case 'tap':
      tone(a, 'sine', 880, 620, 0.08, 0.18);
      break;
    case 'pop':
      tone(a, 'sine', 320, 980, 0.1, 0.25);
      break;
    case 'moo':
      moo(a, false);
      break;
    case 'mooSmall':
      moo(a, true);
      break;
    case 'meow':
      meow(a);
      break;
    case 'chirp':
      for (let i = 0; i < 3; i++) tone(a, 'sine', 2600 + Math.random() * 600, 3800, 0.07, 0.08, i * 0.11);
      break;
    case 'sparkle':
      for (let i = 0; i < 5; i++) {
        const f = PENTA[Math.floor(Math.random() * PENTA.length)] * 2;
        tone(a, 'sine', f, f * 0.98, 0.35, 0.06, i * 0.06);
      }
      break;
    case 'success': {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        tone(a, 'triangle', f, f, 0.5, 0.16, i * 0.1);
        tone(a, 'sine', f * 2, f * 2, 0.4, 0.05, i * 0.1);
      });
      break;
    }
    case 'pour':
      noiseBurst(a, 1.6, 0.22, 'bandpass', 700, 0.8, 0, 0.15, 1100);
      break;
    case 'bubble':
      tone(a, 'sine', 220 + Math.random() * 120, 700 + Math.random() * 300, 0.1, 0.18);
      break;
    case 'squish': {
      const t = a.ctx.currentTime;
      const o = a.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.35);
      const lfo = a.ctx.createOscillator();
      const lg = a.ctx.createGain();
      lfo.frequency.value = 18;
      lg.gain.value = 30;
      lfo.connect(lg).connect(o.frequency);
      const g = a.ctx.createGain();
      env(g, t, 0.01, 0.3, 0.4);
      o.connect(g).connect(a.sfx);
      o.start(t);
      lfo.start(t);
      o.stop(t + 0.5);
      lfo.stop(t + 0.5);
      break;
    }
    case 'cut':
      noiseBurst(a, 0.22, 0.25, 'highpass', 1800, 0.7, 0, 0.01, 5000);
      break;
    case 'door': {
      const t = a.ctx.currentTime;
      const o = a.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(70, t);
      o.frequency.linearRampToValueAtTime(110, t + 0.6);
      o.frequency.linearRampToValueAtTime(80, t + 1.3);
      const lp = a.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      lp.Q.value = 6;
      const g = a.ctx.createGain();
      env(g, t, 0.15, 0.14, 1.3);
      o.connect(lp).connect(g).connect(a.sfx);
      o.start(t);
      o.stop(t + 1.6);
      noiseBurst(a, 0.25, 0.25, 'lowpass', 300, 1, 1.25);
      break;
    }
    case 'tick':
      tone(a, 'square', 2200, 2000, 0.025, 0.05);
      break;
    case 'whoosh':
      noiseBurst(a, 1.0, 0.3, 'bandpass', 300, 1.2, 0, 0.3, 3000);
      break;
    case 'munch':
      for (let i = 0; i < 3; i++) noiseBurst(a, 0.06, 0.18, 'lowpass', 900, 1, i * 0.12);
      break;
    case 'thud':
      tone(a, 'sine', 130, 50, 0.25, 0.4);
      noiseBurst(a, 0.08, 0.15, 'lowpass', 400);
      break;
    case 'shake':
      for (let i = 0; i < 4; i++) noiseBurst(a, 0.05, 0.15, 'highpass', 4000, 1, i * 0.07);
      break;
    case 'stamp':
      tone(a, 'sine', 160, 60, 0.18, 0.45);
      noiseBurst(a, 0.1, 0.2, 'lowpass', 600);
      [783.99, 1046.5, 1318.5].forEach((f, i) => tone(a, 'triangle', f, f, 0.6, 0.12, 0.18 + i * 0.09));
      break;
    case 'drip':
      tone(a, 'sine', 900, 1500, 0.06, 0.12);
      break;
    case 'magic': {
      for (let i = 0; i < 9; i++) {
        const f = PENTA[i % PENTA.length] * (i > 4 ? 2 : 1);
        tone(a, 'sine', f, f, 0.4, 0.07, i * 0.05);
      }
      break;
    }
    case 'boing':
      tone(a, 'sine', 300, 600, 0.12, 0.2);
      tone(a, 'sine', 600, 250, 0.2, 0.15, 0.1);
      break;
    case 'bell':
      tone(a, 'sine', 1568, 1560, 0.9, 0.12);
      tone(a, 'sine', 2350, 2340, 0.6, 0.05);
      break;
    case 'purr': {
      // ゴロゴロ（ひくい音を こまかく ふるわせる）
      const t = a.ctx.currentTime;
      const o = a.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 46;
      const lp = a.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      const trem = a.ctx.createOscillator();
      const tg = a.ctx.createGain();
      trem.frequency.value = 24;
      tg.gain.value = 0.12;
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.15);
      g.gain.linearRampToValueAtTime(0.16, t + 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + 1.1);
      trem.connect(tg).connect(g.gain);
      o.connect(lp).connect(g).connect(a.sfx);
      o.start(t);
      trem.start(t);
      o.stop(t + 1.2);
      trem.stop(t + 1.2);
      break;
    }
    case 'yay': {
      // できた！の みじかい ファンファーレ
      [659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(a, 'triangle', f, f, 0.22, 0.14, i * 0.07);
        tone(a, 'sine', f * 2, f * 2, 0.2, 0.04, i * 0.07);
      });
      break;
    }
    case 'secret': {
      // ひみつ はっけん！（きらきら のぼる）
      [783.99, 987.77, 1174.66, 1567.98, 1975.53].forEach((f, i) => {
        tone(a, 'sine', f, f, 0.5, 0.1, i * 0.08);
        tone(a, 'triangle', f / 2, f / 2, 0.3, 0.05, i * 0.08);
      });
      break;
    }
    case 'squeak':
      tone(a, 'sine', 1900, 2700, 0.07, 0.12);
      tone(a, 'sine', 2300, 3100, 0.07, 0.1, 0.11);
      break;
    case 'plop':
      tone(a, 'sine', 520, 180, 0.12, 0.22);
      tone(a, 'sine', 300, 900, 0.07, 0.08, 0.09);
      break;
    case 'ting': {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)] * 2;
      tone(a, 'sine', f, f, 0.5, 0.09);
      tone(a, 'sine', f * 2.01, f * 2, 0.3, 0.03);
      break;
    }
  }
}
