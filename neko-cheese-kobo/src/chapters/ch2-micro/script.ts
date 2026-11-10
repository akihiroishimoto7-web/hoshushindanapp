import type { Step } from '../../game/types';

/**
 * だい2しょう ぎゅうにゅうの なかの ちいさな せかい
 * 学ぶこと: ぎゅうにゅうが しろい わけ／あぶらの つぶ／カゼイン（タンパク質）／
 *           乳酸菌は 乳糖を つかって 乳酸を つくる／乳酸菌は ぶんれつして ふえる／
 *           ほんものは めに みえない（かおは わかりやすくする ための えがお）
 */
export const script: Step[] = [
  { t: 'say', text: 'ここは チーズこうぼうの なか。 じゃじゃーん！ まほうの むしめがね だニャ！', face: 'proud', gesture: 'point', sfx: 'sparkle' },
  { t: 'say', text: 'これで のぞくと、 ぼくたちが ちいさく なって、 ぎゅうにゅうの なかに はいれるんだ。', face: 'wink' },
  {
    t: 'say',
    text: 'さっき この コップに、 チーズづくりに つかう 「スターター」を ひとつまみ いれておいたよ。 なにが いるかは…… みてのおたのしみ！',
    face: 'happy',
  },
  { t: 'task', id: 'useLoupe', hint: 'むしめがねを タッチしてみよう', target: 'loupe' },
  { t: 'say', text: 'うわぁ……！ まっしろで、 ふわふわの せかい！', face: 'surprised', gesture: 'spin' },
  { t: 'say', text: 'ぼくの しっぽ、 ちゃんと ついてきてる？ ……よかったニャ。 ちいさく なっても ぼくは ぼく！', face: 'love', gesture: 'purr' },
  {
    t: 'say',
    text: 'ぎゅうにゅうが しろく みえるのはね、 なかに ある ちいさな つぶつぶに ひかりが あたって、 いろんな ほうこうに はねかえるから なんだ。',
    face: 'normal',
  },
  { t: 'task', id: 'tapFat', hint: 'おおきな ふわふわの たまを タッチしよう', target: 'fat' },
  {
    t: 'say',
    text: 'これは あぶらの つぶ。 うすい まくに つつまれて、 ぷかぷか ういているよ。 バターや クリームの もとにも なるんだニャ。',
    face: 'happy',
  },
  { t: 'task', id: 'tapCasein', hint: 'ちいさな けだまみたいな つぶを タッチしよう', target: 'casein' },
  {
    t: 'say',
    text: 'これは カゼイン。 ぎゅうにゅうの [タンパク質:たんぱくしつ]の なかまで、 チーズの いちばん だいじな ざいりょう！',
    face: 'excited',
    gesture: 'clap',
  },
  {
    t: 'say',
    text: 'まわりの ふさふさが 「くっつかないで バリア」に なっていて、 つぶどうしが くっつかないように しているんだ。 あとで だいかつやく するから おぼえておいてニャ。',
    face: 'wink',
  },
  { t: 'say', text: 'あっ、 だれか きたよ！', face: 'surprised', event: 'labAppear', sfx: 'boing' },
  { t: 'say', text: 'この こたちは [乳酸菌:にゅうさんきん]。 チーズづくりの だいじな なかま だニャ！', face: 'excited', gesture: 'wave' },
  {
    t: 'say',
    text: 'ほんものの [乳酸菌:にゅうさんきん]は とっても ちいさくて、 めでは みえないよ。 1ミリの 1000ぶんの1 くらい！ かおは、 わかりやすいように ぼくが かいてみたんだニャ。',
    face: 'gentle',
  },
  {
    t: 'say',
    text: 'それから、 ここでは みやすく するために、 つぶの おおきさや かずも かえてあるよ。 ほんとうは もっと たくさん、 ぎゅうぎゅうに いるんだ。',
    face: 'normal',
  },
  {
    t: 'say',
    text: '[乳酸菌:にゅうさんきん]は、 ぎゅうにゅうの なかの あまい [乳糖:にゅうとう]が だいこうぶつ。 キラキラしているのが [乳糖:にゅうとう]だよ。',
    face: 'happy',
    gesture: 'point',
    event: 'showMeter',
  },
  { t: 'task', id: 'feed', hint: 'キラキラの [乳糖:にゅうとう]を タッチして、 [乳酸菌:にゅうさんきん]に とどけよう', target: 'sugar' },
  { t: 'say', text: 'みて！ [乳酸:にゅうさん]が ふえて、 ぎゅうにゅうが すこし すっぱく なってきたよ。', face: 'surprised' },
  {
    t: 'choice',
    text: 'すっぱく なると、 チーズづくりに どんな いいことが あると おもう？',
    face: 'think',
    options: [
      { label: 'おいしく なる？', reply: [{ t: 'say', text: 'そう！ チーズの あじや かおりの もとに なるんだ。', face: 'excited', gesture: 'clap' }] },
      { label: 'かたまりやすく なる？', reply: [{ t: 'say', text: 'するどい！ あとで ぎゅうにゅうを かためる ときに、 たすけて くれるんだ。', face: 'excited', gesture: 'jump' }] },
      { label: 'わからない', reply: [{ t: 'say', text: 'いっしょに かんがえよう。 じつは いいことが いっぱい あるんだ！', face: 'gentle' }] },
    ],
    after: [
      {
        t: 'say',
        text: 'すっぱさは、 チーズの あじや かおりの もとに なる。 あとで かためる ときにも やくに たつ。 それに、 わるい きんが ふえにくく なるんだニャ。',
        face: 'proud',
      },
    ],
  },
  {
    t: 'say',
    text: '[乳酸菌:にゅうさんきん]は ヨーグルトを つくる ときにも はたらいているよ。 ぼくたちの みかた だね。',
    face: 'happy',
  },
  { t: 'say', text: 'さあ、 もとの おおきさに もどろう！ ふくらめ〜 ニャニャニャ〜ン！', face: 'excited', gesture: 'spin', event: 'zoomOut', sfx: 'magic' },
  { t: 'wait', ms: 1600 },
  { t: 'say', text: 'ただいま！ つぎは この ぎゅうにゅうを、 おおきな なべで チーズに していくよ！', face: 'happy', gesture: 'wave' },
  { t: 'end' },
];

export const micro = {
  sugarSide: 'これは [乳糖:にゅうとう]。 ぎゅうにゅうの なかの あまい あじの もと だよ。',
  firstEat: 'もぐもぐ…… ぷはっ！ [乳糖:にゅうとう]を つかって、 すっぱい [乳酸:にゅうさん]を つくったよ！',
  firstSplit: 'わっ、 ふたつに わかれた！ [乳酸菌:にゅうさんきん]は こうやって ふえるんだニャ。',
};
