import { create } from 'zustand';
import { bus } from './bus';
import { useProgress } from './progress';
import type { ChoiceStep, Emotion, Gesture, SayStep, Speaker, Step, TaskStep } from './types';

/**
 * 会話エンジン
 *
 * 台本（Step の配列）を上から順に進める。
 *  - say    : 台詞を出して、タップで次へ
 *  - choice : 選択肢。どれを選んでも返事（reply）が流れて、物語は前へ進む
 *  - task   : プレイヤーの操作を待つ。シーンが completeTask(id) を呼ぶと次へ
 *  - do     : シーンへイベントを送ってすぐ次へ
 *  - side   : 寄り道の会話（猫や牛をタップしたとき）。終わると元のタスクに戻る
 */

export interface Line {
  id: number;
  who: Speaker;
  text: string;
  face?: Emotion;
  gesture?: Gesture;
  auto?: number;
}

export interface ActiveTask {
  id: string;
  hint: string;
  target?: string;
  progress?: string;
}

interface DialogState {
  line: Line | null;
  choices: string[] | null;
  task: ActiveTask | null;
  running: boolean;
  vars: Record<string, unknown>;
}

interface Frame {
  steps: Step[];
  i: number;
  side: boolean;
}

export const useDialog = create<DialogState>(() => ({
  line: null,
  choices: null,
  task: null,
  running: false,
  vars: {},
}));

/** ねこの表情・しぐさ・口パク（3D の猫が毎フレーム読む） */
interface CatState {
  face: Emotion;
  gesture: { name: Gesture | null; n: number };
  talking: boolean;
}
export const useCat = create<CatState>(() => ({
  face: 'happy',
  gesture: { name: null, n: 0 },
  talking: false,
}));

export function catGesture(name: Gesture) {
  const g = useCat.getState().gesture;
  useCat.setState({ gesture: { name, n: g.n + 1 } });
}
export function catFace(face: Emotion) {
  useCat.setState({ face });
}

let stack: Frame[] = [];
let onEnd: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lineId = 0;
let lastTaskKey = '';
const doneTasks = new Set<string>();

function top(): Frame | undefined {
  return stack[stack.length - 1];
}

function mainFrame(): Frame | undefined {
  for (let k = stack.length - 1; k >= 0; k--) if (!stack[k].side) return stack[k];
  return undefined;
}

function sideActive() {
  return stack.some((f) => f.side);
}

function showSay(s: SayStep) {
  lineId++;
  useDialog.setState({
    line: { id: lineId, who: s.who ?? 'milk', text: s.text, face: s.face, gesture: s.gesture, auto: s.auto },
    choices: null,
    task: null,
  });
  applyLineEffects(s.who ?? 'milk', s.face, s.gesture, s.event, s.payload);
  if (s.sfx) bus.emit('sfx', s.sfx);
}

function showChoice(s: ChoiceStep) {
  lineId++;
  useDialog.setState({
    line: { id: lineId, who: s.who ?? 'milk', text: s.text, face: s.face, gesture: s.gesture },
    choices: s.options.map((o) => o.label),
    task: null,
  });
  applyLineEffects(s.who ?? 'milk', s.face, s.gesture);
}

function applyLineEffects(who: Speaker, face?: Emotion, gesture?: Gesture, event?: string, payload?: unknown) {
  if (who === 'milk') {
    catFace(face ?? 'normal');
    if (gesture) catGesture(gesture);
  }
  if (event) bus.emit(event, payload);
}

function showTask(s: TaskStep, f: Frame) {
  useDialog.setState({
    line: null,
    choices: null,
    task: { id: s.id, hint: s.hint, target: s.target },
  });
  const key = `${stack.indexOf(f)}:${f.i}:${s.id}`;
  if (key !== lastTaskKey) {
    lastTaskKey = key;
    if (s.event) bus.emit(s.event, s.payload);
    bus.emit('task', s.id);
  }
}

function pump() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  while (stack.length) {
    const f = top()!;
    if (f.i >= f.steps.length) {
      stack.pop();
      continue;
    }
    const s = f.steps[f.i];
    switch (s.t) {
      case 'say':
        showSay(s);
        return;
      case 'choice':
        showChoice(s);
        return;
      case 'task':
        if (doneTasks.has(s.id)) {
          doneTasks.delete(s.id);
          f.i++;
          continue;
        }
        showTask(s, f);
        return;
      case 'do':
        f.i++;
        bus.emit(s.event, s.payload);
        continue;
      case 'wait':
        f.i++;
        useDialog.setState({ line: null, choices: null, task: null });
        timer = setTimeout(pump, s.ms);
        return;
      case 'branch': {
        f.i++;
        const steps = s.pick({ cheese: useProgress.getState().cheese, vars: useDialog.getState().vars });
        stack.push({ steps, i: 0, side: f.side });
        continue;
      }
      case 'end': {
        stack = [];
        useDialog.setState({ line: null, choices: null, task: null, running: false });
        const cb = onEnd;
        onEnd = null;
        cb?.();
        return;
      }
    }
  }
  useDialog.setState({ line: null, choices: null, task: null, running: false });
}

export const dialog = {
  /** 章の台本をはじめる */
  start(steps: Step[], end: () => void) {
    dialog.stop();
    stack = [{ steps, i: 0, side: false }];
    onEnd = end;
    useDialog.setState({ running: true, vars: {} });
    pump();
  },

  stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    stack = [];
    onEnd = null;
    lastTaskKey = '';
    doneTasks.clear();
    useDialog.setState({ line: null, choices: null, task: null, running: false });
    useCat.setState({ talking: false });
  },

  /** 台詞をタップしたとき */
  advance() {
    const f = top();
    if (!f) return;
    const s = f.steps[f.i];
    if (!s || s.t !== 'say') return;
    f.i++;
    pump();
  },

  choose(idx: number) {
    const f = top();
    if (!f) return;
    const s = f.steps[f.i];
    if (!s || s.t !== 'choice') return;
    const opt = s.options[idx];
    if (!opt) return;
    if (s.key) useDialog.setState({ vars: { ...useDialog.getState().vars, [s.key]: idx } });
    f.i++;
    stack.push({
      steps: [{ t: 'say', who: 'girl', text: opt.label, auto: 1100 }, ...opt.reply, ...(s.after ?? [])],
      i: 0,
      side: f.side,
    });
    bus.emit('choice', idx);
    pump();
  },

  /** いま待っているタスクなら完了にする。完了できたら true */
  completeTask(id: string): boolean {
    const m = mainFrame();
    if (!m) return false;
    const s = m.steps[m.i];
    if (!s || s.t !== 'task' || s.id !== id) return false;
    if (sideActive()) {
      doneTasks.add(id);
      return true;
    }
    m.i++;
    pump();
    return true;
  },

  /** 寄り道の会話。タスク待ち中か、台本が終わったあとだけ流せる */
  side(steps: Step[]): boolean {
    const st = useDialog.getState();
    if (sideActive()) return false;
    if (st.running && !st.task) return false;
    stack.push({ steps, i: 0, side: true });
    if (!st.running) useDialog.setState({ running: true });
    pump();
    return true;
  },

  /** タスクのヒントに「あと3こ」などを足す */
  setProgress(progress?: string) {
    const t = useDialog.getState().task;
    if (t) useDialog.setState({ task: { ...t, progress } });
  },

  isTask(id: string) {
    const m = mainFrame();
    const s = m?.steps[m.i];
    return Boolean(s && s.t === 'task' && s.id === id && !doneTasks.has(id));
  },

  setVar(k: string, v: unknown) {
    useDialog.setState({ vars: { ...useDialog.getState().vars, [k]: v } });
  },

  busy() {
    return sideActive() || Boolean(useDialog.getState().line);
  },
};
