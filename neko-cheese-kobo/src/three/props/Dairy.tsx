import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { withRim } from '../look';
import { textTex } from '../tex';
import { makeDisc, VAT } from '../env/Workshop';
import { BlobShadow } from '../common';

/** ラベルつきの びん */
export function Jar({ label, color = '#ffc2dc', lid = '#e8604c', tall = false }: { label: string; color?: string; lid?: string; tall?: boolean }) {
  const tex = textTex(label, { w: 256, h: 96, bg: '#fffdf5', color: '#5a3a1a', size: label.length > 4 ? 34 : 44, key: 'jar:' + label });
  const h = tall ? 0.62 : 0.42;
  return (
    <group>
      <BlobShadow size={0.6} opacity={0.25} />
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[0.17, 0.17, h, 20]} />
        <meshStandardMaterial color={color} roughness={0.25} transparent opacity={0.92} />
      </mesh>
      {tall && (
        <mesh position-y={h + 0.08}>
          <cylinderGeometry args={[0.06, 0.12, 0.16, 16]} />
          <meshStandardMaterial color={color} roughness={0.25} />
        </mesh>
      )}
      <mesh position-y={tall ? h + 0.2 : h + 0.04}>
        <cylinderGeometry args={tall ? [0.065, 0.065, 0.08, 14] : [0.18, 0.18, 0.08, 20]} />
        <meshStandardMaterial color={lid} roughness={0.5} />
      </mesh>
      <mesh position={[0, h * 0.5, 0.172]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  );
}

export interface Ripple {
  x: number;
  z: number;
  t0: number;
  amp: number;
}

/**
 * なべの中の 表面。ぎゅうにゅう（さらさら） → カード（ぷるぷる）
 * さわった ところから なみが ひろがる（CPU で頂点を うごかす。1500 頂点ほどなので軽い）
 */
export function VatSurface({
  level,
  curd,
  ripples,
  onTouch,
  surfaceRef,
}: {
  level: React.RefObject<number>;
  curd: React.RefObject<number>;
  ripples: React.RefObject<Ripple[]>;
  onTouch?: (e: ThreeEvent<PointerEvent>, local: THREE.Vector3) => void;
  surfaceRef?: (o: THREE.Object3D | null) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => makeDisc(VAT.r - 0.02, 22, 56), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const mat = useMemo(
    () =>
      withRim(new THREE.MeshPhysicalMaterial({ color: '#fffdf6', roughness: 0.2, emissive: '#fff4dc', emissiveIntensity: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: new THREE.Color('#dfeaff') }), '#e2ecff', 0.35, 2.4),
    [],
  );
  const milkC = useMemo(() => new THREE.Color('#fffdf6'), []);
  const curdC = useMemo(() => new THREE.Color('#fbefc6'), []);
  const active = useRef(true);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  useFrame((st) => {
    const m = mesh.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    const lv = level.current;
    m.visible = lv > 0.01;
    const y = VAT.bottom + 0.02 + lv * (VAT.top - VAT.bottom - 0.2);
    m.position.y = y;
    const c = curd.current;
    mat.color.copy(milkC).lerp(curdC, c);
    mat.roughness = 0.2 + c * 0.3;
    mat.clearcoat = 1 - c * 0.65;
    mat.clearcoatRoughness = 0.08 + c * 0.35;
    const rs = ripples.current.filter((r) => t - r.t0 < 3.5);
    ripples.current = rs;
    const idle = Math.sin(t * 1.2) * 0.004;
    if (!rs.length && !active.current) return;
    active.current = rs.length > 0;
    const P = geo.attributes.position.array as Float32Array;
    const solid = c > 0.5;
    const k = solid ? 3.2 : 11;
    const w = solid ? 9 : 13;
    const decay = solid ? 1.4 : 1.8;
    for (let i = 0; i < P.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      let dy = idle;
      for (const r of rs) {
        const age = t - r.t0;
        const d = Math.hypot(x - r.x, z - r.z);
        const wave = Math.sin(k * d - w * age) * Math.exp(-age * decay) * Math.exp(-d * (solid ? 0.35 : 0.9));
        dy += r.amp * wave * Math.min(1, age * 6);
        if (solid) dy -= r.amp * 1.2 * Math.exp(-(d * d) / 0.15) * Math.exp(-age * 5);
      }
      // ふちは うごかない
      const edge = 1 - THREE.MathUtils.smoothstep(Math.hypot(x, z), VAT.r - 0.35, VAT.r - 0.02);
      P[i + 1] = dy * edge;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <group>
      <mesh
        ref={(o) => {
          mesh.current = o;
          surfaceRef?.(o);
        }}
        geometry={geo}
        material={mat}
        onPointerDown={
          onTouch
            ? (e) => {
                e.stopPropagation();
                const local = mesh.current!.worldToLocal(e.point.clone());
                onTouch(e, local);
              }
            : undefined
        }
      />
    </group>
  );
}
