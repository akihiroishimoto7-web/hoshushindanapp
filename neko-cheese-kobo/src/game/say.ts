import type { Emotion, Step } from './types';

/** 寄り道の ひとこと */
export const say = (text: string, face: Emotion = 'happy'): Step[] => [{ t: 'say', text, face }];
