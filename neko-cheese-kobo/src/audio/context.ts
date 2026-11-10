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

export function unlockAudio() {
  const a = getAudio();
  if (!a) return;
  if (a.ctx.state !== 'running') void a.ctx.resume().catch(() => {});
  // iOS 向け: 無音を一度だけ鳴らして出力を有効化
  const b = a.ctx.createBuffer(1, 1, 22050);
  const s = a.ctx.createBufferSource();
  s.buffer = b;
  s.connect(a.master);
  s.start(0);
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

// タブを裏にしたら音を止め、戻ったら再開
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend().catch(() => {});
    else void ctx.resume().catch(() => {});
  });
}
