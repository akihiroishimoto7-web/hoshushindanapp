import type { Step } from '../../game/types';
import { MARK_LABEL } from '../../game/cheese';

/**
 * だい4しょう チーズしょくにんに なろう
 * 学ぶこと: カードを きる（こまかいほど ホエイが ぬけて かたく なる）／かきまぜる／
 *           カード（かたまり）と ホエイ（みず）／ホエイの つかいみち／かたに つめる／
 *           おす チーズ・おさない チーズ／しおの やくわり／しゅるいごとに レシピが ちがう
 */
export const script: Step[] = [
  { t: 'say', text: 'さあ、 チーズしょくにんの じかん だよ！ ぼうしは…… こころの なかで かぶってね！', face: 'wink', gesture: 'nod', event: 'cam:top' },
  {
    t: 'say',
    text: 'まずは カードを きるよ。 ゆびで なべの うえを スーッと なぞってみて！ たてにも よこにも きれるよ。',
    face: 'happy',
    gesture: 'point',
  },
  { t: 'task', id: 'cut', hint: 'ゆびで カードの うえを スーッと なぞって きろう', target: 'curd' },
  {
    t: 'branch',
    pick: (ctx) => {
      const s = ctx.vars.curdSize;
      if (s === 'big')
        return [{ t: 'say', text: 'おおきめに きったね。 ホエイが ゆっくり ぬけて、 しっとり やわらかい チーズに なりやすいよ。', face: 'happy' }];
      if (s === 'small')
        return [{ t: 'say', text: 'こまかく きったね！ ホエイが たくさん ぬけて、 かたい チーズに なりやすいよ。', face: 'excited' }];
      return [{ t: 'say', text: 'ちょうど いい おおきさ！ ほどよい かたさの チーズに なりそう。', face: 'happy' }];
    },
  },
  {
    t: 'say',
    text: 'きった ところから しみでてきた みずが 「ホエイ」。 かたまりの ほうが 「カード」だよ。',
    face: 'normal',
    event: 'cam:vat',
  },
  {
    t: 'say',
    text: 'ホエイが ちょっと きいろっぽい みどりいろ なのは、 ビタミンB2の いろ なんだ。 ふしぎだね。',
    face: 'surprised',
  },
  { t: 'say', text: 'つぎは かきまぜるよ。 カードが ちぢんで、 もっと ホエイが でてくるんだ。', face: 'happy', gesture: 'stir', event: 'cam:top' },
  { t: 'task', id: 'stir', hint: 'なべの なかを ゆびで ぐるぐる かきまぜよう', target: 'curd' },
  {
    t: 'say',
    text: 'め、 めが まわるニャ〜……。 でも じょうず！ チーズに よっては、 ここで すこし あたためながら まぜて、 もっと カードを ひきしめる ことも あるよ。',
    face: 'excited',
    gesture: 'clap',
    event: 'cam:vat',
  },
  { t: 'say', text: 'じゃあ、 ホエイを ぬこう。 なべの まえの あかい せんを ひねってね。', face: 'normal', gesture: 'point' },
  { t: 'task', id: 'drain', hint: 'あかい せんを タッチして ホエイを ぬこう', target: 'valve' },
  {
    t: 'say',
    text: 'ぬいた ホエイも むだに しないよ。 あたためて リコッタという チーズを つくったり、 のみものや どうぶつの ごはんに したり するんだ。',
    face: 'gentle',
  },
  { t: 'say', text: 'のこった カードを、 かたに つめていこう！', face: 'happy', event: 'cam:mold' },
  { t: 'task', id: 'mold', hint: 'かたを タッチして、 カードを すくって つめよう', target: 'mold' },
  {
    t: 'say',
    text: 'かたには ちいさな あなが あいていて、 ホエイが ぽたぽた ぬけていくんだ。',
    face: 'normal',
  },
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
          { t: 'say', text: 'よし、 おもしで おしてみよう。 ボタンを ながく おすほど、 ぎゅーっと おせるよ。', face: 'excited' },
          { t: 'task', id: 'press', hint: '「おす」ボタンを ながおし しよう', target: 'mold' },
          {
            t: 'say',
            text: 'おすと ホエイが もっと ぬけて、 ぎゅっと しまった チーズに なるよ。 チェダーや ゴーダも おして つくるんだ。',
            face: 'proud',
          },
        ],
      },
      {
        label: 'おさないで まつ',
        reply: [
          {
            t: 'say',
            text: 'おさないで、 ときどき ひっくりかえしながら、 じぶんの おもさで ホエイを ぬくよ。 カマンベールは こうやって つくるんだ。',
            face: 'gentle',
            event: 'flip',
          },
          { t: 'wait', ms: 2200 },
        ],
      },
    ],
  },
  { t: 'say', text: 'さいごに しおを ふるよ。 さっきの しおの でばん だニャ！', face: 'wink', event: 'cam:mold' },
  { t: 'task', id: 'salt', hint: 'しおの びんを 3かい タッチして ふりかけよう', target: 'salt' },
  {
    t: 'say',
    text: 'しおは あじを つける だけじゃ ないよ。 よぶんな みずを ぬいたり、 わるい きんを ふえにくく したり、 チーズの かわを つくるのを てつだったり するんだ。',
    face: 'proud',
  },
  { t: 'say', text: 'しおみずの おふろに つけて しおを しみこませる チーズも あるんだよ。 さあ、 かたから だしてみよう！', face: 'happy', event: 'unmold', sfx: 'magic' },
  { t: 'wait', ms: 1400 },
  {
    t: 'branch',
    pick: (ctx) => {
      const p = ctx.vars.pressType as string | undefined;
      const text =
        p === 'soft'
          ? 'できた！ ふんわり やわらかい チーズの あかちゃん だニャ！'
          : p === 'hard'
            ? 'できた！ ぎゅっと しまった かたい チーズの あかちゃん だニャ！'
            : 'できた！ ほどよい かたさの チーズの あかちゃん だニャ！';
      return [{ t: 'say', text, face: 'excited', gesture: 'jump', sfx: 'success' }];
    },
  },
  {
    t: 'say',
    text: 'でもね、 ほんものの チーズは、 しゅるいごとに つくりかたが ちゃんと きまっているんだ。 カードの おおきさ、 おんど、 おすか どうか…… ぜんぶ ちがうんだよ。',
    face: 'gentle',
  },
  { t: 'say', text: 'きょうの チーズは、 せかいに ひとつだけの、 きみの オリジナル！', face: 'love', gesture: 'cheer' },
  {
    t: 'choice',
    key: 'mark',
    text: 'しあげに、 チーズに マークを つけよう！ どれに する？ ほんものの チーズにも、 マークや もじが ついている ものが あるんだよ。',
    face: 'happy',
    options: [
      { label: MARK_LABEL.paw, reply: [] },
      { label: MARK_LABEL.star, reply: [] },
      { label: MARK_LABEL.heart, reply: [] },
    ],
    after: [
      { t: 'do', event: 'saveCheese' },
      { t: 'say', text: 'ポン！ すてきな マーク！ これで きみの チーズって すぐ わかるね。', face: 'excited', sfx: 'stamp' },
      { t: 'say', text: 'でも まだ おわりじゃ ないよ。 つぎは 「じかんの まほう」を かけに いこう！', face: 'wink', gesture: 'point' },
    ],
  },
  { t: 'end' },
];
