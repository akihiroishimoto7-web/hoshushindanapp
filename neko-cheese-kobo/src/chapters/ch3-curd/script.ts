import type { Step } from '../../game/types';

/**
 * だい3しょう ぎゅうにゅうが ぷるぷるに！
 * 学ぶこと: さっきんした ぎゅうにゅうを あたためる（おおくは 30ど くらい・しゅるいで ちがう）／
 *           スターター（乳酸菌）を いれて まつ（ほんとうは 30ぷん〜1じかん くらい）／
 *           レンネットの こうそ（キモシン）が カゼインの「バリア」を きる → カゼインが つながって あみに なり かたまる／
 *           できた ぷるぷるが カード。ひやしても かたまらない。すっぱさ だけで かためる チーズも ある。
 */
export const script: Step[] = [
  { t: 'say', text: 'この おおきな なべで、 ぎゅうにゅうを チーズに するんだニャ！', face: 'proud', gesture: 'point', event: 'cam:vat' },
  { t: 'task', id: 'pour', hint: 'ミルクかんを タッチして、 ぎゅうにゅうを なべに いれよう', target: 'can' },
  {
    t: 'say',
    text: 'つぎは あたためるよ。 [乳酸菌:にゅうさんきん]が げんきに なる 30ど くらい。 おふろより ずっと ぬるいね。',
    face: 'normal',
    event: 'cam:thermo',
  },
  { t: 'task', id: 'heat', hint: '「あたためる」を おしつづけて、 はりを みどりの ところ（30〜34ど）に しよう', target: 'thermo' },
  { t: 'say', text: 'ぴったり！ スターターを いれよう！ えいっ…… あれ？ これ しお だったニャ！', face: 'oops', gesture: 'jump', sfx: 'boing', event: 'saltOops' },
  { t: 'do', event: 'cam:shelf' },
  { t: 'task', id: 'starter', hint: 'ピンクの スターターの びんを タッチしよう', target: 'starter' },
  {
    t: 'say',
    text: '[乳酸菌:にゅうさんきん]が はたらくまで、 ほんとうは 30ぷんから 1じかん まつよ。 きょうは まほうで はやおくり！',
    face: 'wink',
    gesture: 'spin',
    event: 'cam:vat',
  },
  { t: 'do', event: 'ff:starter' },
  { t: 'wait', ms: 2800 },
  {
    t: 'choice',
    text: 'もんだい！ どうして ぎゅうにゅうが かたまると おもう？',
    face: 'think',
    gesture: 'tilt',
    options: [
      { label: 'つめたく なるから？', reply: [{ t: 'say', text: 'ゼリーは そうだね！ でも ぎゅうにゅうは ひやしても かたまらないんだ。', face: 'gentle' }] },
      { label: 'なにかを いれたから？', reply: [{ t: 'say', text: 'するどい！ その とおり！', face: 'excited', gesture: 'jump', sfx: 'success' }] },
      { label: 'まほうだから！', reply: [{ t: 'say', text: 'ニャハハ、 まほうみたい だよね！ でも わけが あるんだ。', face: 'happy', gesture: 'nod' }] },
    ],
    after: [
      {
        t: 'say',
        text: 'ひみつは 「レンネット」！ なかの [酵素:こうそ]が、 ぎゅうにゅうを かためる おてつだいを するんだ。',
        face: 'proud',
        gesture: 'point',
        event: 'cam:shelf',
      },
    ],
  },
  { t: 'task', id: 'rennet', hint: 'レンネットの びんを タッチしよう', target: 'rennet' },
  { t: 'say', text: 'そっと まぜて…… まほうの まどで なかを のぞこう！', face: 'happy', gesture: 'stir', event: 'showBubble' },
  { t: 'say', text: '[酵素:こうそ]が、 カゼインの ふさふさバリアを チョキン！', face: 'surprised', event: 'cam:bubble', sfx: 'cut' },
  { t: 'do', event: 'cutHair' },
  {
    t: 'say',
    text: 'バリアが なくなると、 つぶどうしが てを つないで あみに なる。 そこに あぶらや みずが つかまって……',
    face: 'excited',
    event: 'joinMicelles',
  },
  { t: 'do', event: 'ff:rennet' },
  { t: 'wait', ms: 2600 },
  { t: 'say', text: 'わあ！ プリンみたいに なったニャ！ これを 「カード」って いうんだ。 さわってみて！', face: 'excited', gesture: 'jump', event: 'setCurd', sfx: 'success' },
  { t: 'do', event: 'cam:top' },
  { t: 'task', id: 'jiggle', hint: 'ぷるぷるの カードを 3かい タッチしよう', target: 'curd' },
  { t: 'say', text: 'ぷるんぷるん！ つぎは きみが チーズしょくにんに なる ばんだ！', face: 'excited', gesture: 'wave', event: 'cam:vat' },
  { t: 'end' },
];
