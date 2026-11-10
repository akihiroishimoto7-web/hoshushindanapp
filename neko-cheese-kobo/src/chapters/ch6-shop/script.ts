import type { Step } from '../../game/types';

/**
 * さいしゅうしょう ねこの チーズショップ
 * 学ぶこと: チーズの しゅるいで つくりかた・じゅくせいが ちがう（同じ工程から全部できるわけではない）／
 *           うし いがいの ミルクの チーズも ある／チーズの いろ（カロテン・アナトー・まっしろな チーズ）
 */
export const script: Step[] = [
  { t: 'say', text: 'いらっしゃいませ〜！ きみの チーズを たなに かざろう！', face: 'excited', gesture: 'wave', sfx: 'bell' },
  { t: 'task', id: 'place', hint: 'かごの なかの きみの チーズを タッチしよう', target: 'basket' },
  { t: 'say', text: 'いちばん めだつよ！ ほかの チーズも タッチして、 まわしたり きったり してみて。', face: 'proud', sfx: 'success' },
  { t: 'task', id: 'inspect', hint: 'チーズを タッチして 3しゅるい しらべよう', target: 'shelf' },
  {
    t: 'say',
    text: 'つくりかたや ねかせる じかんが ちがうから、 こんなに ちがう チーズに なるんだ。 きいろも しろも あるね。',
    face: 'gentle',
  },
  {
    t: 'say',
    text: 'チーズって、 うしさんと、 ちいさな いきものと、 しょくにんさんが ちからを あわせて つくるんだニャ！',
    face: 'proud',
    gesture: 'clap',
    event: 'cam:all',
  },
  { t: 'say', text: 'こんど チーズを たべるとき、 きょうの ぼうけんを おもいだしてニャ！ また あそぼうね！', face: 'love', gesture: 'cheer', sfx: 'success' },
  { t: 'end' },
];
