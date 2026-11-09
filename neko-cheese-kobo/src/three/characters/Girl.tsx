import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { BlobShadow } from '../common';

/**
 * 主人公の女の子（プレイヤー）。チーズ色のワンピースに、赤いリボンの ふたつむすび。
 */
const mats = {
  skin: new THREE.MeshStandardMaterial({ color: '#ffd9c2', roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: '#6b3f22', roughness: 0.65 }),
  dress: new THREE.MeshStandardMaterial({ color: '#ffd24a', roughness: 0.75 }),
  collar: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }),
  ribbon: new THREE.MeshStandardMaterial({ color: '#ef4e5e', roughness: 0.5 }),
  shoe: new THREE.MeshStandardMaterial({ color: '#d8414f', roughness: 0.45 }),
  dark: new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: 0.3 }),
  shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  blush: new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.5, depthWrite: false }),
  mouth: new THREE.MeshStandardMaterial({ color: '#c94b55', roughness: 0.5 }),
  dot: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 }),
};

export function Girl({
  groupRef,
  holding,
  position,
  rotationY = 0,
  carry = false,
}: {
  groupRef?: RefObject<THREE.Group | null>;
  /** 手に持つもの */
  holding?: ReactNode;
  carry?: boolean;
  position?: THREE.Vector3Tuple;
  rotationY?: number;
}) {
  const own = useRef<THREE.Group>(null);
  const root = groupRef ?? own;
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const tails = useRef<THREE.Group>(null);
  const st = useRef({ last: new THREE.Vector3(), speed: 0, phase: 0, blinkAt: 1.5 });
  const v = useMemo(() => new THREE.Vector3(), []);

  const dressGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.34, 0.0),
      new THREE.Vector2(0.3, 0.12),
      new THREE.Vector2(0.2, 0.38),
      new THREE.Vector2(0.16, 0.5),
      new THREE.Vector2(0.15, 0.58),
      new THREE.Vector2(0.0, 0.6),
    ];
    return new THREE.LatheGeometry(pts, 24);
  }, []);

  useFrame((state, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const t = state.clock.elapsedTime;
    const s = st.current;
    if (root.current) {
      root.current.getWorldPosition(v);
      const sp = v.distanceTo(s.last) / Math.max(dt, 1e-3);
      s.last.copy(v);
      s.speed = THREE.MathUtils.lerp(s.speed, sp > 20 ? 0 : sp, 0.2);
    }
    const walking = s.speed > 0.25;
    s.phase += dt * (walking ? 11 : 0);
    const sw = walking ? Math.sin(s.phase) : 0;
    if (body.current) {
      body.current.position.y = walking ? Math.abs(Math.sin(s.phase)) * 0.05 : Math.sin(t * 2) * 0.008;
    }
    if (legL.current) legL.current.rotation.x = sw * 0.6;
    if (legR.current) legR.current.rotation.x = -sw * 0.6;
    if (armL.current) {
      armL.current.rotation.x = carry ? -1.1 : -sw * 0.5;
      armL.current.rotation.z = carry ? -0.15 : 0.18;
    }
    if (armR.current) {
      armR.current.rotation.x = carry ? -1.1 : sw * 0.5;
      armR.current.rotation.z = carry ? 0.15 : -0.18;
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 0.8) * 0.04;
    if (tails.current) tails.current.rotation.x = walking ? Math.sin(s.phase * 2) * 0.12 : Math.sin(t * 1.5) * 0.04;
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.13;
      blink = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2.5 + Math.random() * 3;
    }
    if (eyes.current) eyes.current.scale.y = blink;
  });

  return (
    <group ref={root} position={position} rotation-y={rotationY}>
      <BlobShadow size={0.85} />
      <group ref={body}>
        {[-1, 1].map((sx) => (
          <group key={sx} ref={sx < 0 ? legR : legL} position={[sx * 0.09, 0.32, 0]}>
            <mesh material={mats.skin} position-y={-0.14}>
              <capsuleGeometry args={[0.055, 0.2, 4, 8]} />
            </mesh>
            <mesh material={mats.shoe} position={[0, -0.29, 0.03]} scale={[1, 0.65, 1.4]}>
              <sphereGeometry args={[0.075, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* ワンピース（チーズいろ・みずたま） */}
        <mesh geometry={dressGeo} material={mats.dress} position-y={0.24} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + 0.4;
          const y = 0.32 + (i % 2) * 0.12;
          const r = 0.31 - (i % 2) * 0.06;
          return (
            <mesh key={i} material={mats.dot} position={[Math.sin(a) * r, y, Math.cos(a) * r]}>
              <sphereGeometry args={[0.028, 8, 6]} />
            </mesh>
          );
        })}
        <mesh material={mats.collar} position-y={0.82} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.13, 0.04, 8, 18]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx} ref={sx < 0 ? armR : armL} position={[sx * 0.19, 0.78, 0]}>
            <mesh material={mats.skin} position-y={-0.15}>
              <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
            </mesh>
          </group>
        ))}
        {carry && holding && <group position={[0, 0.55, 0.36]}>{holding}</group>}
        {/* あたま */}
        <group ref={head} position-y={0.86}>
          <mesh material={mats.skin} position-y={0.24}>
            <sphereGeometry args={[0.27, 24, 20]} />
          </mesh>
          {/* かみ */}
          <mesh material={mats.hair} position={[0, 0.3, -0.03]} scale={[1.06, 1.0, 1.04]}>
            <sphereGeometry args={[0.28, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          <mesh material={mats.hair} position={[0, 0.25, -0.06]} scale={[1.05, 1.05, 1]}>
            <sphereGeometry args={[0.27, 20, 16, Math.PI * 0.6, Math.PI * 0.8]} />
          </mesh>
          {/* まえがみ */}
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} material={mats.hair} position={[x, 0.42, 0.18]} scale={[1, 0.6, 0.6]}>
              <sphereGeometry args={[0.1, 12, 8]} />
            </mesh>
          ))}
          {/* ふたつむすび */}
          <group ref={tails}>
            {[-1, 1].map((sx) => (
              <group key={sx} position={[sx * 0.28, 0.3, -0.05]}>
                <mesh material={mats.hair} position={[sx * 0.08, -0.1, 0]} scale={[0.8, 1.3, 0.8]}>
                  <sphereGeometry args={[0.1, 12, 10]} />
                </mesh>
                <mesh material={mats.ribbon} position={[0, 0.02, 0]} rotation-z={sx * 0.5}>
                  <torusGeometry args={[0.05, 0.025, 6, 12]} />
                </mesh>
                <mesh material={mats.ribbon} position={[sx * 0.03, 0.05, 0]} scale={[1.4, 0.8, 0.5]}>
                  <sphereGeometry args={[0.05, 8, 6]} />
                </mesh>
              </group>
            ))}
          </group>
          {/* かお */}
          <group ref={eyes} position={[0, 0.23, 0.24]}>
            {[-1, 1].map((sx) => (
              <group key={sx} position={[sx * 0.09, 0, 0]} rotation-y={sx * 0.3}>
                <mesh material={mats.dark} scale={[0.8, 1.15, 0.45]}>
                  <sphereGeometry args={[0.045, 12, 10]} />
                </mesh>
                <mesh material={mats.shine} position={[0.013, 0.02, 0.022]}>
                  <sphereGeometry args={[0.013, 8, 6]} />
                </mesh>
              </group>
            ))}
          </group>
          {[-1, 1].map((sx) => (
            <mesh key={sx} material={mats.blush} position={[sx * 0.16, 0.15, 0.2]} rotation-y={sx * 0.6} scale={[1, 0.6, 0.2]}>
              <sphereGeometry args={[0.045, 10, 8]} />
            </mesh>
          ))}
          <mesh material={mats.mouth} position={[0, 0.13, 0.262]} rotation-z={Math.PI}>
            <torusGeometry args={[0.035, 0.01, 6, 12, Math.PI]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
