import type { Step } from '../../game/types';

/**
 * だい3しょう ぎゅうにゅうが ぷるぷるに！
 * 学ぶこと: さっきんした ぎゅうにゅうを あたためる（おおくは 30ど くらい・しゅるいで ちがう）／
 *           スターター（乳酸菌）を いれて まつ（ほんとうは 30ぷん〜1じかん くらい）／
 *           レンネットの こうそ（キモシン）が カゼインの「バリア」を きる → カゼインが つながって あみに なり かたまる／
 *           できた ぷるぷるが カード。ひやしても かたまらない。すっぱさ だけで かためる チーズも ある。
 */
export const script: Step[] = [
  { t: 'say', text: 'ここが チーズを つくる へや。 この おおきな なべで、 ぎゅうにゅうを チーズに するんだニャ！', face: 'proud', gesture: 'point', event: 'cam:vat' },
  { t: 'task', id: 'pour', hint: 'ミルクかんを タッチして、 ぎゅうにゅうを なべに いれよう', target: 'can' },
  { t: 'say', text: 'たっぷり はいったね！', face: 'happy', gesture: 'clap' },
  {
    t: 'say',
    text: 'この ぎゅうにゅうは、 さきに ねつで わるい きんを やっつけて（さっきん して）あるよ。 だから あんしん。',
    face: 'gentle',
  },
  {
    t: 'say',
    text: 'つぎは あたためる。 [乳酸菌:にゅうさんきん]が げんきに はたらける あたたかさに するんだ。 めあては 30ど くらい。 おふろより ずっと ぬるいね。',
    face: 'normal',
    event: 'cam:thermo',
  },
  { t: 'task', id: 'heat', hint: '「あたためる」を おしつづけて、 はりを みどりの ところ（30〜34ど）に しよう', target: 'thermo' },
  {
    t: 'say',
    text: 'ぴったり！ ちょうどいい おんどは チーズの しゅるいで ちがうよ。 もっと あたたかく する チーズも あるんだ。',
    face: 'excited',
    gesture: 'clap',
    event: 'cam:vat',
  },
  { t: 'say', text: 'よーし、 スターターを いれよう！ えいっ……', face: 'happy', gesture: 'point', event: 'saltOops' },
  { t: 'say', text: 'あれ？ これ、 しお だったニャ！ あぶない あぶない。', face: 'oops', gesture: 'jump', sfx: 'boing' },
  { t: 'say', text: 'しおは もっと あとで つかうんだ。 スターターは こっちの ピンクの びん！', face: 'gentle', event: 'cam:shelf' },
  { t: 'task', id: 'starter', hint: 'スターターの びんを タッチしよう', target: 'starter' },
  { t: 'say', text: 'さっき むしめがねで みた [乳酸菌:にゅうさんきん]たちが、 なべの なかで はたらきはじめたよ。', face: 'happy', event: 'cam:vat' },
  {
    t: 'say',
    text: 'ほんとうは ここで 30ぷんから 1じかん くらい まつんだ。 きょうは とくべつに、 まほうで はやおくり！',
    face: 'wink',
    gesture: 'spin',
  },
  { t: 'do', event: 'ff:starter' },
  { t: 'wait', ms: 2800 },
  {
    t: 'choice',
    text: 'さて もんだい！ どうして ぎゅうにゅうが かたまると おもう？',
    face: 'think',
    gesture: 'tilt',
    options: [
      {
        label: 'つめたく なるから？',
        reply: [
          {
            t: 'say',
            text: 'なるほど！ ゼリーは ひやすと かたまるもんね。 でも ぎゅうにゅうは、 れいぞうこで ひやしても かたまらないんだ。',
            face: 'gentle',
          },
        ],
      },
      {
        label: 'なにかを いれたから？',
        reply: [{ t: 'say', text: 'するどい！ その とおり！ これから 「レンネット」を いれるんだニャ。', face: 'excited', gesture: 'jump', sfx: 'success' }],
      },
      {
        label: 'まほうだから！',
        reply: [{ t: 'say', text: 'ニャハハ、 まほうみたい だよね！ でも ほんとうは、 ちゃんと わけが あるんだ。', face: 'happy', gesture: 'nod' }],
      },
    ],
    after: [
      { t: 'say', text: 'かたまる ひみつは、 この 「レンネット」！', face: 'proud', gesture: 'point', event: 'cam:shelf' },
      {
        t: 'say',
        text: 'レンネットには 「キモシン」という [酵素:こうそ]が はいっているよ。 [酵素:こうそ]は、 ものを かえる おてつだいを する ちいさな つぶ。 いきもの では ないんだ。',
        face: 'normal',
      },
      {
        t: 'say',
        text: 'むかしは こうしの おなかから もらっていたけど、 いまは びせいぶつの ちからを かりて つくった ものも よく つかわれているよ。',
        face: 'gentle',
      },
    ],
  },
  { t: 'task', id: 'rennet', hint: 'レンネットの びんを タッチしよう', target: 'rennet' },
  { t: 'say', text: 'そっと まぜて……', face: 'happy', gesture: 'stir', event: 'cam:vat' },
  {
    t: 'say',
    text: 'あとは しずかに まつよ。 ほんとうは また 30ぷんから 1じかん くらい。 そのあいだ、 なべの なかを まほうの まどで のぞいてみよう！',
    face: 'wink',
    event: 'showBubble',
  },
  { t: 'say', text: 'これが カゼインの つぶ。 ふさふさの バリアで、 まだ ばらばらに ういているね。', face: 'normal', event: 'cam:bubble' },
  {
    t: 'say',
    text: 'キモシンが、 カゼインの まわりの ふさふさを チョキン、 チョキンと きっていくよ。',
    face: 'surprised',
    event: 'cutHair',
    sfx: 'cut',
  },
  {
    t: 'say',
    text: 'バリアが なくなると、 カゼインの つぶどうしが てを つないで、 あみの ように つながるんだ。 カルシウムも てつだって くれるよ。',
    face: 'excited',
    event: 'joinMicelles',
  },
  {
    t: 'say',
    text: 'その あみの めに、 あぶらや みずが つかまって…… なべの なかぜんぶが ひとつに かたまると……',
    face: 'think',
    event: 'ff:rennet',
  },
  { t: 'wait', ms: 2600 },
  { t: 'say', text: 'わあ！ ぎゅうにゅうが プリンみたいに なったニャ！', face: 'excited', gesture: 'jump', event: 'setCurd', sfx: 'success' },
  { t: 'say', text: 'この ぷるぷるを 「カード」って いうんだ。 さわってみて！', face: 'happy', gesture: 'point', event: 'cam:top' },
  { t: 'task', id: 'jiggle', hint: 'ぷるぷるの カードを 3かい タッチしよう', target: 'curd' },
  {
    t: 'say',
    text: 'ぷるんぷるん！ チーズしょくにんは、 ナイフを いれて きれいに われるかどうかで、 かたまりぐあいを たしかめるんだ。',
    face: 'excited',
    event: 'cam:vat',
  },
  {
    t: 'say',
    text: 'ぎゅうにゅうが かたまったのは、 さむく なったからでも、 まほうでも なくて、 レンネットの はたらきと、 [乳酸菌:にゅうさんきん]の すっぱさの おかげ だったんだね。',
    face: 'proud',
  },
  {
    t: 'say',
    text: 'そうそう、 レンネットを つかわずに、 すっぱさと ねつだけで かためる チーズも あるよ。 インドの パニールなどが そうだよ。',
    face: 'normal',
  },
  { t: 'say', text: 'つぎは いよいよ、 きみが チーズしょくにんに なる ばんだ！', face: 'excited', gesture: 'wave' },
  { t: 'end' },
];
