import type { Step } from '../../game/types';

/**
 * だい1しょう うしさんの ぼくじょう
 * 学ぶこと: ぎゅうにゅうは うしから。おかあさんうしが あかちゃんを うむと おちちが でる。
 *           ぎゅうにゅうの なかみ（みず・あぶら・タンパク質・乳糖・ミネラル）。
 */
export const script: Step[] = [
  { t: 'say', text: 'やあ！ ぼくは ミルク。 チーズしょくにん だニャ！', face: 'happy', gesture: 'wave', sfx: 'meow' },
  {
    t: 'choice',
    text: 'チーズって なにから できるか しってる？',
    face: 'think',
    options: [
      { label: 'ぎゅうにゅう！', reply: [{ t: 'say', text: 'だいせいかい！ すごいニャ！', face: 'excited', gesture: 'clap', sfx: 'success' }] },
      { label: 'わからない', reply: [{ t: 'say', text: 'こたえは ぎゅうにゅう！ うしさんの おちち だニャ。', face: 'gentle', gesture: 'nod' }] },
      { label: 'おもち？', reply: [{ t: 'say', text: 'ニャハハ！ おしい！ こたえは ぎゅうにゅう だニャ。', face: 'happy', gesture: 'spin' }] },
    ],
  },
  { t: 'say', text: 'どうやって チーズに なるのか、 いっしょに たんけんしよう！ じめんを タップすると あるけるよ。', face: 'proud', gesture: 'point', event: 'cam:follow' },
  { t: 'task', id: 'touchCow', hint: 'しろと くろの うしさんに タッチしてみよう', target: 'cow1' },
  { t: 'say', text: 'モ〜！ うしさんは あかちゃんを うむと、 おちちが でるように なるんだ。', face: 'happy', event: 'cam:calf' },
  { t: 'say', text: 'その おちちを、 ぼくたちは すこし わけて もらっているんだニャ。 つぎは テーブルの コップへ！', face: 'gentle', event: 'cam:follow' },
  { t: 'task', id: 'tapGlass', hint: 'テーブルの ぎゅうにゅうの コップを タッチしよう', target: 'glass' },
  { t: 'do', event: 'showLegend' },
  {
    t: 'choice',
    text: 'ぎゅうにゅうを 100この つぶに してみたよ。 あおい みずは なんこ あると おもう？',
    face: 'proud',
    options: [
      { label: '10こ くらい', reply: [] },
      { label: '50こ くらい', reply: [] },
      { label: '87こ くらい', reply: [] },
    ],
    after: [{ t: 'say', text: 'なんと 87こ！ ぎゅうにゅうは ほとんどが みず なんだニャ。', face: 'surprised' }],
  },
  {
    t: 'say',
    text: 'のこりの きいろい あぶらと、 オレンジの [タンパク質:たんぱくしつ]が、 チーズの もとに なるよ！',
    face: 'excited',
    gesture: 'clap',
  },
  { t: 'do', event: 'hideLegend' },
  { t: 'say', text: 'さあ、 この ミルクかんを こうぼうに はこぼう！', face: 'happy', gesture: 'point', event: 'cam:follow' },
  { t: 'task', id: 'pickCan', hint: 'ミルクかんを タッチして もとう', target: 'can' },
  { t: 'task', id: 'deliver', hint: 'オレンジの やねの こうぼうまで はこぼう', target: 'door' },
  { t: 'say', text: 'とうちゃく！ つぎは ぎゅうにゅうの なかを のぞいてみようニャ！', face: 'excited', gesture: 'jump', sfx: 'success', event: 'cam:door' },
  { t: 'end' },
];

export const catChatter: string[] = [
  'ぼくの ぼうし、 にあってる？ チーズしょくにんの しるし なんだニャ。',
  'しっぽが ゆらゆら してるのは、 ごきげんの しるし だよ。',
  'おなか すいたニャ……。 あ、 なんでもない！',
  'ぼくの ひげは、 せまい ところを とおれるか はかる センサー なんだ。',
  'ねこは 1にちに 12じかん いじょう ねることも あるんだって。 ぼくは チーズの ゆめを みるニャ。',
];
