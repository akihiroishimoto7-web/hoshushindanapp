import type { Step } from '../../game/types';

/**
 * さいしゅうしょう ねこの チーズショップ
 * 学ぶこと: チーズの しゅるいで つくりかた・じゅくせいが ちがう（同じ工程から全部できるわけではない）／
 *           うし いがいの ミルクの チーズも ある／チーズの いろ（カロテン・アナトー・まっしろな チーズ）
 */
export const script: Step[] = [
  { t: 'say', text: 'いらっしゃいませ〜！ ここが ぼくの チーズショップ だニャ！', face: 'excited', gesture: 'wave', sfx: 'bell' },
  { t: 'say', text: 'まずは きみが つくった チーズを、 たなの まんなかに かざろう！', face: 'happy', gesture: 'point' },
  { t: 'task', id: 'place', hint: 'かごの なかの きみの チーズを タッチしよう', target: 'basket' },
  { t: 'say', text: 'いちばん めだつ ところに かざったよ。 おきゃくさんも みてるニャ！', face: 'proud', sfx: 'success' },
  {
    t: 'say',
    text: 'ほかの チーズも みてみよう。 チーズを タッチすると、 ゆびで まわしたり、 おおきく したり、 きって なかを みたり できるよ。',
    face: 'happy',
  },
  { t: 'task', id: 'inspect', hint: 'チーズを タッチして 3しゅるい しらべよう', target: 'shelf' },
  {
    t: 'say',
    text: 'どれも ミルクから できる チーズ なのに、 つくりかたや ねかせる じかんが ちがうから、 こんなに ちがう チーズに なるんだ。',
    face: 'gentle',
  },
  {
    t: 'say',
    text: 'それに、 うし だけじゃ なくて、 やぎや ひつじ、 すいぎゅうの ミルクから つくる チーズも あるんだよ。',
    face: 'normal',
  },
  {
    t: 'choice',
    text: 'さいしょに 「しろい ぎゅうにゅうが どうして チーズに なるの？」って はなしたよね。 じゃあ、 チーズの きいろは どこから きたと おもう？',
    face: 'think',
    gesture: 'tilt',
    options: [
      { label: 'うしさんの たべた くさ？', reply: [{ t: 'say', text: 'すごい！ だいせいかい！', face: 'excited', gesture: 'jump', sfx: 'success' }] },
      { label: 'いろを ぬった？', reply: [{ t: 'say', text: 'じつは それも ある！ でも ほかにも りゆうが あるんだ。', face: 'wink' }] },
      { label: 'わからない', reply: [{ t: 'say', text: 'いっしょに みてみよう！', face: 'gentle' }] },
    ],
    after: [
      {
        t: 'say',
        text: 'うすい きいろは、 うしさんが たべた くさの いろ（カロテン）が、 ミルクの あぶらに とけているから なんだ。',
        face: 'normal',
      },
      {
        t: 'say',
        text: 'オレンジいろの チェダーは、 しょくぶつの たねから とった いろ（アナトー）で いろを つけて いるよ。',
        face: 'normal',
      },
      {
        t: 'say',
        text: 'そして モッツァレラみたいに、 まっしろな チーズも ある。 チーズが ぜんぶ きいろに なるわけじゃ ないんだね。',
        face: 'happy',
      },
    ],
  },
  {
    t: 'say',
    text: 'チーズって、 うしさんと、 ちいさな いきものと、 チーズしょくにんさんが ちからを あわせて つくるんだニャ！',
    face: 'proud',
    gesture: 'clap',
    event: 'cam:all',
  },
  { t: 'say', text: 'こんど チーズを たべるとき、 きょうの ぼうけんを おもいだしてニャ！', face: 'gentle', gesture: 'wave' },
  { t: 'say', text: 'きょうは きみと いっしょで、 ほんとうに たのしかった。 また いつでも あそびに きてね。 いっしょに チーズを つくろうニャ！', face: 'love', gesture: 'cheer', sfx: 'success' },
  { t: 'end' },
];
