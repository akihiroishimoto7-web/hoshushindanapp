import type { Step } from '../../game/types';

/**
 * だい2しょう ぎゅうにゅうの なかの ちいさな せかい
 * 学ぶこと: ぎゅうにゅうが しろい わけ／あぶらの つぶ／カゼイン（タンパク質）／
 *           乳酸菌は 乳糖を つかって 乳酸を つくる／乳酸菌は ぶんれつして ふえる／
 *           ほんものは めに みえない（かおは わかりやすくする ための えがお）
 */
export const script: Step[] = [
  { t: 'say', text: 'じゃじゃーん！ まほうの むしめがね！ ちいさく なって、 ぎゅうにゅうの なかに はいれるんだニャ。', face: 'proud', gesture: 'point', sfx: 'sparkle' },
  { t: 'task', id: 'useLoupe', hint: 'むしめがねを タッチしてみよう', target: 'loupe' },
  { t: 'say', text: 'うわぁ！ まっしろな せかい！ この つぶつぶが ひかりを はねかえすから、 ぎゅうにゅうは しろく みえるんだ。', face: 'surprised', gesture: 'spin' },
  { t: 'task', id: 'tapFat', hint: 'おおきな ふわふわの たまを タッチしよう', target: 'fat' },
  { t: 'say', text: 'これは あぶらの つぶ。 ぷかぷか ういているよ。', face: 'happy' },
  { t: 'task', id: 'tapCasein', hint: 'ちいさな けだまみたいな つぶを タッチしよう', target: 'casein' },
  {
    t: 'say',
    text: 'これは カゼイン。 チーズの いちばん だいじな ざいりょう！ まわりの ふさふさは 「くっつかないで バリア」 だよ。',
    face: 'excited',
    gesture: 'clap',
  },
  { t: 'say', text: 'あっ、 [乳酸菌:にゅうさんきん]が きたよ！ チーズづくりの なかま だニャ。', face: 'surprised', event: 'labAppear', sfx: 'boing' },
  {
    t: 'say',
    text: 'ほんものは めに みえないほど ちいさいんだ。 かおは、 わかりやすいように ぼくが かいたよ。',
    face: 'gentle',
    event: 'showMeter',
  },
  { t: 'task', id: 'feed', hint: 'キラキラの [乳糖:にゅうとう]を タッチして、 [乳酸菌:にゅうさんきん]に とどけよう', target: 'sugar' },
  {
    t: 'say',
    text: '[乳酸菌:にゅうさんきん]は あまい [乳糖:にゅうとう]から すっぱい [乳酸:にゅうさん]を つくるんだ。 この すっぱさが、 チーズの あじの もとに なって、 かためる ときにも やくに たつよ。',
    face: 'proud',
  },
  { t: 'say', text: 'もとの おおきさに もどろう！ ニャニャニャ〜ン！', face: 'excited', gesture: 'spin', event: 'zoomOut', sfx: 'magic' },
  { t: 'wait', ms: 1600 },
  { t: 'end' },
];

export const micro = {
  sugarSide: 'これは [乳糖:にゅうとう]。 ぎゅうにゅうの なかの あまい あじの もと だよ。',
  firstEat: 'もぐもぐ…… ぷはっ！ [乳糖:にゅうとう]を つかって、 すっぱい [乳酸:にゅうさん]を つくったよ！',
  firstSplit: 'わっ、 ふたつに わかれた！ [乳酸菌:にゅうさんきん]は こうやって ふえるんだニャ。',
};
