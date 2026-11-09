import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useCat } from '../../game/dialog';
import type { Emotion, Gesture } from '../../game/types';
import { tabbyTex } from '../tex';
import { BlobShadow } from '../common';

/**
 * チーズ職人の ねこ「ミルク」。
 * Three.js の基本形状だけで組み立てた仮モデル（あとで glTF に差し替え可能）。
 *  - まばたき、耳ぴくっ、しっぽ、口パク、表情、身ぶり、カメラを見る
 */
export type CatVariant = 'milk' | 'gray' | 'white' | 'black';

const FUR: Record<CatVariant, [string, string]> = {
  milk: ['#f4a85c', '#d27a2c'],
  gray: ['#b4b4bf', '#85858f'],
  white: ['#fbf7ef', '#eee4d2'],
  black: ['#57504f', '#3f3938'],
};

interface Mats {
  fur: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  pink: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  shine: THREE.MeshBasicMaterial;
  cloth: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  scarf: THREE.MeshStandardMaterial;
  blush: THREE.MeshBasicMaterial;
  mouth: THREE.MeshStandardMaterial;
  sweat: THREE.MeshStandardMaterial;
  stripe: THREE.MeshStandardMaterial;
}
const matCache = new Map<string, Mats>();
function getMats(v: CatVariant, scarf: string): Mats {
  const key = v + scarf;
  const hit = matCache.get(key);
  if (hit) return hit;
  const [base, stripe] = FUR[v];
  const m: Mats = {
    fur: new THREE.MeshStandardMaterial({ map: tabbyTex(base, stripe, 'tabby-' + v), roughness: 0.92 }),
    white: new THREE.MeshStandardMaterial({ color: '#fffaf1', roughness: 0.9 }),
    pink: new THREE.MeshStandardMaterial({ color: '#ff9fb4', roughness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2b1a10', roughness: 0.25 }),
    shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    cloth: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, side: THREE.DoubleSide }),
    accent: new THREE.MeshStandardMaterial({ color: '#ffd34d', roughness: 0.6 }),
    scarf: new THREE.MeshStandardMaterial({ color: scarf, roughness: 0.7 }),
    blush: new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.55, depthWrite: false }),
    mouth: new THREE.MeshStandardMaterial({ color: '#8a2c2c', roughness: 0.5 }),
    sweat: new THREE.MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.1, transparent: true, opacity: 0.85 }),
    stripe: new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.92 }),
  };
  matCache.set(key, m);
  return m;
}

const GESTURE_LEN: Record<Gesture, number> = {
  wave: 1.6,
  jump: 0.9,
  nod: 0.8,
  tilt: 1.3,
  point: 1.6,
  clap: 1.4,
  bow: 1.2,
  spin: 1.0,
  paw: 2.2,
  stir: 2.2,
};

export interface MilkCatProps {
  variant?: CatVariant;
  hat?: boolean;
  apron?: boolean;
  scarf?: string;
  /** true: 会話システム（useCat）の表情・口パクにしたがう */
  controlled?: boolean;
  /** NPC の固定表情 */
  face?: Emotion;
  /** しゃべるときに カメラの方を向く */
  faceCamera?: boolean;
  position?: THREE.Vector3Tuple;
  rotationY?: number;
  scale?: number;
  groupRef?: RefObject<THREE.Group | null>;
  shadow?: boolean;
  onTap?: () => void;
  seed?: number;
}

export function MilkCat({
  variant = 'milk',
  hat = true,
  apron = true,
  scarf = '#e8604c',
  controlled = true,
  face = 'happy',
  faceCamera = true,
  position,
  rotationY = 0,
  scale = 1,
  groupRef,
  shadow = true,
  onTap,
  seed = 0,
}: MilkCatProps) {
  const m = getMats(variant, scarf);
  const own = useRef<THREE.Group>(null);
  const root = groupRef ?? own;
  const turn = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const happyL = useRef<THREE.Mesh>(null);
  const happyR = useRef<THREE.Mesh>(null);
  const mouthClosed = useRef<THREE.Group>(null);
  const mouthOpen = useRef<THREE.Group>(null);
  const sweat = useRef<THREE.Mesh>(null);
  const blush = useRef<THREE.Group>(null);
  const tail = useRef<(THREE.Group | null)[]>([]);

  const st = useRef({
    blinkAt: 1 + seed,
    earAt: 2 + seed,
    earPrev: -10,
    earSide: 0,
    gestureN: -1,
    gesture: null as Gesture | null,
    gT: 0,
    lastPos: new THREE.Vector3(),
    speed: 0,
    walkPhase: 0,
    idleAt: 8 + seed * 3,
    mouth: 0,
    yaw: 0,
  });
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion() }), []);

  useFrame((state, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const t = state.clock.elapsedTime + seed * 10;
    const s = st.current;
    const cat = controlled ? useCat.getState() : null;
    const emo: Emotion = cat ? cat.face : face;
    const talking = cat ? cat.talking : false;

    // --- 歩き（親が動かしたぶんの速さ）
    if (root.current) {
      root.current.getWorldPosition(tmp.v);
      const d = tmp.v.distanceTo(s.lastPos);
      s.lastPos.copy(tmp.v);
      const sp = d / Math.max(dt, 1e-3);
      s.speed = THREE.MathUtils.lerp(s.speed, sp > 20 ? 0 : sp, 0.2);
    }
    const walking = s.speed > 0.25;
    s.walkPhase += dt * (walking ? 11 : 0);

    // --- 身ぶり
    if (cat && cat.gesture.n !== s.gestureN) {
      s.gestureN = cat.gesture.n;
      if (cat.gesture.name && s.gestureN > 0) {
        s.gesture = cat.gesture.name;
        s.gT = 0;
      }
    }
    // しゃべっていないときは ときどき 猫らしい しぐさ
    if (!talking && !s.gesture && t > s.idleAt && !walking) {
      s.gesture = Math.random() < 0.6 ? 'paw' : 'tilt';
      s.gT = 0;
      s.idleAt = t + 9 + Math.random() * 8;
    }
    let g = s.gesture;
    let gp = 0;
    if (g) {
      s.gT += dt;
      gp = s.gT / GESTURE_LEN[g];
      if (gp >= 1) {
        s.gesture = null;
        g = null;
      }
    }
    const env = g ? Math.sin(Math.min(1, gp) * Math.PI) : 0;

    // --- 体
    const breathe = Math.sin(t * 2.2) * 0.015;
    if (torso.current) torso.current.scale.set(1 + breathe * 0.5, 1.12 + breathe, 0.92);
    let bodyY = walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : 0;
    let bodyRX = 0;
    if (g === 'jump') bodyY += Math.sin(gp * Math.PI) * 0.4;
    if (emo === 'excited' && !g) bodyY += Math.abs(Math.sin(t * 6)) * 0.06;
    if (g === 'bow') bodyRX = env * 0.45;
    if (body.current) {
      body.current.position.y = bodyY;
      body.current.rotation.x = bodyRX;
      body.current.rotation.z = walking ? Math.sin(s.walkPhase) * 0.05 : Math.sin(t * 1.1) * 0.015;
    }
    if (turn.current) {
      // カメラの方へ ゆっくり向く
      let targetYaw = 0;
      if (faceCamera && root.current && (talking || controlled)) {
        root.current.getWorldPosition(tmp.v);
        root.current.getWorldQuaternion(tmp.q);
        tmp.w.copy(state.camera.position).sub(tmp.v).applyQuaternion(tmp.q.invert());
        targetYaw = THREE.MathUtils.clamp(Math.atan2(tmp.w.x, tmp.w.z), -1.4, 1.4);
        if (walking) targetYaw = 0;
      }
      s.yaw = THREE.MathUtils.lerp(s.yaw, targetYaw, 1 - Math.exp(-3 * dt));
      turn.current.rotation.y = s.yaw + (g === 'spin' ? Math.sin(gp * Math.PI * 0.5) * Math.PI * 2 : 0);
    }

    // --- 脚
    const leg = walking ? Math.sin(s.walkPhase) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = leg;
    if (legR.current) legR.current.rotation.x = -leg;

    // --- 腕
    let lz = 0.25,
      lx = walking ? -leg * 0.5 : Math.sin(t * 1.3) * 0.05,
      rz = -0.25,
      rx = walking ? leg * 0.5 : Math.sin(t * 1.3 + 1) * 0.05;
    switch (g) {
      case 'wave':
        rz = -0.25 - env * 2.3 + Math.sin(t * 14) * 0.3 * env;
        break;
      case 'jump':
        lz = 0.25 + env * 2.2;
        rz = -0.25 - env * 2.2;
        break;
      case 'point':
        rx = -env * 1.5;
        rz = -0.25 + env * 0.15;
        break;
      case 'clap':
        lx = rx = -env * 1.3;
        lz = 0.25 - env * (0.55 + Math.sin(t * 16) * 0.2);
        rz = -0.25 + env * (0.55 + Math.sin(t * 16) * 0.2);
        break;
      case 'paw':
        rx = -env * 2.3 + Math.sin(t * 12) * 0.2 * env;
        rz = -0.25 + env * 0.6;
        break;
      case 'stir':
        rx = -env * 1.1 + Math.sin(t * 7) * 0.25 * env;
        rz = -0.25 + Math.cos(t * 7) * 0.3 * env;
        break;
    }
    if (emo === 'think' && !g) {
      rx = -1.9;
      rz = 0.35;
    }
    if (emo === 'excited' && !g) {
      lz = 0.25 + 1.8 + Math.sin(t * 8) * 0.2;
      rz = -0.25 - 1.8 - Math.sin(t * 8) * 0.2;
    }
    if (armL.current) {
      armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, lz, 0.25);
      armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, lx, 0.25);
    }
    if (armR.current) {
      armR.current.rotation.z = THREE.MathUtils.lerp(armR.current.rotation.z, rz, 0.25);
      armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, rx, 0.25);
    }

    // --- 頭
    if (head.current) {
      let hx = Math.sin(t * 0.9) * 0.03;
      let hz = Math.sin(t * 0.7) * 0.03;
      if (talking) hx += Math.sin(t * 7) * 0.035;
      if (g === 'nod') hx += Math.sin(gp * Math.PI * 4) * 0.25;
      if (g === 'tilt') hz += env * 0.32;
      if (g === 'paw') hz += env * 0.2;
      if (emo === 'think') hz += 0.22;
      if (emo === 'proud') hx -= 0.15;
      if (emo === 'surprised') hx -= 0.08;
      if (emo === 'oops') hz -= 0.15;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, hx, 0.2);
      head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, hz, 0.2);
    }

    // --- 耳ぴくっ
    if (t > s.earAt) {
      s.earPrev = t;
      s.earAt = t + 2 + Math.random() * 4;
      s.earSide = Math.random() < 0.5 ? 1 : 2;
    }
    const flick = (side: number) => {
      const k = (t - s.earPrev) / 0.3;
      return s.earSide === side && k < 1 ? Math.sin(k * Math.PI) * 0.45 : 0;
    };
    if (earL.current) earL.current.rotation.z = -0.35 - flick(1) + (emo === 'oops' ? -0.4 : 0);
    if (earR.current) earR.current.rotation.z = 0.35 + flick(2) + (emo === 'oops' ? 0.4 : 0);

    // --- まばたき・目
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.14;
      blink = k < 1 ? Math.abs(1 - k * 2) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2 + Math.random() * 3;
    }
    const happyEyes = emo === 'happy' || emo === 'excited' || emo === 'proud';
    const eyeScaleY =
      emo === 'surprised' ? 1.25 : emo === 'gentle' ? 0.55 : emo === 'oops' ? 0.3 : 1;
    const eyeScale = emo === 'surprised' ? 1.2 : 1;
    const lookUp = emo === 'think' ? 0.025 : 0;
    if (eyeL.current) {
      eyeL.current.visible = !happyEyes && emo !== 'wink';
      eyeL.current.scale.set(eyeScale, eyeScaleY * blink * eyeScale, 1);
      eyeL.current.position.y = 0.3 + lookUp;
    }
    if (eyeR.current) {
      eyeR.current.visible = !happyEyes;
      eyeR.current.scale.set(eyeScale, eyeScaleY * blink * eyeScale, 1);
      eyeR.current.position.y = 0.3 + lookUp;
    }
    if (happyL.current) happyL.current.visible = happyEyes || emo === 'wink';
    if (happyR.current) happyR.current.visible = happyEyes;

    // --- 口
    const wantOpen = talking ? 0.35 + Math.abs(Math.sin(t * 13)) * 0.65 * (0.6 + 0.4 * Math.sin(t * 3.1)) : emo === 'surprised' ? 0.9 : emo === 'excited' ? 0.7 : 0;
    s.mouth = THREE.MathUtils.lerp(s.mouth, wantOpen, 0.35);
    if (mouthOpen.current) {
      mouthOpen.current.visible = s.mouth > 0.08;
      mouthOpen.current.scale.set(emo === 'surprised' ? 0.8 : 1, Math.max(0.1, s.mouth), 1);
    }
    if (mouthClosed.current) mouthClosed.current.visible = s.mouth <= 0.08;
    if (sweat.current) {
      sweat.current.visible = emo === 'oops';
      sweat.current.position.y = 0.42 - ((t * 0.3) % 0.1);
    }
    if (blush.current) blush.current.visible = emo !== 'oops';

    // --- しっぽ
    const tailAmp = emo === 'excited' || emo === 'happy' ? 0.35 : 0.22;
    tail.current.forEach((seg, i) => {
      if (!seg) return;
      seg.rotation.z = Math.sin(t * 2.4 - i * 0.6) * tailAmp;
      seg.rotation.x = i === 0 ? -1.0 : -0.2 + Math.sin(t * 1.3 - i * 0.4) * 0.05 + (i > 4 ? -0.25 : 0);
    });
  });

  const tailSegs = 7;
  return (
    <group
      ref={root}
      position={position}
      rotation-y={rotationY}
      scale={scale}
      onClick={
        onTap
          ? (e) => {
              e.stopPropagation();
              if (e.delta > 14) return;
              onTap();
            }
          : undefined
      }
    >
      {shadow && <BlobShadow size={0.9} />}
      <group ref={turn}>
        <group ref={body}>
          {/* 脚 */}
          {[-1, 1].map((sx) => (
            <group key={sx} ref={sx < 0 ? legR : legL} position={[sx * 0.12, 0.2, 0]}>
              <mesh material={m.fur} position-y={-0.08}>
                <capsuleGeometry args={[0.085, 0.1, 4, 10]} />
              </mesh>
              <mesh material={m.white} position={[0, -0.16, 0.04]} scale={[1, 0.6, 1.3]}>
                <sphereGeometry args={[0.1, 14, 10]} />
              </mesh>
            </group>
          ))}
          {/* 胴 */}
          <mesh ref={torso} material={m.fur} position-y={0.42} scale={[1, 1.12, 0.92]}>
            <sphereGeometry args={[0.3, 24, 18]} />
          </mesh>
          <mesh material={m.white} position={[0, 0.44, 0.17]} scale={[1, 1.25, 0.7]}>
            <sphereGeometry args={[0.2, 18, 14]} />
          </mesh>
          {apron && (
            <group>
              <mesh material={m.cloth} position-y={0.33}>
                <cylinderGeometry args={[0.29, 0.335, 0.34, 24, 1, true, -1.15, 2.3]} />
              </mesh>
              <mesh material={m.cloth} position={[0, 0.58, 0.245]} rotation-x={-0.25}>
                <boxGeometry args={[0.2, 0.17, 0.015]} />
              </mesh>
              <mesh material={m.accent} position={[0.06, 0.3, 0.33]} rotation-x={-0.12}>
                <boxGeometry args={[0.1, 0.08, 0.012]} />
              </mesh>
              {/* 背中のリボン */}
              <mesh material={m.cloth} position={[0.06, 0.42, -0.28]} rotation-z={0.6} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.06, 10, 8]} />
              </mesh>
              <mesh material={m.cloth} position={[-0.06, 0.42, -0.28]} rotation-z={-0.6} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.06, 10, 8]} />
              </mesh>
            </group>
          )}
          {/* スカーフ */}
          <mesh material={m.scarf} position-y={0.75} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.19, 0.05, 8, 20]} />
          </mesh>
          <mesh material={m.scarf} position={[0.05, 0.7, 0.2]} rotation={[0.3, 0, 0.5]}>
            <coneGeometry args={[0.07, 0.14, 3]} />
          </mesh>
          {/* 腕 */}
          {[-1, 1].map((sx) => (
            <group key={sx} ref={sx < 0 ? armR : armL} position={[sx * 0.27, 0.64, 0.02]}>
              <mesh material={m.fur} position-y={-0.14}>
                <capsuleGeometry args={[0.068, 0.16, 4, 10]} />
              </mesh>
              <mesh material={m.white} position-y={-0.27}>
                <sphereGeometry args={[0.08, 12, 10]} />
              </mesh>
            </group>
          ))}
          {/* しっぽ */}
          <group position={[0, 0.24, -0.25]}>
            <TailChain n={tailSegs} m={m} refs={tail} />
          </group>
          {/* 頭 */}
          <group ref={head} position-y={0.78}>
            <mesh material={m.fur} position-y={0.25} scale={[1.12, 0.95, 0.98]}>
              <sphereGeometry args={[0.33, 28, 22]} />
            </mesh>
            {/* マズル */}
            <mesh material={m.white} position={[0, 0.16, 0.25]} scale={[1.4, 0.82, 0.8]}>
              <sphereGeometry args={[0.12, 18, 14]} />
            </mesh>
            <mesh material={m.pink} position={[0, 0.215, 0.35]} scale={[1.3, 0.8, 0.8]}>
              <sphereGeometry args={[0.035, 12, 10]} />
            </mesh>
            {/* 口（とじ: ω） */}
            <group ref={mouthClosed}>
              {[-1, 1].map((sx) => (
                <mesh key={sx} material={m.dark} position={[sx * 0.032, 0.17, 0.345]} rotation-z={Math.PI}>
                  <torusGeometry args={[0.032, 0.009, 6, 12, Math.PI]} />
                </mesh>
              ))}
            </group>
            {/* 口（ひらき） */}
            <group ref={mouthOpen} position={[0, 0.135, 0.33]} visible={false}>
              <mesh material={m.mouth} scale={[1, 1, 0.45]}>
                <sphereGeometry args={[0.055, 14, 10]} />
              </mesh>
              <mesh material={m.pink} position={[0, -0.025, 0.012]} scale={[1, 0.5, 0.4]}>
                <sphereGeometry args={[0.035, 10, 8]} />
              </mesh>
            </group>
            {/* 目 */}
            {[-1, 1].map((sx) => (
              <group key={sx} ref={sx < 0 ? eyeR : eyeL} position={[sx * 0.13, 0.3, 0.27]} rotation-y={sx * 0.3}>
                <mesh material={m.dark} scale={[0.85, 1.12, 0.5]}>
                  <sphereGeometry args={[0.078, 16, 14]} />
                </mesh>
                <mesh material={m.shine} position={[0.022, 0.035, 0.04]}>
                  <sphereGeometry args={[0.024, 10, 8]} />
                </mesh>
                <mesh material={m.shine} position={[-0.02, -0.03, 0.038]}>
                  <sphereGeometry args={[0.011, 8, 6]} />
                </mesh>
              </group>
            ))}
            {[-1, 1].map((sx) => (
              <mesh
                key={'h' + sx}
                ref={sx < 0 ? happyR : happyL}
                material={m.dark}
                position={[sx * 0.13, 0.28, 0.3]}
                rotation-y={sx * 0.3}
                visible={false}
              >
                <torusGeometry args={[0.055, 0.016, 6, 14, Math.PI]} />
              </mesh>
            ))}
            {/* ほっぺ */}
            <group ref={blush}>
              {[-1, 1].map((sx) => (
                <mesh key={sx} material={m.blush} position={[sx * 0.21, 0.17, 0.25]} rotation-y={sx * 0.6} scale={[1, 0.7, 0.2]}>
                  <sphereGeometry args={[0.05, 10, 8]} />
                </mesh>
              ))}
            </group>
            {/* ひげ */}
            {[-1, 1].map((sx) =>
              [-0.12, 0, 0.12].map((a, i) => (
                <mesh
                  key={`${sx}${i}`}
                  material={m.white}
                  position={[sx * 0.27, 0.17 + a * 0.15, 0.27]}
                  rotation={[0, sx * 0.35, a * sx]}
                >
                  <boxGeometry args={[0.2, 0.008, 0.008]} />
                </mesh>
              )),
            )}
            {/* 耳 */}
            {[-1, 1].map((sx) => (
              <group key={sx} ref={sx < 0 ? earR : earL} position={[sx * 0.2, 0.48, 0]} rotation-z={sx * -0.35}>
                <mesh material={m.fur} position-y={0.09}>
                  <coneGeometry args={[0.12, 0.22, 12]} />
                </mesh>
                <mesh material={m.pink} position={[0, 0.07, 0.04]} scale={[1, 1, 0.5]}>
                  <coneGeometry args={[0.07, 0.15, 10]} />
                </mesh>
              </group>
            ))}
            {/* あせ */}
            <mesh ref={sweat} material={m.sweat} position={[0.33, 0.42, 0.12]} visible={false} scale={[1, 1.4, 1]}>
              <sphereGeometry args={[0.04, 10, 8]} />
            </mesh>
            {/* コック帽 */}
            {hat && (
              <group position={[0.02, 0.5, -0.03]} rotation={[-0.12, 0, 0.1]}>
                <mesh material={m.cloth}>
                  <cylinderGeometry args={[0.2, 0.21, 0.14, 22]} />
                </mesh>
                <mesh material={m.cloth} position-y={0.17} scale={[1.15, 0.78, 1.15]}>
                  <sphereGeometry args={[0.22, 20, 14]} />
                </mesh>
                {[0, 1, 2, 3].map((i) => (
                  <mesh
                    key={i}
                    material={m.cloth}
                    position={[Math.cos((i / 4) * Math.PI * 2) * 0.15, 0.2, Math.sin((i / 4) * Math.PI * 2) * 0.15]}
                  >
                    <sphereGeometry args={[0.12, 12, 10]} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

function TailChain({ n, m, refs }: { n: number; m: Mats; refs: React.RefObject<(THREE.Group | null)[]> }) {
  // 入れ子のグループで しなる しっぽを作る
  const build = (i: number): React.ReactNode => {
    if (i >= n) return null;
    const r = 0.062 - i * 0.004;
    return (
      <group
        ref={(el) => {
          refs.current[i] = el;
        }}
        position-y={i === 0 ? 0 : 0.085}
      >
        <mesh material={i % 2 ? m.stripe : m.fur} position-y={0.045}>
          <sphereGeometry args={[r, 10, 8]} />
        </mesh>
        {build(i + 1)}
      </group>
    );
  };
  return <>{build(0)}</>;
}
