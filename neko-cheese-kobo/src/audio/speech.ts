import { useProgress } from '../game/progress';
import { toSpeech } from '../game/ruby';
import type { Speaker } from '../game/types';

/**
 * ブラウザ標準の音声読み上げ（Web Speech API）で、ねこが日本語で話す。
 * 使えない環境では何もしない（字幕と口パクだけで進行できる）。
 */
const synth: SpeechSynthesis | null =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

let voice: SpeechSynthesisVoice | null = null;
let current: SpeechSynthesisUtterance | null = null;
let safety: ReturnType<typeof setTimeout> | null = null;

const PREFERRED = ['Kyoko', 'O-Ren', 'Nanami', 'Google 日本語', 'Haruka', 'Ayumi', 'Sayaka', 'Hattori'];

function pickVoice() {
  if (!synth) return;
  const list = synth.getVoices().filter((v) => /^ja(-|_|$)/i.test(v.lang));
  if (!list.length) return;
  for (const name of PREFERRED) {
    const v = list.find((x) => x.name.includes(name));
    if (v) {
      voice = v;
      return;
    }
  }
  voice = list.find((v) => v.localService) ?? list[0];
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

function clearSafety() {
  if (safety) clearTimeout(safety);
  safety = null;
}

export const speech = {
  get available() {
    return Boolean(synth);
  },

  /** iOS では最初の一回をタップの中で鳴らす必要がある */
  unlock() {
    if (!synth) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'ja-JP';
      synth.speak(u);
    } catch {
      /* noop */
    }
  },

  speak(text: string, who: Speaker, onStart?: () => void, onEnd?: () => void) {
    speech.cancel();
    if (!synth || !useProgress.getState().settings.voice || who === 'girl') {
      onEnd?.();
      return false;
    }
    const plain = toSpeech(text);
    if (!plain.trim()) {
      onEnd?.();
      return false;
    }
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = 'ja-JP';
    if (voice) u.voice = voice;
    if (who === 'milk') {
      u.pitch = 1.55;
      u.rate = 1.02;
    } else {
      u.pitch = 1.0;
      u.rate = 0.95;
    }
    u.volume = 1;
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      clearSafety();
      if (current === u) current = null;
      onEnd?.();
    };
    u.onstart = () => onStart?.();
    u.onend = finish;
    u.onerror = finish;
    current = u;
    try {
      synth.speak(u);
      if (synth.paused) synth.resume();
    } catch {
      finish();
      return false;
    }
    // iOS などで onend が来ないことがあるので保険
    safety = setTimeout(finish, 2500 + plain.length * 260);
    return true;
  },

  cancel() {
    clearSafety();
    current = null;
    if (synth && (synth.speaking || synth.pending)) {
      try {
        synth.cancel();
      } catch {
        /* noop */
      }
    }
  },
};

useProgress.subscribe((s, prev) => {
  if (prev.settings.voice && !s.settings.voice) speech.cancel();
});
