import { getAudio } from './context';
import { useProgress } from '../game/progress';

/**
 * オルゴール風の BGM を Web Audio でその場で演奏する。
 * 章ごとにテーマ（メロディ・テンポ）が変わる。
 */
interface Theme {
  bpm: number;
  /** 8分音符ごとの MIDI ノート（-1 は休み） */
  melody: number[];
  /** 4ステップごとのベース */
  bass: number[];
  /** 伴奏の分散和音を鳴らすか */
  arp?: boolean;
}

const THEMES: Theme[] = [
  // 0: タイトル・牧場（明るく のどか）
  {
    bpm: 100,
    melody: [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 81, 84, 83, 81, 79, -1, 81, 79, 76, 74, 72, 74, 76, 79, 77, 76, 74, 72, 74, -1, 72, -1],
    bass: [48, 48, 53, 55, 53, 48, 50, 48],
  },
  // 1: ミクロの世界（ふしぎで やさしい）
  {
    bpm: 84,
    melody: [81, -1, 84, 88, 86, -1, 84, -1, 79, -1, 81, 84, 83, -1, -1, -1, 81, -1, 84, 88, 89, -1, 88, 86, 84, -1, 83, -1, 81, -1, -1, -1],
    bass: [45, 45, 41, 43, 45, 45, 41, 40],
    arp: true,
  },
  // 2: 工房（はずむ）
  {
    bpm: 108,
    melody: [72, 74, 76, 77, 79, -1, 79, -1, 81, 79, 77, 76, 74, -1, -1, -1, 77, 76, 74, 72, 74, -1, 76, -1, 77, 79, 76, 74, 72, -1, -1, -1],
    bass: [53, 53, 50, 55, 53, 53, 55, 48],
  },
  // 3: しょくにん（たのしく）
  {
    bpm: 112,
    melody: [79, 76, 79, 81, 79, 76, 72, -1, 74, 76, 77, 79, 76, -1, 74, -1, 79, 76, 79, 84, 83, 81, 79, -1, 77, 74, 76, 72, 74, -1, 72, -1],
    bass: [48, 45, 41, 43, 48, 45, 41, 43],
  },
  // 4: 熟成庫（ゆったり）
  {
    bpm: 76,
    melody: [74, -1, 77, -1, 81, -1, 79, 77, 76, -1, 74, -1, 73, -1, -1, -1, 74, -1, 77, -1, 82, -1, 81, 79, 77, -1, 76, -1, 74, -1, -1, -1],
    bass: [50, 50, 46, 45, 50, 50, 46, 45],
    arp: true,
  },
  // 5: ショップ・エンディング（うれしい）
  {
    bpm: 112,
    melody: [79, 83, 86, 83, 84, 81, 79, -1, 76, 79, 81, 79, 78, -1, 74, -1, 79, 83, 86, 88, 86, 84, 83, -1, 81, 79, 78, 81, 79, -1, -1, -1],
    bass: [43, 40, 48, 50, 43, 40, 50, 43],
  },
];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let theme = -1;
let step = 0;
let nextTime = 0;
let interval: ReturnType<typeof setInterval> | null = null;
const BASE_VOL = 0.13;
let duck = 1;

function enabled() {
  const s = useProgress.getState().settings;
  return s.music && s.sound;
}

function bell(freq: number, t: number, vol: number, dur: number) {
  const a = getAudio();
  if (!a) return;
  const o1 = a.ctx.createOscillator();
  const o2 = a.ctx.createOscillator();
  o1.type = 'sine';
  o2.type = 'sine';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 3.01;
  const g = a.ctx.createGain();
  const g2 = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g2.gain.value = 0.18;
  o1.connect(g);
  o2.connect(g2).connect(g);
  g.connect(a.music);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.05);
  o2.stop(t + dur + 0.05);
}

function softBass(freq: number, t: number, vol: number, dur: number) {
  const a = getAudio();
  if (!a) return;
  const o = a.ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.music);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function tick() {
  const a = getAudio();
  if (!a || theme < 0 || a.ctx.state !== 'running') return;
  const th = THEMES[theme];
  const stepDur = 60 / th.bpm / 2;
  if (nextTime < a.ctx.currentTime - 0.5) nextTime = a.ctx.currentTime + 0.05;
  while (nextTime < a.ctx.currentTime + 0.25) {
    const i = step % th.melody.length;
    const n = th.melody[i];
    if (n > 0) bell(midi(n), nextTime, 0.22, stepDur * 3.2);
    if (i % 4 === 0) {
      const b = th.bass[Math.floor(i / 4) % th.bass.length];
      softBass(midi(b), nextTime, 0.2, stepDur * 3.6);
    }
    if (th.arp && i % 2 === 1) {
      const b = th.bass[Math.floor(i / 4) % th.bass.length] + 24;
      const chord = [0, 7, 12, 16];
      bell(midi(b + chord[(i >> 1) % 4]), nextTime, 0.06, stepDur * 2);
    }
    nextTime += stepDur;
    step++;
  }
}

function applyVolume() {
  const a = getAudio();
  if (!a) return;
  const target = enabled() && theme >= 0 ? BASE_VOL * duck : 0;
  a.music.gain.cancelScheduledValues(a.ctx.currentTime);
  a.music.gain.setTargetAtTime(target, a.ctx.currentTime, 0.4);
}

export const music = {
  setTheme(i: number) {
    const a = getAudio();
    if (!a) return;
    const next = i < 0 ? 0 : Math.min(i, THEMES.length - 1);
    if (next !== theme) {
      theme = next;
      step = 0;
      nextTime = a.ctx.currentTime + 0.3;
    }
    if (!interval) interval = setInterval(tick, 60);
    applyVolume();
  },
  /** ねこが しゃべっている間は 少し小さく */
  duck(on: boolean) {
    duck = on ? 0.45 : 1;
    applyVolume();
  },
  refresh() {
    applyVolume();
  },
};

useProgress.subscribe((s, prev) => {
  if (s.settings !== prev.settings) applyVolume();
});
