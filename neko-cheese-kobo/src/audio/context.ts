/**
 * Web Audio の共有コンテキスト。
 * iPhone Safari は「ユーザーがタップした瞬間」にしか音を鳴らせないので、
 * タイトル画面の「あそぶ」ボタンで unlock() を呼ぶ。
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

type AnyWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function getAudio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as AnyWindow).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.0;
    musicBus.connect(master);
  }
  return { ctx: ctx!, master: master!, sfx: sfxBus!, music: musicBus! };
}

/**
 * iPhone 対策
 *  1. マナーモード（消音スイッチ）でも 鳴るように、音の種類を「再生（playback）」にする
 *     - Safari 17 以降: navigator.audioSession.type = 'playback'
 *     - それより前: 無音の <audio> を ループ再生すると、Web Audio も 消音スイッチの 影響を うけなくなる
 *  2. 止まった（suspended / interrupted）ときは、つぎに さわった 瞬間に かならず 再開する
 */
let silent: HTMLAudioElement | null = null;

function silentWavUrl() {
  const rate = 8000;
  const n = rate / 2;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function playbackSession() {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession && nav.audioSession.type !== 'playback') nav.audioSession.type = 'playback';
  } catch {
    /* noop */
  }
  try {
    if (!silent) {
      silent = document.createElement('audio');
      silent.src = silentWavUrl();
      silent.loop = true;
      silent.setAttribute('playsinline', '');
      silent.setAttribute('x-webkit-airplay', 'deny');
      silent.preload = 'auto';
    }
    if (silent.paused) void silent.play().catch(() => {});
  } catch {
    /* noop */
  }
}

export function unlockAudio() {
  playbackSession();
  const a = getAudio();
  if (!a) return;
  if (a.ctx.state !== 'running') void a.ctx.resume().catch(() => {});
  // iOS 向け: タップの中で 無音を 一度 鳴らして 出力を 有効化
  try {
    const b = a.ctx.createBuffer(1, 1, 22050);
    const s = a.ctx.createBufferSource();
    s.buffer = b;
    s.connect(a.master);
    s.start(0);
  } catch {
    /* noop */
  }
}

/** いま 音が 鳴らせる 状態か（鳴らせないなら つぎの タップで 再開を ためす） */
export function audioReady() {
  return Boolean(ctx && ctx.state === 'running');
}

export function noise() {
  const a = getAudio();
  if (!a) return null;
  if (!noiseBuf) {
    const len = a.ctx.sampleRate * 2;
    noiseBuf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// タブを裏にしたら音を止め、戻ったら再開。
// iPhone は 自動では 再開できない ことが あるので、画面に さわるたびに 確認して 再開する。
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      void ctx.suspend().catch(() => {});
      silent?.pause();
    } else void ctx.resume().catch(() => {});
  });
  const wake = () => {
    if (!ctx || ctx.state !== 'running' || (silent && silent.paused)) unlockAudio();
  };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach((ev) => document.addEventListener(ev, wake, { capture: true, passive: true }));
}

/** テスト用: 音の 状態 */
export function audioDebug() {
  return { state: ctx?.state ?? 'none', silentPlaying: Boolean(silent && !silent.paused) };
}
