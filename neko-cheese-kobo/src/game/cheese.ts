import { Color } from 'three';
import type { CheeseMark, CheeseResult, CheeseType } from './types';

/** 4章の そうさ から、どんな チーズに なるかを きめる */
export function decideType(curdSize: CheeseResult['curdSize'], pressed: boolean, pressPower: number): CheeseType {
  if (!pressed) return 'soft';
  if (curdSize === 'small' || pressPower > 0.75) return 'hard';
  return 'semi';
}

export function curdSizeFromCuts(nx: number, nz: number, R = 1.4): { size: CheeseResult['curdSize']; d: number } {
  const d = ((2 * R) / (nx + 1) + (2 * R) / (nz + 1)) / 2;
  return { size: d > 1.0 ? 'big' : d > 0.6 ? 'medium' : 'small', d };
}

/** 見た目（おおきさ・いろ） */
export function cheeseLook(type: CheeseType) {
  switch (type) {
    case 'soft':
      return { radius: 0.48, height: 0.36, fresh: '#fbf6e6' };
    case 'semi':
      return { radius: 0.62, height: 0.42, fresh: '#fbf0cf' };
    case 'hard':
      return { radius: 0.66, height: 0.36, fresh: '#f9ecc2' };
  }
}

export const TYPE_NAME: Record<CheeseType, string> = {
  soft: 'やわらかい チーズ',
  semi: 'ほどよい かたさの チーズ',
  hard: 'かたい チーズ',
};

export const MARK_LABEL: Record<CheeseMark, string> = {
  paw: '🐾 にくきゅう',
  star: '⭐ ほし',
  heart: '❤️ ハート',
};

export const MARK_COLOR: Record<CheeseMark, string> = {
  paw: '#c9822a',
  star: '#d9a020',
  heart: '#e0607a',
};

export const DEFAULT_CHEESE: CheeseResult = {
  curdSize: 'medium',
  cuts: 4,
  pressed: true,
  pressPower: 0.5,
  salt: 3,
  type: 'semi',
  mark: 'paw',
  agedDays: 0,
};

/** 熟成の期間（日） */
export function agingMaxDays(type: CheeseType) {
  return type === 'soft' ? 35 : type === 'semi' ? 180 : 365;
}

export function formatDays(days: number) {
  const d = Math.round(days);
  if (d < 14) return `${d}にち`;
  if (d < 60) return `${Math.round(d / 7)}しゅうかん`;
  if (d < 360) return `${Math.round(d / 30)}かげつ`;
  return '1ねん';
}

/** 熟成ぐあい a(0..1) に おうじた 見た目 */
export function agedLook(type: CheeseType, a: number) {
  const look = cheeseLook(type);
  const hardish = type !== 'soft';
  const rind = new Color(look.fresh);
  if (hardish) rind.lerp(new Color(type === 'hard' ? '#cf8f2e' : '#dcaa45'), Math.min(1, a * 1.3));
  else rind.lerp(new Color('#f6e7b0'), a * 0.4);
  const paste = new Color(look.fresh).lerp(new Color(hardish ? '#f3c95e' : '#f7e3a0'), a);
  return {
    ...look,
    hardish,
    rind: '#' + rind.getHexString(),
    paste: '#' + paste.getHexString(),
    shrink: hardish ? 1 - a * (type === 'hard' ? 0.1 : 0.06) : 1,
    sag: hardish ? 1 : 1 - Math.max(0, a - 0.5) * 0.12,
    rough: hardish ? 0.2 + a * 0.8 : 0.3,
  };
}
