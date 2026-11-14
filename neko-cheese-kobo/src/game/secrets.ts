import { create } from 'zustand';
import { useProgress } from './progress';
import { bus } from './bus';

/**
 * 各章に かくれている「ひみつ」。みつけると ずかんに のこる（くりかえし あそぶ たのしみ）。
 * ねずみの チュウは どの章にも 1ぴき かくれている。
 */
export interface Secret {
  id: string;
  chapter: number;
  icon: string;
  name: string;
  /** ずかんに のる ひとこと */
  note: string;
  /** まだ みつけていない ときの ヒント */
  hint: string;
}

export const SECRETS: Secret[] = [
  { id: 'mouse1', chapter: 0, icon: '🐭', name: 'ねずみの チュウ', note: 'チーズが だいすきな ともだち。 ぼくじょうでは テーブルの かげから ぎゅうにゅうを みていたよ。', hint: 'ぎゅうにゅうの テーブルの そばを よく みてみよう' },
  { id: 'clover', chapter: 0, icon: '🍀', name: 'よつばの クローバー', note: 'みつけると いいことが あるって いわれている、 4まいの はっぱ。', hint: 'みちの そばの くさの なかに……' },
  { id: 'mouse2', chapter: 1, icon: '🐭', name: 'テーブルの チュウ', note: 'むしめがねを のぞいて、 じぶんも ちいさく なれるか ためしていたよ。', hint: 'ちいさく なる まえに、 テーブルの うえを よく みてみよう' },
  { id: 'calcium', chapter: 1, icon: '🟣', name: 'カルシウムの つぶ', note: 'ほねや はを つくる ミネラル。 カゼインが てを つなぐのも てつだうよ。', hint: 'ぎゅうにゅうの なかに、 むらさきの つぶが ただよっているよ' },
  { id: 'mouse3', chapter: 2, icon: '🐭', name: 'なべの したの チュウ', note: 'あたたかい なべの ちかくで ぬくぬく。', hint: 'おおきな なべの あしもとを みてみよう' },
  { id: 'windowCow', chapter: 2, icon: '🐮', name: 'まどの うしさん', note: 'じぶんの ぎゅうにゅうが どう なるのか、 きに なって のぞきに きたみたい。', hint: 'こうぼうの まどを タッチしてみよう' },
  { id: 'mouse4', chapter: 3, icon: '🐭', name: 'バケツの かげの チュウ', note: 'ホエイの バケツの そばで、 おこぼれを まっていたよ。', hint: 'なべと テーブルの あいだの ゆかに……' },
  { id: 'bird', chapter: 3, icon: '🐦', name: 'バケツの ことり', note: 'ホエイの バケツで 水あびを していたよ。 チーズづくりの おとに さそわれたみたい。', hint: 'ホエイの バケツを タッチしてみよう' },
  { id: 'mouse5', chapter: 4, icon: '🐭', name: 'じゅくせいこの チュウ', note: 'チーズの においに つられて、 じゅくせいこまで ついてきたよ。', hint: 'まんなかの だいの うえを よく みてみよう' },
  { id: 'oldCheese', chapter: 4, icon: '🧀', name: '3ねん ねた チーズ', note: 'パルミジャーノ・レッジャーノの なかまは、 1ねん いじょう、 ながいと 3ねんも ねかせるよ。', hint: 'へやの おくに、 とくべつ おおきな チーズが あるよ' },
  { id: 'mouse6', chapter: 5, icon: '🐭', name: 'おきゃくさんの チュウ', note: 'おこづかいを にぎって、 チーズを かいに きたよ。', hint: 'チーズの たなの ひだりの はしっこに……' },
  { id: 'goat', chapter: 5, icon: '🐐', name: 'やぎの チーズ', note: 'やぎの ミルクは カロテンが すくないから、 チーズは まっしろに なるよ。', hint: 'チーズの たなの みぎの はしっこに、 まっしろな チーズが あるよ' },
];

export function secretsOf(chapter: number) {
  return SECRETS.filter((s) => s.chapter === chapter);
}

/** 画面の うえに でる おしらせ */
export interface Toast {
  n: number;
  kind: 'secret' | 'praise' | 'info';
  icon?: string;
  title: string;
  text?: string;
}
export const useToast = create<{ toast: Toast | null }>(() => ({ toast: null }));
let toastN = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(t: Omit<Toast, 'n'>, ms = 2400) {
  toastN++;
  useToast.setState({ toast: { ...t, n: toastN } });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => useToast.setState({ toast: null }), ms);
}

/** ひみつを みつけた！ はじめてなら true */
export function findSecret(id: string): boolean {
  const def = SECRETS.find((s) => s.id === id);
  if (!def) return false;
  const fresh = useProgress.getState().addSecret(id);
  if (fresh) {
    bus.emit('sfx', 'secret');
    const got = secretsOf(def.chapter).filter((s) => useProgress.getState().secrets.includes(s.id)).length;
    showToast({ kind: 'secret', icon: def.icon, title: 'ひみつ はっけん！', text: `${def.name}（${got}/${secretsOf(def.chapter).length}）` }, 3200);
  }
  return fresh;
}

const PRAISE = ['できた！', 'いいね！', 'じょうず！', 'やったね！', 'ナイス！', 'そのちょうし！'];
let praiseN = 0;
export function praise() {
  showToast({ kind: 'praise', title: PRAISE[praiseN++ % PRAISE.length] }, 1300);
}
