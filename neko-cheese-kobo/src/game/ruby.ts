/**
 * 台本の書き方:  [乳酸菌:にゅうさんきん] → 画面ではルビつき、読み上げでは漢字で読む。
 * 7さいでも読めるように ふだんは ひらがな・カタカナ、たいせつな ことばだけ 漢字に ふりがな。
 */
export interface Seg {
  text: string;
  rt?: string;
}

const RE = /\[([^:\]]+):([^\]]+)\]/g;

export function parseRuby(src: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of src.matchAll(RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: src.slice(last, idx) });
    out.push({ text: m[1], rt: m[2] });
    last = idx + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

/** 文字送りに使う「長さ」（ルビ部分は よみがなの長さで数える） */
export function unitLength(segs: Seg[]) {
  return segs.reduce((n, s) => n + (s.rt ? s.rt.length : [...s.text].length), 0);
}

/** 先頭から n 文字ぶんだけ表示する */
export function sliceSegs(segs: Seg[], n: number): Seg[] {
  const out: Seg[] = [];
  let left = n;
  for (const s of segs) {
    if (left <= 0) break;
    if (s.rt) {
      // ルビ語は まとめて出す（途中で切れると読みにくい）
      out.push(s);
      left -= s.rt.length;
    } else {
      const chars = [...s.text];
      if (chars.length <= left) {
        out.push(s);
        left -= chars.length;
      } else {
        out.push({ text: chars.slice(0, left).join('') });
        left = 0;
      }
    }
  }
  return out;
}

/** 読み上げ用のテキスト */
export function toSpeech(src: string) {
  return src
    .replace(RE, (_m, kanji: string) => kanji)
    .replace(/…+/g, '、')
    .replace(/[（(][^）)]*[）)]/g, (m) => (m.length > 14 ? '' : m))
    .replace(/〜/g, 'ー');
}

/** ルビなしのプレーンテキスト（ひらがな表示） */
export function toPlainKana(src: string) {
  return src.replace(RE, (_m, _k: string, kana: string) => kana);
}
