import { create } from 'zustand';
import type { CheeseResult } from './types';
import { CHAPTER_COUNT } from './chapterMeta';

const KEY = 'neko-cheese-kobo:v1';

export interface Settings {
  /** ねこの こえ（ブラウザの よみあげ） */
  voice: boolean;
  /** こうかおん */
  sound: boolean;
  /** おんがく */
  music: boolean;
}

interface SaveData {
  current: number;
  unlocked: number;
  stamps: boolean[];
  cheese: CheeseResult | null;
  finished: boolean;
  settings: Settings;
  /** みつけた「ひみつ」の id（あとから 足した項目。古い保存データには ない） */
  secrets: string[];
}

interface ProgressState extends SaveData {
  setCurrent: (i: number) => void;
  completeChapter: (i: number) => void;
  setCheese: (c: CheeseResult | null) => void;
  patchCheese: (c: Partial<CheeseResult>) => void;
  setSetting: (k: keyof Settings, v: boolean) => void;
  addSecret: (id: string) => boolean;
  reset: () => void;
}

const defaults: SaveData = {
  current: 0,
  unlocked: 0,
  stamps: Array(CHAPTER_COUNT).fill(false),
  cheese: null,
  finished: false,
  settings: { voice: true, sound: true, music: true },
  secrets: [],
};

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const d = JSON.parse(raw) as Partial<SaveData>;
    const stamps = Array.from({ length: CHAPTER_COUNT }, (_, i) => Boolean(d.stamps?.[i]));
    return {
      current: clampIndex(d.current ?? 0),
      unlocked: clampIndex(d.unlocked ?? 0),
      stamps,
      cheese: d.cheese ?? null,
      finished: Boolean(d.finished),
      settings: { ...defaults.settings, ...(d.settings ?? {}) },
      secrets: Array.isArray(d.secrets) ? d.secrets.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

function clampIndex(i: number) {
  return Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(Number(i) || 0)));
}

function save(s: SaveData) {
  try {
    const data: SaveData = {
      current: s.current,
      unlocked: s.unlocked,
      stamps: s.stamps,
      cheese: s.cheese,
      finished: s.finished,
      settings: s.settings,
      secrets: s.secrets,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* プライベートモードなどで保存できなくても遊べる */
  }
}

export const useProgress = create<ProgressState>((set, get) => ({
  ...load(),
  setCurrent: (i) => set({ current: clampIndex(i) }),
  completeChapter: (i) => {
    const s = get();
    const stamps = s.stamps.slice();
    stamps[i] = true;
    const last = i >= CHAPTER_COUNT - 1;
    set({
      stamps,
      unlocked: Math.max(s.unlocked, clampIndex(i + 1)),
      current: last ? s.current : clampIndex(i + 1),
      finished: s.finished || last,
    });
  },
  setCheese: (c) => set({ cheese: c }),
  patchCheese: (c) => {
    const cur = get().cheese;
    if (cur) set({ cheese: { ...cur, ...c } });
  },
  setSetting: (k, v) => set({ settings: { ...get().settings, [k]: v } }),
  addSecret: (id) => {
    const cur = get().secrets;
    if (cur.includes(id)) return false;
    set({ secrets: [...cur, id] });
    return true;
  },
  reset: () => {
    const keep = get().settings;
    set({ ...structuredClone(defaults), settings: keep });
  },
}));

useProgress.subscribe((s) => save(s));

export function hasProgress() {
  const s = useProgress.getState();
  return s.unlocked > 0 || s.stamps.some(Boolean) || s.current > 0;
}
