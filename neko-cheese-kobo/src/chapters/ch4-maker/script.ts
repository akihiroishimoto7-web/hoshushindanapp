import type { Step } from '../../game/types';
import { MARK_LABEL } from '../../game/cheese';

/**
 * だい4しょう チーズしょくにんに なろう
 * 学ぶこと: カードを きる（こまかいほど ホエイが ぬけて かたく なる）／かきまぜる／
 *           カード（かたまり）と ホエイ（みず）／ホエイの つかいみち／かたに つめる／
 *           おす チーズ・おさない チーズ／しおの やくわり／しゅるいごとに レシピが ちがう
 */
export const script: Step[] = [
  { t: 'say', text: 'さあ、 チーズしょくにんの じかん！ ゆびで カードを スーッと なぞって きってみて！', face: 'happy', gesture: 'point', event: 'cam:top' },
  { t: 'task', id: 'cut', hint: 'ゆびで カードの うえを スーッと なぞって きろう', target: 'curd' },
  {
    t: 'branch',
    pick: (ctx) => {
      const s = ctx.vars.curdSize;
      if (s === 'big') return [{ t: 'say', text: 'おおきめ だね。 しっとり やわらかい チーズに なりやすいよ。', face: 'happy', event: 'cam:vat' }];
      if (s === 'small') return [{ t: 'say', text: 'こまかい！ みずが よく ぬけて、 かたい チーズに なりやすいよ。', face: 'excited', event: 'cam:vat' }];
      return [{ t: 'say', text: 'ちょうど いい！ ほどよい かたさに なりそう。', face: 'happy', event: 'cam:vat' }];
    },
  },
  { t: 'say', text: 'しみでた みずが 「ホエイ」、 かたまりが 「カード」。 つぎは ぐるぐる まぜよう！', face: 'normal', gesture: 'stir', event: 'cam:top' },
  { t: 'task', id: 'stir', hint: 'なべの なかを ゆびで ぐるぐる かきまぜよう', target: 'curd' },
  { t: 'say', text: 'め、 めが まわるニャ〜！ つぎは あかい せんで ホエイを ぬこう。', face: 'excited', gesture: 'clap', event: 'cam:vat' },
  { t: 'task', id: 'drain', hint: 'あかい せんを タッチして ホエイを ぬこう', target: 'valve' },
  { t: 'do', event: 'cam:mold' },
  { t: 'task', id: 'mold', hint: 'かたを タッチして、 カードを すくって つめよう', target: 'mold' },
  {
    t: 'choice',
    key: 'press',
    text: 'さて、 つぎは どうする？',
    face: 'think',
    gesture: 'tilt',
    options: [
      {
        label: 'ぎゅっと おす！',
        reply: [
          { t: 'task', id: 'press', hint: '「おす」ボタンを ながおし しよう', target: 'mold' },
          { t: 'say', text: 'おすと みずが ぬけて、 ぎゅっと しまるよ。 チェダーも おして つくるんだ。', face: 'proud' },
        ],
      },
      {
        label: 'おさないで まつ',
        reply: [
          { t: 'say', text: 'じぶんの おもさで ゆっくり みずを ぬくよ。 カマンベールの つくりかた だね。', face: 'gentle', event: 'flip' },
          { t: 'wait', ms: 1800 },
        ],
      },
    ],
  },
  { t: 'do', event: 'cam:mold' },
  { t: 'task', id: 'salt', hint: 'しおの びんを 3かい タッチして ふりかけよう', target: 'salt' },
  { t: 'say', text: 'しおは あじを つけて、 チーズを ながもち させるんだ。 さあ、 かたから だすよ！', face: 'happy', event: 'unmold', sfx: 'magic' },
  { t: 'wait', ms: 1400 },
  {
    t: 'branch',
    pick: (ctx) => {
      const p = ctx.vars.pressType as string | undefined;
      const text =
        p === 'soft'
          ? 'できた！ ふんわり やわらかい チーズ だニャ！'
          : p === 'hard'
            ? 'できた！ ぎゅっと しまった かたい チーズ だニャ！'
            : 'できた！ ほどよい かたさの チーズ だニャ！';
      return [{ t: 'say', text, face: 'excited', gesture: 'jump', sfx: 'success' }];
    },
  },
  {
    t: 'choice',
    key: 'mark',
    text: 'せかいに ひとつの、 きみの オリジナル！ マークを つけよう！',
    face: 'love',
    gesture: 'cheer',
    options: [
      { label: MARK_LABEL.paw, reply: [] },
      { label: MARK_LABEL.star, reply: [] },
      { label: MARK_LABEL.heart, reply: [] },
    ],
    after: [
      { t: 'do', event: 'saveCheese' },
      { t: 'say', text: 'ポン！ すてき！ つぎは 「じかんの まほう」を かけに いこう！', face: 'excited', sfx: 'stamp', gesture: 'point' },
    ],
  },
  { t: 'end' },
];
