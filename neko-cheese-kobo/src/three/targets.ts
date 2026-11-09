import { useCallback } from 'react';
import * as THREE from 'three';

/**
 * 「うしさん」「ミルクかん」など、名前つきの 3D オブジェクトの登録簿。
 * タスクの矢印や、カメラの注目、テスト時の座標取得に使う。
 */
const registry = new Map<string, THREE.Object3D>();

export function useTarget(name: string) {
  return useCallback(
    (obj: THREE.Object3D | null) => {
      if (obj) registry.set(name, obj);
      else if (registry.get(name)) registry.delete(name);
    },
    [name],
  );
}

export function getTarget(name: string) {
  return registry.get(name) ?? null;
}

const tmp = new THREE.Vector3();
export function targetWorldPos(name: string, out = tmp) {
  const o = registry.get(name);
  if (!o) return null;
  o.getWorldPosition(out);
  return out;
}

export function listTargets() {
  return [...registry.keys()];
}

/** テスト用: いまのカメラと画面サイズ */
export const threeRef: { camera: THREE.Camera | null; width: number; height: number } = { camera: null, width: 1, height: 1 };

/** 名前つきオブジェクトの 画面上の位置（px） */
export function screenPosOf(name: string) {
  const p = targetWorldPos(name, new THREE.Vector3());
  if (!p || !threeRef.camera) return null;
  p.project(threeRef.camera);
  return { x: ((p.x + 1) / 2) * threeRef.width, y: ((1 - p.y) / 2) * threeRef.height };
}
