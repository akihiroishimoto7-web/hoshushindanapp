import { useMemo } from 'react';
import * as THREE from 'three';
import { withFresnelAlpha } from '../look';
import { woodTex } from '../tex';
import { BlobShadow } from '../common';

/** ミルクかん（ぎんいろ） */
const steel = new THREE.MeshStandardMaterial({ color: '#d9dee3', metalness: 0.75, roughness: 0.28 });
const steelDark = new THREE.MeshStandardMaterial({ color: '#aeb5bd', metalness: 0.7, roughness: 0.35 });
const bandMat = new THREE.MeshStandardMaterial({ color: '#7cc8f5', roughness: 0.5 });

export function MilkCan({ scale = 1, shadow = true }: { scale?: number; shadow?: boolean }) {
  const body = useMemo(() => {
    const pts = [
      [0, 0],
      [0.26, 0],
      [0.28, 0.04],
      [0.28, 0.5],
      [0.2, 0.62],
      [0.13, 0.66],
      [0.13, 0.76],
      [0, 0.76],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  return (
    <group scale={scale}>
      {shadow && <BlobShadow size={0.8} />}
      <mesh geometry={body} material={steel} />
      <mesh material={bandMat} position-y={0.3}>
        <cylinderGeometry args={[0.285, 0.285, 0.1, 24, 1, true]} />
      </mesh>
      <mesh material={steelDark} position-y={0.78}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 20]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={steelDark} position={[s * 0.24, 0.55, 0]} rotation={[0, 0, s * 0.3]}>
          <torusGeometry args={[0.06, 0.015, 6, 12, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
}

/** 木のテーブル */
export function Table({ w = 1.6, d = 1, h = 0.8, color = '#c58b52' }: { w?: number; d?: number; h?: number; color?: string }) {
  const map = woodTex(color, '#8c5b32', 'table-' + color, 4);
  return (
    <group>
      <BlobShadow size={Math.max(w, d) * 1.4} opacity={0.22} />
      <mesh position-y={h}>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08)]}>
          <boxGeometry args={[0.08, h, 0.08]} />
          <meshStandardMaterial color="#8c5b32" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** ガラスのコップ */
export const glassMat = withFresnelAlpha(
  new THREE.MeshPhysicalMaterial({
    color: '#eef8ff',
    roughness: 0.02,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    ior: 1.5,
    specularIntensity: 1,
    side: THREE.DoubleSide,
  }),
  0.08,
  0.6,
  2.5,
  0.45,
  '#ffffff',
);
export const milkMat = new THREE.MeshPhysicalMaterial({ color: '#fffdf6', roughness: 0.22, emissive: '#fff8e6', emissiveIntensity: 0.12, clearcoat: 1, clearcoatRoughness: 0.1 });
