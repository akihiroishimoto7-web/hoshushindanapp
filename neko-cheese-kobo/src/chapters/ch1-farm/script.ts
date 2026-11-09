import type { Step } from '../../game/types';

/**
 * だい1しょう うしさんの ぼくじょう
 * 学ぶこと: ぎゅうにゅうは うしから。おかあさんうしが あかちゃんを うむと おちちが でる。
 *           ぎゅうにゅうの なかみ（みず・あぶら・タンパク質・乳糖・ミネラル）。
 */
export const script: Step[] = [
  { t: 'say', who: 'narrator', text: 'みどりの おかの うえに、 ねこたちが くらす ちいさな むらが ありました。' },
  { t: 'say', text: 'やあ！ ぼくは ミルク。 この むらの チーズしょくにん だニャ！', face: 'happy', gesture: 'wave', sfx: 'meow' },
  {
    t: 'choice',
    text: 'きみ、 チーズは すき？',
    face: 'normal',
    gesture: 'tilt',
    options: [
      { label: 'だいすき！', reply: [{ t: 'say', text: 'やったー！ ぼくも だいすき！ なかまだニャ！', face: 'excited', gesture: 'jump' }] },
      { label: 'ちょっと すき', reply: [{ t: 'say', text: 'ふふ。 きょうの ぼうけんが おわったら、 もっと すきに なるかもニャ。', face: 'wink' }] },
      {
        label: 'たべたこと あるかな？',
        reply: [{ t: 'say', text: 'ピザの うえで のびーる あれも チーズなんだよ。 きっと たべたこと あるニャ！', face: 'happy', gesture: 'nod' }],
      },
    ],
  },
  {
    t: 'choice',
    text: 'ねえねえ、 チーズって なにから できるか しってる？',
    face: 'think',
    options: [
      { label: 'ぎゅうにゅう！', reply: [{ t: 'say', text: 'だいせいかい！ すごいニャ！', face: 'excited', gesture: 'clap', sfx: 'success' }] },
      { label: 'わからない', reply: [{ t: 'say', text: 'だいじょうぶ！ こたえは…… ぎゅうにゅう！ うしさんの おちち だニャ。', face: 'gentle', gesture: 'nod' }] },
      { label: 'おもち？', reply: [{ t: 'say', text: 'ニャハハ！ おもちも のびるけど、 ちがうんだ。 こたえは ぎゅうにゅう だニャ！', face: 'happy', gesture: 'spin' }] },
    ],
  },
  { t: 'say', text: 'でもね、 さらさらで しろい ぎゅうにゅうが、 どうして かたまって チーズに なるんだろう？', face: 'think', gesture: 'tilt' },
  { t: 'say', who: 'girl', text: 'どうして？', auto: 1100 },
  { t: 'say', text: 'ふふふ。 それを いまから いっしょに たんけんするニャ！', face: 'proud', gesture: 'point' },
  { t: 'say', text: 'まずは ぼくじょうの うしさんに あいに いこう！ じめんを タップすると、 そこまで あるけるよ。', face: 'happy', event: 'cam:follow' },
  { t: 'task', id: 'touchCow', hint: 'しろと くろの うしさんに タッチしてみよう', target: 'cow1' },
  { t: 'say', text: 'モ〜って いったね！ この うしさんは ホルスタイン。 しろと くろの もようが めじるし だニャ。', face: 'happy', event: 'cam:cow' },
  { t: 'say', text: 'うしさんは、 あかちゃんを うむと、 おちちが でるように なるんだ。 ほら、 となりに こうしが いるでしょ？', face: 'gentle', gesture: 'point', event: 'cam:calf' },
  { t: 'say', text: 'おちちは ほんとうは あかちゃんの ための ごはん。 ぼくたちは それを すこし わけて もらっているんだニャ。', face: 'gentle' },
  {
    t: 'choice',
    text: 'うしさんは まいにち なにを たべていると おもう？',
    face: 'think',
    options: [
      { label: 'くさ！', reply: [{ t: 'say', text: 'せいかい！ くさや ほしくさを たっぷり たべるよ。', face: 'excited', gesture: 'clap' }] },
      { label: 'チーズ？', reply: [{ t: 'say', text: 'ニャハハ、 うしさんは チーズは たべないよ。 くさや ほしくさを たべるんだ。', face: 'happy' }] },
      { label: 'おさかな？', reply: [{ t: 'say', text: 'それは ぼくの だいこうぶつ！ うしさんは くさや ほしくさを たべるんだよ。', face: 'wink' }] },
    ],
    after: [
      {
        t: 'say',
        text: 'それに おみずも たくさん のむ。 ぎゅうにゅうを だす うしさんは、 1にちに 100リットルいじょう のむことも あるんだって！',
        face: 'surprised',
      },
    ],
  },
  { t: 'say', text: 'さあ、 つぎは しぼった ぎゅうにゅうを よーく みてみよう。 テーブルの コップの ところへ いこう！', face: 'happy', event: 'cam:follow' },
  { t: 'task', id: 'tapGlass', hint: 'テーブルの ぎゅうにゅうの コップを タッチしよう', target: 'glass' },
  { t: 'say', text: 'じゃーん！ ぎゅうにゅうの なかみを、 100この つぶで あらわしてみたよ。', face: 'proud', event: 'showLegend', sfx: 'magic' },
  {
    t: 'choice',
    text: 'あおい つぶは みず。 100この うち、 なんこ くらいが みず だと おもう？',
    face: 'think',
    options: [
      { label: '10こ くらい', reply: [] },
      { label: '50こ くらい', reply: [] },
      { label: '87こ くらい', reply: [{ t: 'say', text: 'するどい！', face: 'excited', gesture: 'jump' }] },
    ],
    after: [{ t: 'say', text: 'なんと 87こ くらいが みず！ ぎゅうにゅうは ほとんどが みず なんだニャ。', face: 'surprised' }],
  },
  {
    t: 'say',
    text: 'しろい つぶは あまい [乳糖:にゅうとう]、 きいろい つぶは あぶら、 オレンジの つぶは からだを つくる [タンパク質:たんぱくしつ]。 むらさきは カルシウム などの ミネラルだよ。',
    face: 'normal',
    gesture: 'point',
  },
  {
    t: 'say',
    text: 'この なかの [タンパク質:たんぱくしつ]と あぶらが、 チーズの もとに なるんだ。 ぎゅうにゅうの なかには、 チーズに なる ざいりょうが かくれているんだニャ！',
    face: 'excited',
    gesture: 'clap',
  },
  { t: 'say', text: 'あ、 この かずは だいたい だよ。 うしさんや きせつで すこし かわるんだ。', face: 'gentle', event: 'hideLegend' },
  { t: 'say', text: 'あっ、 たいへん！ もう こんな じかん！ この ミルクかんを こうぼうに はこばなきゃ！', face: 'oops', gesture: 'jump', event: 'cam:follow' },
  { t: 'task', id: 'pickCan', hint: 'ミルクかんを タッチして もとう', target: 'can' },
  { t: 'say', text: 'ありがとう！ ちからもち だニャ！ こうぼうは あの オレンジの やねの いえだよ。', face: 'happy', gesture: 'point' },
  { t: 'task', id: 'deliver', hint: 'チーズこうぼうの とびらまで はこぼう', target: 'door' },
  { t: 'say', text: 'とうちゃく！ おつかれさま！', face: 'excited', gesture: 'jump', sfx: 'success', event: 'cam:door' },
  {
    t: 'say',
    text: 'つぎは この ぎゅうにゅうの なかを、 もっと もっと ちかくで のぞいてみよう。 ふしぎな せかいが まってるニャ！',
    face: 'wink',
  },
  { t: 'end' },
];

export const catChatter: string[] = [
  'ぼくの ぼうし、 にあってる？ チーズしょくにんの しるし なんだニャ。',
  'しっぽが ゆらゆら してるのは、 ごきげんの しるし だよ。',
  'おなか すいたニャ……。 あ、 なんでもない！',
  'ぼくの ひげは、 せまい ところを とおれるか はかる センサー なんだ。',
  'ねこは 1にちに 12じかん いじょう ねることも あるんだって。 ぼくは チーズの ゆめを みるニャ。',
];
