import type { SfxName } from '../audio/sfx';

/** ミルク（ねこ）の表情 */
export type Emotion =
  | 'normal'
  | 'happy'
  | 'surprised'
  | 'think'
  | 'excited'
  | 'oops'
  | 'wink'
  | 'gentle'
  | 'proud';

/** ミルクの身ぶり */
export type Gesture =
  | 'wave'
  | 'jump'
  | 'nod'
  | 'tilt'
  | 'point'
  | 'clap'
  | 'bow'
  | 'spin'
  | 'paw'
  | 'stir';

export type Speaker = 'milk' | 'girl' | 'narrator';

/** 4章でできた「きみの チーズ」 */
export type CheeseType = 'soft' | 'semi' | 'hard';
export type CheeseMark = 'paw' | 'star' | 'heart';
export interface CheeseResult {
  curdSize: 'big' | 'medium' | 'small';
  cuts: number;
  pressed: boolean;
  pressPower: number; // 0..1
  salt: number;
  type: CheeseType;
  mark: CheeseMark;
  /** 熟成した日数（5章で更新） */
  agedDays: number;
}

/** 台本の分岐判定に渡すスナップショット */
export interface ScriptContext {
  cheese: CheeseResult | null;
  vars: Record<string, unknown>;
}

export interface SayStep {
  t: 'say';
  who?: Speaker;
  text: string;
  face?: Emotion;
  gesture?: Gesture;
  /** この台詞が始まったときにシーンへ送るイベント */
  event?: string;
  payload?: unknown;
  sfx?: SfxName;
  /** ミリ秒後に自動で次へ（女の子の台詞など） */
  auto?: number;
}

export interface ChoiceOption {
  label: string;
  reply: Step[];
}

export interface ChoiceStep {
  t: 'choice';
  who?: Speaker;
  text: string;
  face?: Emotion;
  gesture?: Gesture;
  options: ChoiceOption[];
  /** どの選択肢でも、返事のあとに続く台詞 */
  after?: Step[];
  /** 選んだ番号を vars[key] に保存する */
  key?: string;
}

export interface TaskStep {
  t: 'task';
  id: string;
  hint: string;
  /** 3D 上で矢印を出す対象（targets.ts に登録された名前） */
  target?: string;
  event?: string;
  payload?: unknown;
}

export interface DoStep {
  t: 'do';
  event: string;
  payload?: unknown;
}

export interface WaitStep {
  t: 'wait';
  ms: number;
}

export interface BranchStep {
  t: 'branch';
  pick: (ctx: ScriptContext) => Step[];
}

export interface EndStep {
  t: 'end';
}

export type Step = SayStep | ChoiceStep | TaskStep | DoStep | WaitStep | BranchStep | EndStep;
