export interface ChapterMeta {
  id: string;
  /** ひょうじ用 「だい1しょう」 など */
  label: string;
  title: string;
  /** スタンプに かく え（絵文字） */
  stamp: string;
  stampName: string;
  color: string;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'farm',
    label: 'だい1しょう',
    title: 'うしさんの ぼくじょう',
    stamp: '🐄',
    stampName: 'うしさん',
    color: '#7cc576',
  },
  {
    id: 'micro',
    label: 'だい2しょう',
    title: 'ぎゅうにゅうの なかの ちいさな せかい',
    stamp: '🔬',
    stampName: 'むしめがね',
    color: '#9ab8ff',
  },
  {
    id: 'curd',
    label: 'だい3しょう',
    title: 'ぎゅうにゅうが ぷるぷるに！',
    stamp: '🍮',
    stampName: 'ぷるぷる',
    color: '#ffc36b',
  },
  {
    id: 'maker',
    label: 'だい4しょう',
    title: 'チーズしょくにんに なろう',
    stamp: '🧑‍🍳',
    stampName: 'しょくにん',
    color: '#ff9f80',
  },
  {
    id: 'aging',
    label: 'だい5しょう',
    title: 'じかんの まほう',
    stamp: '⏳',
    stampName: 'じかん',
    color: '#c99a6b',
  },
  {
    id: 'shop',
    label: 'さいしゅうしょう',
    title: 'ねこの チーズショップ',
    stamp: '🧀',
    stampName: 'チーズ',
    color: '#ffd84d',
  },
];

export const CHAPTER_COUNT = CHAPTERS.length;
