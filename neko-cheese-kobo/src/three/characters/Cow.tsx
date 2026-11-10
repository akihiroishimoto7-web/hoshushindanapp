import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { holsteinTex } from '../tex';
import { BlobShadow, HitArea } from '../common';
import { bake, G, type Part } from '../bake';
import { bakedMat, unlitMat, withRim } from '../look';
import { fx } from '../fx';

/**
 * うしさん。ホルスタイン（しろくろ）とジャージー（ちゃいろ）。
 * 草を食べ、しっぽをふり、タップすると「モ〜」と顔を上げて にっこり する。
 * パーツは 頂点カラーで まとめて 1とう あたり 9 ドローコールほど。
 */
export type CowKind = 'holstein' | 'jersey';

const PINK = '#ffb3bd';
const DARK = '#2b211c';

interface Assets {
  bodyMat: THREE.MeshStandardMaterial;
  body: THREE.BufferGeometry;
  legs: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  ear: THREE.BufferGeometry;
  eyes: THREE.BufferGeometry;
  happy: THREE.BufferGeometry;
  mouth: THREE.BufferGeometry;
  blush: THREE.BufferGeometry;
}
const cache = new Map<string, Assets>();
const blushMat = new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.55, depthWrite: false });

function build(kind: CowKind, calf: boolean): Assets {
  const coat = kind === 'holstein' ? '#fbfaf6' : '#bd7d4c';
  const faceC = kind === 'holstein' ? '#fbfaf6' : '#e9c9a1';
  const patch = kind === 'holstein' ? DARK : '#a8683a';
  const legs: Part[] = [];
  [
    [-0.3, 0.55],
    [0.3, 0.55],
    [-0.3, -0.55],
    [0.3, -0.55],
  ].forEach(([x, z], i) => {
    legs.push(
      { geo: G.cyl(0.12, 0.1, 0.72, 10), color: kind === 'holstein' && i % 3 === 0 ? DARK : coat, pos: [x, 0.42, z] },
      { geo: G.cyl(0.11, 0.125, 0.13, 10), color: '#4a3b30', pos: [x, 0.065, z] },
    );
  });
  if (!calf) {
    legs.push({ geo: G.sphere(0.2, 14, 10), color: PINK, pos: [0, 0.62, -0.35], scale: [1, 0.75, 1] });
    [
      [-0.08, -0.08],
      [0.08, -0.08],
      [-0.08, 0.08],
      [0.08, 0.08],
    ].forEach(([x, z]) => legs.push({ geo: G.capsule(0.025, 0.05, 6), color: '#ff9fae', pos: [x, 0.47, -0.35 + z] }));
  }
  const tail = bake([
    { geo: G.cyl(0.025, 0.03, 0.65, 6), color: coat, pos: [0, -0.32, 0], rot: [0.1, 0, 0] },
    { geo: G.sphere(0.075, 8, 8), color: kind === 'holstein' ? DARK : '#7a4a28', pos: [0, -0.68, 0], scale: [1, 1.4, 1] },
  ]);
  // くび・あたま（くびの つけねが 原点）
  const H: THREE.Vector3Tuple = [0, 0.1, 0.42];
  const head: Part[] = [
    { geo: G.cyl(0.27, 0.32, 0.5, 14), color: coat, pos: [0, 0, 0.12], rot: [0.6, 0, 0] },
    { geo: G.sphere(0.34, 24, 18), color: faceC, pos: H, scale: [0.98, 1, 1.08] },
    // かたほうの めの まわりの ぶち
    { geo: G.sphere(0.2, 14, 12), color: patch, pos: [H[0] + 0.15, H[1] + 0.12, H[2] + 0.12], scale: [0.8, 0.9, 0.85] },
    // ピンクの はなづら
    { geo: G.sphere(0.21, 18, 14), color: PINK, pos: [H[0], H[1] - 0.14, H[2] + 0.27], scale: [1.12, 0.8, 0.85] },
    { geo: G.sphere(0.032, 8, 6), color: '#b8707c', pos: [H[0] - 0.08, H[1] - 0.1, H[2] + 0.435], scale: [1, 0.7, 0.5] },
    { geo: G.sphere(0.032, 8, 6), color: '#b8707c', pos: [H[0] + 0.08, H[1] - 0.1, H[2] + 0.435], scale: [1, 0.7, 0.5] },
    // にっこりの くち
    { geo: G.torus(0.09, 0.012, 6, 12, Math.PI * 0.7), color: '#a85a68', pos: [H[0], H[1] - 0.17, H[2] + 0.41], rot: [0.2, 0, Math.PI + 0.47] },
    // まえがみ
    { geo: G.sphere(0.1, 10, 8), color: patch, pos: [H[0], H[1] + 0.32, H[2] + 0.05], scale: [1.2, 0.7, 1] },
  ];
  if (!calf) {
    [-1, 1].forEach((sx) => head.push({ geo: G.cone(0.045, 0.16, 8), color: '#f3e6c8', pos: [H[0] + sx * 0.17, H[1] + 0.34, H[2] - 0.04], rot: [0, 0, -sx * 0.5] }));
    head.push(
      { geo: G.torus(0.27, 0.032, 6, 20), color: '#d9463a', pos: [0, -0.15, 0.2], rot: [Math.PI / 2 + 0.6, 0, 0] },
      { geo: G.sphere(0.075, 12, 10), color: '#f2c94c', pos: [0, -0.37, 0.36] },
      { geo: G.sphere(0.022, 6, 5), color: '#8a5a12', pos: [0, -0.43, 0.38] },
    );
  }
  const ear = bake([
    { geo: G.sphere(0.09, 10, 8), color: kind === 'holstein' ? DARK : coat, pos: [0.11, 0, 0], scale: [1.6, 0.5, 0.95] },
    { geo: G.sphere(0.075, 10, 8), color: PINK, pos: [0.12, 0, 0.035], scale: [1.3, 0.35, 0.5] },
  ]);
  const eyes: Part[] = [];
  const happy: Part[] = [];
  [-1, 1].forEach((sx) => {
    const x = H[0] + sx * 0.175;
    const y = 0;
    const z = H[2] + 0.285;
    const ry = sx * 0.5;
    eyes.push(
      { geo: G.sphere(1, 16, 12), color: '#241a14', pos: [x, y, z], rot: [0, ry, 0], scale: [0.062, 0.078, 0.03] },
      { geo: G.sphere(1, 10, 8), color: '#ffffff', pos: [x + 0.018, y + 0.03, z + 0.03], scale: [0.022, 0.024, 0.012] },
      { geo: G.sphere(1, 8, 6), color: '#ffffff', pos: [x - 0.02, y - 0.022, z + 0.028], scale: [0.01, 0.011, 0.007] },
      // まつげ
      { geo: G.box(0.05, 0.009, 0.009), color: '#241a14', pos: [x + sx * 0.06, y + 0.06, z - 0.02], rot: [0, ry, sx * 0.6] },
      { geo: G.box(0.045, 0.009, 0.009), color: '#241a14', pos: [x + sx * 0.07, y + 0.03, z - 0.03], rot: [0, ry, sx * 0.3] },
    );
    happy.push({ geo: G.torus(0.05, 0.016, 6, 12, Math.PI), color: '#241a14', pos: [x, y - 0.02, z + 0.01], rot: [0, ry, 0], scale: [1, 1, 0.6] });
  });
  const blush = bake([
    { geo: G.sphere(0.065, 10, 8), pos: [H[0] - 0.24, H[1] - 0.04, H[2] + 0.2], rot: [0, -0.8, 0], scale: [1, 0.65, 0.2] },
    { geo: G.sphere(0.065, 10, 8), pos: [H[0] + 0.24, H[1] - 0.04, H[2] + 0.2], rot: [0, 0.8, 0], scale: [1, 0.65, 0.2] },
  ]);
  const mouth = bake([{ geo: G.sphere(0.08, 10, 8), color: '#7a2e2e', pos: [0, 0, H[2] + 0.36], scale: [1, 0.7, 0.5] }]);
  const bodyMat =
    kind === 'holstein'
      ? withRim(new THREE.MeshStandardMaterial({ map: holsteinTex(), roughness: 0.9 }), '#fff3dc', 0.4)
      : withRim(new THREE.MeshStandardMaterial({ color: coat, roughness: 0.9 }), '#ffe2c0', 0.45);
  return {
    bodyMat,
    body: new THREE.SphereGeometry(0.5, 28, 20),
    legs: bake(legs),
    tail,
    head: bake(head),
    ear,
    eyes: bake(eyes),
    happy: bake(happy),
    mouth,
    blush,
  };
}

export function Cow({
  kind = 'holstein',
  position,
  rotationY = 0,
  scale = 1,
  mooAt,
  seed = 0,
  graze = true,
  onTap,
}: {
  kind?: CowKind;
  position?: THREE.Vector3Tuple;
  rotationY?: number;
  scale?: number;
  /** この値（clock 時刻）が変わると モ〜 */
  mooAt?: React.RefObject<number>;
  seed?: number;
  graze?: boolean;
  onTap?: () => void;
}) {
  const isCalf = scale < 0.75;
  const key = kind + isCalf;
  let A = cache.get(key);
  if (!A) cache.set(key, (A = build(kind, isCalf)));
  const root = useRef<THREE.Group>(null);
  const bodyG = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Mesh>(null);
  const happy = useRef<THREE.Mesh>(null);
  const st = useRef({ blinkAt: 2 + seed, mooT: -10, lastMoo: 0, hearted: true });
  const v = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed * 7;
    const now = state.clock.elapsedTime;
    const s = st.current;
    if (mooAt && mooAt.current !== s.lastMoo) {
      s.lastMoo = mooAt.current;
      s.mooT = now;
      s.hearted = false;
    }
    const mooK = (now - s.mooT) / 1.5;
    const mooing = mooK >= 0 && mooK < 1;
    const glad = now - s.mooT < 2.6;
    if (neck.current) {
      // 草を食べる → ときどき顔を上げる
      const cycle = (Math.sin(t * 0.35) + 1) / 2;
      const down = graze ? THREE.MathUtils.smoothstep(cycle, 0.35, 0.65) : 0.1;
      let rx = -0.15 + down * 0.95;
      if (glad) rx = -0.35 * Math.sin(Math.min(1, mooK * 1.2) * Math.PI) - 0.05;
      neck.current.rotation.x = THREE.MathUtils.lerp(neck.current.rotation.x, rx, 0.1);
      neck.current.rotation.y = Math.sin(t * 0.21) * 0.15;
      neck.current.rotation.z = glad ? Math.sin(now * 7) * 0.06 : 0;
      // モ〜の あとに ハート
      if (!s.hearted && mooK > 0.35) {
        s.hearted = true;
        neck.current.getWorldPosition(v.current);
        fx.hearts([v.current.x, v.current.y + 0.9 * scale, v.current.z], 5);
      }
    }
    if (bodyG.current) {
      const k = now - s.mooT;
      const w = k < 0.8 ? Math.sin(k * 16) * 0.06 * Math.exp(-k * 5) : 0;
      bodyG.current.scale.set(1 - w * 0.6, 1 + w, 1 - w * 0.6);
    }
    if (mouth.current) {
      mouth.current.visible = mooing;
      mouth.current.scale.y = mooing ? 0.5 + Math.sin(mooK * Math.PI) * 0.9 : 0.1;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * (glad ? 6 : 1.7)) * 0.35 + Math.sin(t * 4.1) * 0.08;
    const flick = Math.max(0, Math.sin(t * 0.9)) > 0.97 ? Math.sin(t * 40) * 0.3 : 0;
    if (earL.current) earL.current.rotation.z = -0.2 + flick + (glad ? 0.25 : 0);
    if (earR.current) earR.current.rotation.z = 0.2 - flick - (glad ? 0.25 : 0);
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.18;
      blink = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2.5 + Math.random() * 3;
    }
    if (eyes.current) {
      eyes.current.visible = !glad;
      eyes.current.scale.y = blink;
    }
    if (happy.current) happy.current.visible = glad;
  });

  const m = bakedMat(0.9, 0.35);
  return (
    <group
      ref={root}
      position={position}
      rotation-y={rotationY}
      scale={scale}
      dispose={null}
      onClick={
        onTap
          ? (e) => {
              e.stopPropagation();
              if (e.delta > 14) return;
              fx.pop(e.point);
              onTap();
            }
          : undefined
      }
    >
      <BlobShadow size={2.5} opacity={0.3} />
      {onTap && <HitArea r={1.25} position={[0, 1.0, 0.3]} />}
      <group ref={bodyG}>
        <mesh geometry={A.body} material={A.bodyMat} position-y={1.0} scale={[0.98, 0.88, 1.68]} />
        <mesh geometry={A.legs} material={m} />
        <mesh ref={tail} geometry={A.tail} material={m} position={[0, 1.25, -0.84]} />
        <group ref={neck} position={[0, 1.18, 0.72]}>
          <mesh geometry={A.head} material={m} />
          <group position={[0, 0.1, 0.42]}>
            <mesh ref={earL} geometry={A.ear} material={m} position={[0.3, 0.16, -0.04]} rotation-z={-0.2} />
            <mesh ref={earR} geometry={A.ear} material={m} position={[-0.3, 0.16, -0.04]} rotation-z={0.2} scale={[-1, 1, 1]} />
          </group>
          <mesh ref={eyes} geometry={A.eyes} material={unlitMat()} position-y={0.18} />
          <mesh ref={happy} geometry={A.happy} material={unlitMat()} position-y={0.18} visible={false} />
          <mesh ref={mouth} geometry={A.mouth} material={unlitMat()} position-y={-0.14} visible={false} />
          <mesh geometry={A.blush} material={blushMat} />
        </group>
      </group>
    </group>
  );
}
