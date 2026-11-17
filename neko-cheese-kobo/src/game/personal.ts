import { useProgress } from './progress';

/**
 * 台本の なかの よびかけを、主人公の なまえに おきかえる。
 *  {なまえ}   → 「さくらちゃん」（なまえが ないときは 「きみ」）
 *  {よびかけ} → 「さくらちゃん、 」（なまえが ないときは なし）
 */
export function personalize(text: string) {
  const name = useProgress.getState().player.name.trim();
  return text.replace(/\{なまえ\}/g, name ? `${name}ちゃん` : 'きみ').replace(/\{よびかけ\}/g, name ? `${name}ちゃん、 ` : '');
}
