import { useEffect, useRef } from 'react';

type Handler = (payload: unknown) => void;

const handlers = new Map<string, Set<Handler>>();

/** 台本 → シーン へのイベント通知（ごく小さな pub/sub） */
export const bus = {
  emit(event: string, payload?: unknown) {
    const set = handlers.get(event);
    if (set) [...set].forEach((h) => h(payload));
    const any = handlers.get('*');
    if (any) [...any].forEach((h) => h({ event, payload }));
  },
  on(event: string, h: Handler) {
    let set = handlers.get(event);
    if (!set) handlers.set(event, (set = new Set()));
    set.add(h);
    return () => {
      set!.delete(h);
    };
  },
};

/** シーンの中で台本イベントを受け取る */
export function useBus(event: string, handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => bus.on(event, (p) => ref.current(p)), [event]);
}
