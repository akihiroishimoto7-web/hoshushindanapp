import type { Step } from '../../game/types';

/**
 * だい5しょう じかんの まほう
 * 学ぶこと: じゅくせいこは すずしくて しめっている／じゅくせい中に こうそや びせいぶつが はたらいて あじ・かおり・かたさが かわる／
 *           しろカビの チーズ（たべられる カビ。でも いえで はえた カビは たべない）／ひっくりかえす・ふく 手入れ／
 *           じゅくせい しない フレッシュチーズも ある／きかんは チーズで ばらばら
 */
export const script: Step[] = [
  { t: 'say', text: 'ここが じゅくせいこ。 しーっ、 チーズが ねているよ。 そっと あけてみて！', face: 'wink', gesture: 'point' },
  { t: 'task', id: 'openDoor', hint: 'おおきな とびらを タッチして あけよう', target: 'door' },
  {
    t: 'say',
    text: 'ひんやり！ すずしくて しめった へやで チーズを ねかせることを 「じゅくせい」って いうんだ。',
    face: 'gentle',
    event: 'cam:inside',
  },
  { t: 'do', event: 'cam:cheese' },
  {
    t: 'branch',
    pick: (ctx) => {
      if ((ctx.cheese?.type ?? 'semi') === 'soft')
        return [
          { t: 'say', text: 'やわらかい チーズには、 たべられる しろカビを つけるよ。', face: 'normal' },
          { t: 'task', id: 'spore', hint: 'きりふきを タッチして、 しろカビの もとを かけよう', target: 'mister' },
          { t: 'say', text: 'だいじな やくそく！ おうちの たべものに はえた カビは、 たべちゃ だめ だよ。', face: 'surprised' },
        ];
      return [];
    },
  },
  { t: 'say', text: 'じかんの まほうを かけよう！ ダイヤルを まわしてニャ。', face: 'excited', gesture: 'spin', event: 'showDial' },
  { t: 'task', id: 'dial', hint: 'ダイヤルを ぐるっと まわして、 じかんを すすめよう', target: 'cheese' },
  { t: 'say', text: 'じかんが チーズを おいしく してくれたね！ でも、 ねかせない チーズも あるんだ。', face: 'proud', gesture: 'clap', sfx: 'success', event: 'cam:fresh' },
  { t: 'task', id: 'tapFresh', hint: 'おみずの なかの しろい チーズを タッチしよう', target: 'fresh' },
  { t: 'say', text: 'モッツァレラは つくって すぐ たべる 「フレッシュチーズ」。 さあ、 チーズショップへ いこう！', face: 'happy', gesture: 'wave', event: 'cam:cheese' },
  { t: 'end' },
];

/** ダイヤルを まわして とおりすぎた ときの ひとこと */
export const milestones: Record<'soft' | 'semi' | 'hard', { day: number; text: string }[]> = {
  soft: [
    { day: 8, text: 'しろい ふわふわが はえてきた！ しろカビが そだって いるよ。' },
    { day: 26, text: 'カビの [酵素:こうそ]が はたらいて、 なかが とろーり やわらかく なってきたよ。' },
  ],
  semi: [
    { day: 30, text: 'まわりが かわいて、 かたい 「かわ」が できてきたよ。' },
    { day: 120, text: 'なかで [酵素:こうそ]や びせいぶつが はたらいて、 あじと かおりが そだっているんだ。' },
  ],
  hard: [
    { day: 40, text: 'まわりが かわいて、 かたい 「かわ」が できてきたよ。' },
    { day: 220, text: 'なかで [酵素:こうそ]や びせいぶつが はたらいて、 あじと かおりが そだっているんだ。' },
  ],
};

export const flipLines = {
  soft: 'そっと ひっくりかえしたよ。 カビが まんべんなく そだつように するんだ。',
  hard: 'よいしょ！ ひっくりかえして、 かたちと しめりけを ととのえるよ。',
};
