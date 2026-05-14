// 軸: cultural(文化保守), economic(経済保守 = 市場/国家), nation(国家観), sns(SNS過激化リスク), kojiki(古事記理解), purity(思想純度)
export type Axis = "cultural" | "economic" | "nation" | "sns" | "kojiki" | "purity";

export type Choice = {
  label: string;
  scores: Partial<Record<Axis, number>>;
};

export type Question = {
  id: number;
  category: "思想" | "古事記" | "ネタ" | "生活";
  text: string;
  choices: Choice[];
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "思想",
    text: "あなたが最も大切にしたいものは？",
    choices: [
      { label: "共同体", scores: { cultural: 3, nation: 2, purity: 2 } },
      { label: "国家", scores: { nation: 3, cultural: 1, purity: 2 } },
      { label: "自由", scores: { economic: 2, purity: -1, sns: 1 } },
      { label: "市場競争", scores: { economic: 3, cultural: -1 } },
    ],
  },
  {
    id: 2,
    category: "古事記",
    text: "天照大神が隠れた場所はどこか。",
    choices: [
      { label: "天岩戸", scores: { kojiki: 4, cultural: 1 } },
      { label: "高天原の倉", scores: { kojiki: 1 } },
      { label: "出雲の社", scores: { kojiki: 0 } },
      { label: "葦原中国の洞", scores: { kojiki: 0 } },
    ],
  },
  {
    id: 3,
    category: "生活",
    text: "次のうち、最も“保守っぽい”行動は？",
    choices: [
      { label: "神社の落葉を掃く", scores: { cultural: 3, purity: 2 } },
      { label: "古民家カフェ巡り", scores: { cultural: 2, economic: 1 } },
      { label: "城跡で半日過ごす", scores: { cultural: 3, nation: 1 } },
      { label: "財務省を批判する", scores: { sns: 3, purity: 1, nation: 1 } },
    ],
  },
  {
    id: 4,
    category: "思想",
    text: "あなたが最も信頼するものは？",
    choices: [
      { label: "伝統", scores: { cultural: 3, purity: 2 } },
      { label: "科学", scores: { economic: 1, cultural: -1 } },
      { label: "市場", scores: { economic: 3 } },
      { label: "国家権力", scores: { nation: 3, sns: 1 } },
    ],
  },
  {
    id: 5,
    category: "古事記",
    text: "国生みを行った二柱の神は？",
    choices: [
      { label: "伊邪那岐・伊邪那美", scores: { kojiki: 4, cultural: 1 } },
      { label: "高皇産霊・神皇産霊", scores: { kojiki: 1 } },
      { label: "天照・須佐之男", scores: { kojiki: 0 } },
      { label: "大国主・少彦名", scores: { kojiki: 0 } },
    ],
  },
  {
    id: 6,
    category: "ネタ",
    text: "次のうちSNSで思想が過激化しやすいのは？",
    choices: [
      { label: "毎日政治系動画を3時間見る", scores: { sns: 4, purity: 2 } },
      { label: "リプ欄を必ず読む", scores: { sns: 3 } },
      { label: "気に入らない投稿に長文引用", scores: { sns: 4, purity: 1 } },
      { label: "そもそもSNSを見ない", scores: { sns: -2, cultural: 2 } },
    ],
  },
  {
    id: 7,
    category: "思想",
    text: "教育で最も重視すべきは？",
    choices: [
      { label: "礼節と歴史", scores: { cultural: 3, nation: 1 } },
      { label: "個性と多様性", scores: { economic: 1, cultural: -1, purity: -1 } },
      { label: "競争と効率", scores: { economic: 3 } },
      { label: "愛国心", scores: { nation: 3, purity: 2 } },
    ],
  },
  {
    id: 8,
    category: "生活",
    text: "休日の理想は？",
    choices: [
      { label: "墨で写経", scores: { cultural: 3, purity: 2 } },
      { label: "投資ニュースを巡回", scores: { economic: 3 } },
      { label: "渋谷で人と会う", scores: { economic: 1, cultural: -1 } },
      { label: "靖国を参拝", scores: { nation: 3, cultural: 2 } },
    ],
  },
  {
    id: 9,
    category: "古事記",
    text: "草薙剣はどこから出てきたか。",
    choices: [
      { label: "八岐大蛇の尾", scores: { kojiki: 4 } },
      { label: "天岩戸の奥", scores: { kojiki: 0 } },
      { label: "黄泉の入口", scores: { kojiki: 1 } },
      { label: "高千穂峰の頂", scores: { kojiki: 1 } },
    ],
  },
  {
    id: 10,
    category: "ネタ",
    text: "“真の保守”とはどれか。",
    choices: [
      { label: "変えるべきでないものを見極める者", scores: { cultural: 2, purity: 3 } },
      { label: "全部昔のままがいい人", scores: { cultural: 2, purity: 1, sns: 2 } },
      { label: "SNSで毎日叫ぶ人", scores: { sns: 4, purity: -1 } },
      { label: "そもそも興味がない人", scores: { purity: -2 } },
    ],
  },
  {
    id: 11,
    category: "思想",
    text: "経済政策で支持するのは？",
    choices: [
      { label: "積極財政・国土強靱化", scores: { nation: 2, economic: -2, purity: 1 } },
      { label: "小さな政府・規制緩和", scores: { economic: 3 } },
      { label: "再分配・福祉拡充", scores: { economic: -3, cultural: -1 } },
      { label: "わからない", scores: { purity: -1 } },
    ],
  },
  {
    id: 12,
    category: "生活",
    text: "和室に入ったあなたは、まず何をする？",
    choices: [
      { label: "床の間を確認する", scores: { cultural: 3, kojiki: 1 } },
      { label: "正座する", scores: { cultural: 2, purity: 1 } },
      { label: "畳の縁を踏まないか考える", scores: { cultural: 2 } },
      { label: "とりあえず寝転がる", scores: { cultural: -2, purity: -1 } },
    ],
  },
  {
    id: 13,
    category: "ネタ",
    text: "“日本人らしさ”の正体はどれだと思う？",
    choices: [
      { label: "察する文化", scores: { cultural: 3, purity: 1 } },
      { label: "同調圧力", scores: { sns: 2, cultural: -1 } },
      { label: "美意識", scores: { cultural: 3, purity: 2 } },
      { label: "コンビニ", scores: { economic: 2, cultural: -1 } },
    ],
  },
];
