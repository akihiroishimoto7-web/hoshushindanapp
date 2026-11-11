/**
 * ミルクの きせかえ。章を クリアするたびに 1つ もらえる。
 * （7さいの 子が くりかえし 遊びたく なる 「ごほうび」）
 */
export type OutfitId = 'none' | 'ribbon' | 'flowers' | 'glasses' | 'star' | 'crown' | 'cape';

export interface Outfit {
  id: OutfitId;
  icon: string;
  name: string;
  /** この 章を クリアすると もらえる（-1 は さいしょから） */
  chapter: number;
}

export const OUTFITS: Outfit[] = [
  { id: 'none', icon: '🐱', name: 'いつもの ミルク', chapter: -1 },
  { id: 'ribbon', icon: '🎀', name: 'ピンクの リボン', chapter: 0 },
  { id: 'flowers', icon: '🌼', name: 'おはなの かんむり', chapter: 1 },
  { id: 'glasses', icon: '👓', name: 'はかせの めがね', chapter: 2 },
  { id: 'star', icon: '⭐', name: 'ほしの かみかざり', chapter: 3 },
  { id: 'cape', icon: '🦸', name: 'ヒーローの マント', chapter: 4 },
  { id: 'crown', icon: '👑', name: 'チーズの おうかん', chapter: 5 },
];

export function outfitForChapter(chapter: number) {
  return OUTFITS.find((o) => o.chapter === chapter) ?? null;
}

export function isUnlocked(o: Outfit, stamps: boolean[]) {
  return o.chapter < 0 || Boolean(stamps[o.chapter]);
}
