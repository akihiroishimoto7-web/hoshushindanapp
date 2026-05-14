import { Axis, Choice, QUESTIONS } from "./questions";

export type Scores = Record<Axis, number>;

export const AXIS_META: Record<Axis, { label: string; sub: string }> = {
  cultural: { label: "文化保守性", sub: "Cultural Conservatism" },
  economic: { label: "経済思想", sub: "Market ↔ State" },
  nation: { label: "国家観", sub: "National Sentiment" },
  sns: { label: "SNS過激化リスク", sub: "Echo-Chamber Risk" },
  kojiki: { label: "古事記理解度", sub: "Kojiki Literacy" },
  purity: { label: "思想純度", sub: "Ideological Purity" },
};

export const MAX: Scores = (() => {
  const m: Scores = { cultural: 0, economic: 0, nation: 0, sns: 0, kojiki: 0, purity: 0 };
  for (const q of QUESTIONS) {
    const perAxis: Scores = { cultural: 0, economic: 0, nation: 0, sns: 0, kojiki: 0, purity: 0 };
    for (const c of q.choices) {
      (Object.keys(c.scores) as Axis[]).forEach((a) => {
        perAxis[a] = Math.max(perAxis[a], c.scores[a] ?? 0);
      });
    }
    (Object.keys(perAxis) as Axis[]).forEach((a) => (m[a] += perAxis[a]));
  }
  return m;
})();

export function calcScores(answers: Choice[]): Scores {
  const s: Scores = { cultural: 0, economic: 0, nation: 0, sns: 0, kojiki: 0, purity: 0 };
  for (const a of answers) {
    (Object.keys(a.scores) as Axis[]).forEach((k) => {
      s[k] += a.scores[k] ?? 0;
    });
  }
  return s;
}

export function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  const v = Math.round((value / max) * 100);
  return Math.max(0, Math.min(100, v));
}

export type ResultType = {
  key: "imperial" | "civic" | "merchant" | "rebel";
  name: string;
  subtitle: string;
  description: string;
  satire: string[];
  themeClass: string;
};

export function classify(s: Scores): ResultType {
  const cultural = pct(s.cultural, MAX.cultural);
  const economic = pct(s.economic, MAX.economic); // 高い=市場主義寄り
  const nation = pct(s.nation, MAX.nation);
  const sns = pct(s.sns, MAX.sns);

  // SNS過激化が極端なら rebel に倒す
  if (sns >= 70 && cultural < 70) {
    return {
      key: "rebel",
      name: "炎上型・思想戦士",
      subtitle: "The Algorithmic Patriot",
      description:
        "あなたの思想は、タイムラインによって増幅されています。怒りは正義感に擬態し、引用RTは祈りの代わりになっています。",
      satire: [
        "SNSによって思想が増幅されやすい傾向があります。",
        "深夜2時の長文引用は、控えた方が、たぶん幸せです。",
        "家族との会話では、政治の話題を5分以内に切り上げましょう。",
      ],
      themeClass: "theme-rebel",
    };
  }

  if (cultural >= 60 && nation >= 55) {
    return {
      key: "imperial",
      name: "古社派・静かな国体主義",
      subtitle: "The Quiet Imperialist",
      description:
        "あなたは極めて高い文化保守性を持っています。境内の落葉の音を、誰よりも美しいと感じるタイプです。",
      satire: [
        "思想強度は高いですが、家族との会話では少し抑えた方が良いでしょう。",
        "新嘗祭の日付を即答できる側の人間です。",
        "経済の話題になると急にトーンが落ちる傾向があります。",
      ],
      themeClass: "theme-imperial",
    };
  }

  if (economic >= 60 && cultural < 60) {
    return {
      key: "merchant",
      name: "町衆派・合理保守",
      subtitle: "The Merchant Conservative",
      description:
        "あなたは伝統を尊びつつ、市場を信じています。江戸の豪商が令和に転生したような顔つきをしています。",
      satire: [
        "文化保守ではあるが、経済思想は意外とリベラルです。その点は左派です。",
        "神社に行ってもまず賽銭の費用対効果を考えがちです。",
        "“伝統の継承にも資本が要る”が口癖になっています。",
      ],
      themeClass: "theme-merchant",
    };
  }

  return {
    key: "civic",
    name: "町内会派・常識保守",
    subtitle: "The Civic Traditionalist",
    description:
      "派手さはありませんが、共同体への帰属意識が高く、極端を嫌います。最も“まっとうな保守”の姿です。",
    satire: [
      "“普通”という最も難しいものを、無自覚に守っているタイプです。",
      "SNSでは静かですが、町内会では一目置かれています。",
      "思想純度は中庸。だからこそ、強い。",
    ],
    themeClass: "theme-civic",
  };
}
