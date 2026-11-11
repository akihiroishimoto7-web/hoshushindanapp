import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useCat } from '../../game/dialog';
import type { Emotion, Gesture } from '../../game/types';
import { tabbyTex } from '../tex';
import { BlobShadow, HitArea } from '../common';
import { bake, G, type Part } from '../bake';
import { bakedMat, unlitMat, withRim } from '../look';
import { FurShells } from '../fur';
import { fx } from '../fx';
import { playSfx } from '../../audio/sfx';

/**
 * チーズ職人の ねこ「ミルク」。
 * Three.js の基本形状だけで組み立てたモデル（あとで glTF に差し替え可能）。
 *  - おおきな ひとみ、ふわふわの ほっぺ、まばたき、耳ぴくっ、しっぽ、口パク、表情、身ぶり
 *  - タップすると ゴロゴロ・ジャンプ・てれる・くるりん など いろいろな はんのう
 *  - パーツは 頂点カラーで まとめて、1ぴき あたり 25 ドローコールほど
 */
export type CatVariant = 'milk' | 'gray' | 'white' | 'black';

const FUR: Record<CatVariant, [string, string, string]> = {
  // [ベース, しま, めの いろ]
  milk: ['#f6a95a', '#d9792a', '#c9822a'],
  gray: ['#b9bac6', '#8a8b98', '#5f9a8a'],
  white: ['#fbf7ef', '#eadfca', '#5a94c9'],
  black: ['#5d5655', '#433c3b', '#c9a02a'],
};
const WHITE = '#fffaf1';
const PINK = '#ff9fb4';
const DARK = '#2b1a10';

interface Assets {
  fur: THREE.MeshStandardMaterial;
  stripe: THREE.MeshStandardMaterial;
  plain: THREE.MeshStandardMaterial;
  leg: THREE.BufferGeometry;
  arm: THREE.BufferGeometry;
  ear: THREE.BufferGeometry;
  deco: THREE.BufferGeometry;
  face: THREE.BufferGeometry;
  eye: THREE.BufferGeometry;
  happy: THREE.BufferGeometry;
  mouthClosed: THREE.BufferGeometry;
  mouthOpen: THREE.BufferGeometry;
  blush: THREE.BufferGeometry;
  hat: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  torso: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
}

const blushMat = new THREE.MeshBasicMaterial({ color: '#ff7d96', transparent: true, opacity: 0.62, depthWrite: false });
const sweatMat = new THREE.MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.1, transparent: true, opacity: 0.85 });
const sweatGeo = new THREE.SphereGeometry(0.04, 10, 8);

const cache = new Map<string, Assets>();
function getAssets(v: CatVariant, scarf: string, apron: boolean): Assets {
  const key = `${v}:${scarf}:${apron}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [base, stripe, iris] = FUR[v];

  const leg = bake([
    { geo: G.capsule(0.085, 0.1, 10), color: base, pos: [0, -0.08, 0] },
    { geo: G.sphere(0.1, 14, 10), color: WHITE, pos: [0, -0.16, 0.045], scale: [1, 0.6, 1.35] },
  ]);
  const arm = bake([
    { geo: G.capsule(0.066, 0.16, 10), color: base, pos: [0, -0.14, 0] },
    { geo: G.sphere(0.084, 14, 10), color: WHITE, pos: [0, -0.275, 0] },
    // にくきゅう
    { geo: G.sphere(0.034, 8, 6), color: PINK, pos: [0, -0.29, 0.066], scale: [1.1, 0.9, 0.45] },
    { geo: G.sphere(0.017, 6, 5), color: PINK, pos: [-0.04, -0.245, 0.066], scale: [1, 1, 0.5] },
    { geo: G.sphere(0.017, 6, 5), color: PINK, pos: [0, -0.232, 0.072], scale: [1, 1, 0.5] },
    { geo: G.sphere(0.017, 6, 5), color: PINK, pos: [0.04, -0.245, 0.066], scale: [1, 1, 0.5] },
  ]);
  const ear = bake([
    { geo: G.cone(0.135, 0.25, 14), color: base, pos: [0, 0.1, 0] },
    { geo: G.cone(0.085, 0.18, 10), color: PINK, pos: [0, 0.085, 0.05], scale: [1, 1, 0.5] },
    { geo: G.cone(0.04, 0.11, 6), color: WHITE, pos: [-0.03, 0.03, 0.085], rot: [0.5, 0, 0.3], scale: [1, 1, 0.6] },
    { geo: G.cone(0.04, 0.1, 6), color: WHITE, pos: [0.035, 0.025, 0.085], rot: [0.5, 0, -0.3], scale: [1, 1, 0.6] },
  ]);

  // 胴の かざり（おなかの しろ・エプロン・スカーフ・すず）
  const deco: Part[] = [
    { geo: G.sphere(0.2, 18, 14), color: WHITE, pos: [0, 0.43, 0.165], scale: [1, 1.25, 0.7] },
    { geo: G.torus(0.2, 0.055, 8, 22), color: scarf, pos: [0, 0.705, 0], rot: [Math.PI / 2, 0, 0] },
    { geo: G.cone(0.075, 0.15, 4), color: scarf, pos: [0.07, 0.655, 0.2], rot: [0.3, 0, 0.55] },
    { geo: G.cone(0.065, 0.13, 4), color: scarf, pos: [-0.04, 0.65, 0.21], rot: [0.3, 0, -0.5] },
    { geo: G.sphere(0.04, 10, 8), color: '#ffd24a', pos: [0.012, 0.63, 0.255] },
    { geo: G.sphere(0.012, 6, 5), color: '#8a5a12', pos: [0.012, 0.612, 0.29] },
  ];
  if (apron) {
    deco.push(
      { geo: new THREE.CylinderGeometry(0.292, 0.345, 0.34, 24, 1, true, -1.2, 2.4), color: '#ffffff', pos: [0, 0.3, 0] },
      { geo: G.box(0.21, 0.16, 0.02), color: '#ffffff', pos: [0, 0.545, 0.262], rot: [-0.28, 0, 0] },
      // ポケット（チーズの かたち）
      { geo: new THREE.CylinderGeometry(0.06, 0.06, 0.015, 14, 1, false, 0.5, Math.PI * 2 - 1), color: '#ffd24a', pos: [0.075, 0.285, 0.325], rot: [Math.PI / 2 - 0.15, 0, 0] },
      // せなかの リボン
      { geo: G.sphere(0.065, 10, 8), color: '#ffffff', pos: [0.07, 0.43, -0.275], rot: [0, 0, 0.6], scale: [1.2, 0.6, 0.4] },
      { geo: G.sphere(0.065, 10, 8), color: '#ffffff', pos: [-0.07, 0.43, -0.275], rot: [0, 0, -0.6], scale: [1.2, 0.6, 0.4] },
      { geo: G.sphere(0.03, 8, 6), color: '#ffffff', pos: [0, 0.43, -0.285] },
    );
  }

  // かおの パーツ（マズル・はな・ほっぺの 毛・ひげ）
  const face: Part[] = [
    { geo: G.sphere(0.088, 16, 12), color: WHITE, pos: [-0.056, 0.135, 0.322], scale: [1.12, 0.86, 0.72] },
    { geo: G.sphere(0.088, 16, 12), color: WHITE, pos: [0.056, 0.135, 0.322], scale: [1.12, 0.86, 0.72] },
    { geo: G.sphere(0.06, 12, 10), color: WHITE, pos: [0, 0.085, 0.31], scale: [1.2, 0.8, 0.8] },
    { geo: G.sphere(0.03, 12, 10), color: '#ff8fa8', pos: [0, 0.186, 0.385], scale: [1.45, 0.9, 0.8] },
  ];
  [-1, 1].forEach((sx) => {
    // ほっぺの ふわふわ
    face.push(
      { geo: G.cone(0.065, 0.15, 8), color: base, pos: [sx * 0.4, 0.2, 0.06], rot: [0, 0, -sx * 1.75], scale: [1, 1, 0.7] },
      { geo: G.cone(0.065, 0.16, 8), color: WHITE, pos: [sx * 0.385, 0.13, 0.09], rot: [0, 0, -sx * 2.05], scale: [1, 1, 0.7] },
      { geo: G.cone(0.055, 0.12, 8), color: base, pos: [sx * 0.33, 0.075, 0.1], rot: [0, 0, -sx * 2.4], scale: [1, 1, 0.7] },
    );
    [-0.13, 0, 0.13].forEach((a) => {
      face.push({ geo: G.box(0.2, 0.007, 0.007), color: '#ffffff', pos: [sx * 0.27, 0.15 + a * 0.2, 0.3], rot: [0, sx * 0.4, a * sx] });
    });
  });

  // 目（光に 左右されない ぬり。おおきな ハイライトで うるうる）
  const eye = bake([
    { geo: G.sphere(1, 20, 16), color: DARK, scale: [0.094, 0.118, 0.04] },
    { geo: G.sphere(1, 16, 12), color: iris, pos: [0, -0.03, 0.02], scale: [0.072, 0.074, 0.03] },
    { geo: G.sphere(1, 12, 10), color: '#ffe0a0', pos: [0, -0.066, 0.034], scale: [0.04, 0.022, 0.02] },
    { geo: G.sphere(1, 12, 10), color: '#140c08', pos: [0, 0.012, 0.03], scale: [0.045, 0.06, 0.025] },
    { geo: G.sphere(1, 12, 10), color: '#ffffff', pos: [0.03, 0.05, 0.05], scale: [0.034, 0.038, 0.015] },
    { geo: G.sphere(1, 8, 6), color: '#ffffff', pos: [-0.032, -0.02, 0.05], scale: [0.015, 0.016, 0.01] },
  ]);
  const happy = bake([{ geo: G.torus(0.06, 0.02, 8, 16, Math.PI), color: DARK, scale: [1, 1, 0.6] }]);
  const mouthClosed = bake([
    { geo: G.torus(0.036, 0.0095, 6, 12, Math.PI), color: DARK, pos: [-0.036, 0.153, 0.39], rot: [0, 0, Math.PI] },
    { geo: G.torus(0.036, 0.0095, 6, 12, Math.PI), color: DARK, pos: [0.036, 0.153, 0.39], rot: [0, 0, Math.PI] },
  ]);
  const mouthOpen = bake([
    { geo: G.sphere(0.058, 14, 10), color: '#7a2230', scale: [1, 1, 0.4] },
    { geo: G.sphere(0.04, 10, 8), color: '#ff8fa3', pos: [0, -0.028, 0.012], scale: [1, 0.5, 0.4] },
  ]);
  const blush = bake([
    { geo: G.sphere(0.058, 10, 8), pos: [-0.25, 0.155, 0.285], rot: [0, -0.65, 0], scale: [1, 0.66, 0.2] },
    { geo: G.sphere(0.058, 10, 8), pos: [0.25, 0.155, 0.285], rot: [0, 0.65, 0], scale: [1, 0.66, 0.2] },
  ]);
  const hatParts: Part[] = [
    { geo: G.cyl(0.215, 0.225, 0.15, 22), color: '#fffdf8' },
    { geo: G.sphere(0.24, 20, 14), color: '#ffffff', pos: [0, 0.2, 0], scale: [1.16, 0.8, 1.16] },
    { geo: G.torus(0.223, 0.014, 6, 22), color: '#ffd24a', pos: [0, -0.05, 0], rot: [Math.PI / 2, 0, 0] },
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    hatParts.push({ geo: G.sphere(0.13, 12, 10), color: '#ffffff', pos: [Math.cos(a) * 0.17, 0.22, Math.sin(a) * 0.17] });
  }

  const tex = tabbyTex(base, stripe, 'tabby2-' + v);
  const a: Assets = {
    fur: withRim(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), '#ffe9c8', 0.55, 2.2),
    stripe: withRim(new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.95 }), '#ffe9c8', 0.45, 2.2),
    plain: withRim(new THREE.MeshStandardMaterial({ color: base, roughness: 0.95 }), '#ffe9c8', 0.45, 2.2),
    leg,
    arm,
    ear,
    deco: bake(deco),
    face: bake(face),
    eye,
    happy,
    mouthClosed,
    mouthOpen,
    blush,
    hat: bake(hatParts),
    head: new THREE.SphereGeometry(0.37, 32, 24),
    torso: new THREE.SphereGeometry(0.29, 24, 18),
    tail: new THREE.SphereGeometry(1, 10, 8),
  };
  cache.set(key, a);
  return a;
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
  cheer: 1.5,
  purr: 1.8,
  shy: 1.7,
};

export interface MilkCatProps {
  variant?: CatVariant;
  hat?: boolean;
  apron?: boolean;
  scarf?: string;
  /** true: 会話システム（useCat）の表情・口パクにしたがう */
  controlled?: boolean;
  /** ほんものの毛のような ふわふわ（主役の ミルクだけ。おきゃくさんは 軽い表示） */
  fur?: boolean;
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

const REACTIONS: Gesture[] = ['purr', 'jump', 'shy', 'spin', 'purr', 'cheer'];

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
  fur: furProp,
  onTap,
  seed = 0,
}: MilkCatProps) {
  const fur = furProp ?? controlled;
  const A = getAssets(variant, scarf, apron);
  const own = useRef<THREE.Group>(null);
  const root = groupRef ?? own;
  const turn = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const hatG = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const happyL = useRef<THREE.Mesh>(null);
  const happyR = useRef<THREE.Mesh>(null);
  const mouthClosed = useRef<THREE.Mesh>(null);
  const mouthOpen = useRef<THREE.Mesh>(null);
  const sweat = useRef<THREE.Mesh>(null);
  const blush = useRef<THREE.Mesh>(null);
  const tailRoot = useRef<THREE.Group>(null);
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
    idleAt: 7 + seed * 3,
    mouth: 0,
    yaw: 0,
    react: seed,
    wantReact: null as Gesture | null,
    loveAt: 0,
    hatLag: 0,
    lookAt: 3 + seed,
    lookYaw: 0,
    landed: true,
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
    // タップされた ときの はんのう
    if (s.wantReact) {
      s.gesture = s.wantReact;
      s.gT = 0;
      s.wantReact = null;
    }
    // しゃべっていないときは ときどき 猫らしい しぐさ
    if (!talking && !s.gesture && t > s.idleAt && !walking) {
      s.gesture = Math.random() < 0.55 ? 'paw' : 'tilt';
      s.gT = 0;
      s.idleAt = t + 8 + Math.random() * 8;
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

    // --- 体（ジャンプは しゃがむ → のびる → ぺたん）
    const breathe = Math.sin(t * 2.2) * 0.015;
    if (torso.current) torso.current.scale.set(1 + breathe * 0.5, 1.1 + breathe, 0.92);
    let bodyY = walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : 0;
    let bodyRX = 0;
    let bodyRZ = walking ? Math.sin(s.walkPhase) * 0.05 : Math.sin(t * 1.1) * 0.015;
    let sq = 0; // + で たてに のびる
    let air = 0;
    if (g === 'jump') {
      const k = gp < 0.18 ? 0 : (gp - 0.18) / 0.62;
      air = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
      bodyY += air * 0.45;
      sq = gp < 0.18 ? -Math.sin((gp / 0.18) * Math.PI) * 0.14 : k < 1 ? air * 0.1 : -Math.sin(((gp - 0.8) / 0.2) * Math.PI) * 0.12;
    }
    if (g === 'cheer') {
      air = Math.abs(Math.sin(gp * Math.PI * 3));
      bodyY += air * 0.2 * env;
      sq = (air - 0.5) * 0.1;
    }
    if (g === 'purr') bodyRZ += Math.sin(t * 5) * 0.06 * env;
    if (g === 'shy') bodyRZ += Math.sin(t * 6) * 0.05 * env;
    if (emo === 'excited' && !g) {
      air = Math.abs(Math.sin(t * 6));
      bodyY += air * 0.07;
      sq = (air - 0.5) * 0.05;
    }
    if (g === 'bow') bodyRX = env * 0.45;
    // ちゃくち したら 小さな けむり
    if (air > 0.3) s.landed = false;
    else if (!s.landed && air < 0.05) {
      s.landed = true;
      if (root.current && g === 'jump') {
        root.current.getWorldPosition(tmp.v);
        fx.burst([tmp.v.x, tmp.v.y + 0.05, tmp.v.z], { count: 6, color: '#fff6e0', speed: 0.9, gravity: 0.5, life: 0.5, size: 0.3, up: 0.2 });
      }
    }
    if (body.current) {
      body.current.position.y = bodyY;
      body.current.rotation.x = bodyRX;
      body.current.rotation.z = bodyRZ;
      body.current.scale.set(1 - sq * 0.6, 1 + sq, 1 - sq * 0.6);
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
      turn.current.rotation.y = s.yaw + (g === 'spin' ? THREE.MathUtils.smootherstep(gp, 0, 1) * Math.PI * 2 : 0);
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
      case 'cheer':
        lz = 0.25 + env * (2.3 + Math.sin(t * 16) * 0.2);
        rz = -0.25 - env * (2.3 + Math.sin(t * 16 + 1) * 0.2);
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
      case 'shy':
        // りょうてを ほっぺに
        lx = rx = -env * 2.25;
        lz = 0.25 - env * 0.75;
        rz = -0.25 + env * 0.75;
        break;
      case 'purr':
        lx = rx = -env * 0.5;
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

    // --- 頭（ときどき きょろきょろ）
    if (t > s.lookAt) {
      s.lookYaw = talking || g ? 0 : (Math.random() - 0.5) * 0.7;
      s.lookAt = t + 2.5 + Math.random() * 3;
    }
    if (head.current) {
      let hx = Math.sin(t * 0.9) * 0.03;
      let hz = Math.sin(t * 0.7) * 0.03;
      let hy = talking || g || walking ? 0 : s.lookYaw;
      if (talking) hx += Math.sin(t * 7) * 0.035;
      if (g === 'nod') hx += Math.sin(gp * Math.PI * 4) * 0.25;
      if (g === 'tilt') hz += env * 0.32;
      if (g === 'paw') hz += env * 0.2;
      if (g === 'purr') {
        hz += Math.sin(t * 5) * 0.14 * env;
        hx += env * 0.12;
      }
      if (g === 'shy') {
        hx += env * 0.2;
        hy = Math.sin(t * 6) * 0.12 * env;
      }
      if (g === 'cheer') hx -= env * 0.18;
      if (emo === 'think') hz += 0.22;
      if (emo === 'proud') hx -= 0.15;
      if (emo === 'surprised') hx -= 0.08;
      if (emo === 'oops') hz -= 0.15;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, hx, 0.2);
      head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, hz, 0.2);
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, hy, 0.08);
      head.current.position.y = 0.74 + sq * 0.12;
    }
    // ぼうしは すこし おくれて ついてくる
    if (hatG.current) {
      s.hatLag = THREE.MathUtils.lerp(s.hatLag, air, 0.18);
      hatG.current.position.y = 0.6 + Math.max(0, s.hatLag - air) * 0.3;
      hatG.current.rotation.z = 0.1 + (s.hatLag - air) * 0.35;
      hatG.current.scale.y = 1 + Math.max(0, air - s.hatLag) * 0.25;
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
    const earDown = emo === 'oops' ? 0.45 : g === 'shy' || g === 'purr' ? env * 0.3 : emo === 'surprised' ? -0.12 : 0;
    if (earL.current) earL.current.rotation.z = -0.38 - flick(1) - earDown;
    if (earR.current) earR.current.rotation.z = 0.38 + flick(2) + earDown;

    // --- まばたき・目
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.14;
      blink = k < 1 ? Math.abs(1 - k * 2) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2 + Math.random() * 3;
    }
    const smiling = g === 'purr' || g === 'shy' || g === 'cheer';
    const happyEyes = emo === 'excited' || emo === 'proud' || emo === 'love' || smiling;
    const eyeScaleY = emo === 'surprised' ? 1.18 : emo === 'gentle' ? 0.62 : emo === 'oops' ? 0.4 : emo === 'happy' ? 0.92 : 1;
    const eyeScale = emo === 'surprised' ? 1.16 : 1;
    const lookUp = emo === 'think' ? 0.022 : 0;
    if (eyeL.current) {
      eyeL.current.visible = !happyEyes && emo !== 'wink';
      eyeL.current.scale.set(eyeScale, eyeScaleY * blink * eyeScale, 1);
      eyeL.current.position.y = 0.262 + lookUp;
    }
    if (eyeR.current) {
      eyeR.current.visible = !happyEyes;
      eyeR.current.scale.set(eyeScale, eyeScaleY * blink * eyeScale, 1);
      eyeR.current.position.y = 0.262 + lookUp;
    }
    if (happyL.current) happyL.current.visible = happyEyes || emo === 'wink';
    if (happyR.current) happyR.current.visible = happyEyes;

    // --- 口
    const wantOpen = talking
      ? 0.35 + Math.abs(Math.sin(t * 13)) * 0.65 * (0.6 + 0.4 * Math.sin(t * 3.1))
      : emo === 'surprised'
        ? 0.9
        : emo === 'excited' || g === 'cheer'
          ? 0.75
          : emo === 'happy' || emo === 'love'
            ? 0.32
            : 0;
    s.mouth = THREE.MathUtils.lerp(s.mouth, wantOpen, 0.35);
    if (mouthOpen.current) {
      mouthOpen.current.visible = s.mouth > 0.08;
      mouthOpen.current.scale.set(emo === 'surprised' ? 0.75 : 1.05, Math.max(0.1, s.mouth), 1);
    }
    if (mouthClosed.current) mouthClosed.current.visible = s.mouth <= 0.45;
    if (sweat.current) {
      sweat.current.visible = emo === 'oops';
      sweat.current.position.y = 0.46 - ((t * 0.3) % 0.1);
    }
    if (blush.current) {
      blush.current.visible = emo !== 'oops';
      blush.current.scale.setScalar(g === 'shy' || emo === 'love' ? 1.25 : 1);
    }
    // だいすき！の ハート
    if ((emo === 'love' || g === 'purr') && t > s.loveAt && head.current) {
      s.loveAt = t + 0.55;
      head.current.getWorldPosition(tmp.v);
      fx.hearts([tmp.v.x, tmp.v.y + 0.55 * scale, tmp.v.z], 2);
    }

    // --- しっぽ（うれしいと 大きく、びっくりすると ふくらむ）
    const tailAmp = emo === 'excited' || emo === 'happy' || emo === 'love' || smiling ? 0.36 : 0.22;
    const tailSp = smiling || emo === 'excited' ? 4.2 : 2.4;
    tail.current.forEach((seg, i) => {
      if (!seg) return;
      seg.rotation.z = Math.sin(t * tailSp - i * 0.6) * tailAmp;
      seg.rotation.x = i === 0 ? -1.0 : -0.2 + Math.sin(t * 1.3 - i * 0.4) * 0.05 + (i > 3 ? -0.3 : 0);
    });
    if (tailRoot.current) {
      const puff = emo === 'surprised' ? 1.35 : 1;
      tailRoot.current.scale.x = tailRoot.current.scale.z = THREE.MathUtils.lerp(tailRoot.current.scale.x, puff, 0.2);
    }
  });

  const react = () => {
    const s = st.current;
    const r = REACTIONS[Math.floor(s.react++) % REACTIONS.length];
    s.wantReact = r;
    if (r === 'purr') playSfx('purr');
    else if (r === 'shy') playSfx('ting');
    else playSfx('meow');
    onTap?.();
  };

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
              fx.pop(e.point, ['#ffd34d', '#ff9fb4', '#ffffff']);
              react();
            }
          : undefined
      }
    >
      {shadow && <BlobShadow size={0.95} />}
      {onTap && <HitArea r={0.62} position={[0, 0.75, 0]} />}
      <group ref={turn}>
        <group ref={body}>
          {/* 脚 */}
          <mesh ref={legL} geometry={A.leg} material={bakedMat(0.95, 0.35)} position={[0.12, 0.2, 0]}>
            {fur && <FurShells id="leg" geometry={A.leg} base={bakedMat(0.95, 0.35)} layers={5} length={0.02} density={80} />}
          </mesh>
          <mesh ref={legR} geometry={A.leg} material={bakedMat(0.95, 0.35)} position={[-0.12, 0.2, 0]}>
            {fur && <FurShells id="leg" geometry={A.leg} base={bakedMat(0.95, 0.35)} layers={5} length={0.02} density={80} />}
          </mesh>
          {/* 胴 */}
          <mesh ref={torso} geometry={A.torso} material={A.fur} position-y={0.42} scale={[1, 1.1, 0.92]}>
            {fur && <FurShells id={'torso-' + variant} geometry={A.torso} base={A.fur} layers={8} length={0.03} density={150} />}
          </mesh>
          <mesh geometry={A.deco} material={bakedMat(0.8, 0.3)} />
          {/* 腕 */}
          <mesh ref={armL} geometry={A.arm} material={bakedMat(0.95, 0.35)} position={[0.27, 0.62, 0.02]}>
            {fur && <FurShells id="arm" geometry={A.arm} base={bakedMat(0.95, 0.35)} layers={5} length={0.02} density={80} />}
          </mesh>
          <mesh ref={armR} geometry={A.arm} material={bakedMat(0.95, 0.35)} position={[-0.27, 0.62, 0.02]}>
            {fur && <FurShells id="arm" geometry={A.arm} base={bakedMat(0.95, 0.35)} layers={5} length={0.02} density={80} />}
          </mesh>
          {/* しっぽ */}
          <group ref={tailRoot} position={[0, 0.24, -0.25]}>
            <TailChain n={6} a={A} refs={tail} />
          </group>
          {/* 頭 */}
          <group ref={head} position-y={0.74}>
            <mesh geometry={A.head} material={A.fur} position-y={0.27} scale={[1.14, 0.96, 1]}>
              {fur && <FurShells id={'head-' + variant} geometry={A.head} base={A.fur} layers={8} length={0.03} density={170} faceMask />}
            </mesh>
            <mesh geometry={A.face} material={bakedMat(0.95, 0.35)} />
            <mesh ref={mouthClosed} geometry={A.mouthClosed} material={unlitMat()} />
            <mesh ref={mouthOpen} geometry={A.mouthOpen} material={unlitMat()} position={[0, 0.125, 0.372]} visible={false} />
            {/* 目 */}
            <mesh ref={eyeL} geometry={A.eye} material={unlitMat()} position={[0.152, 0.262, 0.318]} rotation={[-0.06, 0.36, 0]} />
            <mesh ref={eyeR} geometry={A.eye} material={unlitMat()} position={[-0.152, 0.262, 0.318]} rotation={[-0.06, -0.36, 0]} />
            <mesh ref={happyL} geometry={A.happy} material={unlitMat()} position={[0.152, 0.245, 0.335]} rotation={[-0.06, 0.36, 0]} visible={false} />
            <mesh ref={happyR} geometry={A.happy} material={unlitMat()} position={[-0.152, 0.245, 0.335]} rotation={[-0.06, -0.36, 0]} visible={false} />
            {/* ほっぺ */}
            <mesh ref={blush} geometry={A.blush} material={blushMat} />
            {/* 耳 */}
            <mesh ref={earL} geometry={A.ear} material={bakedMat(0.95, 0.35)} position={[0.27, 0.47, 0.03]} rotation-z={-0.38} scale={1.12} />
            <mesh ref={earR} geometry={A.ear} material={bakedMat(0.95, 0.35)} position={[-0.27, 0.47, 0.03]} rotation-z={0.38} scale={1.12} />
            {/* あせ */}
            <mesh ref={sweat} geometry={sweatGeo} material={sweatMat} position={[0.38, 0.46, 0.14]} visible={false} scale={[1, 1.4, 1]} />
            {/* コック帽 */}
            {hat && (
              <group ref={hatG} position={[0.02, 0.6, -0.06]} rotation={[-0.14, 0, 0.1]} scale={0.84}>
                <mesh geometry={A.hat} material={bakedMat(0.8, 0.3)} />
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

function TailChain({ n, a, refs }: { n: number; a: Assets; refs: React.RefObject<(THREE.Group | null)[]> }) {
  // 入れ子のグループで しなる しっぽを作る
  const build = (i: number): React.ReactNode => {
    if (i >= n) return null;
    const r = 0.068 - i * 0.004;
    return (
      <group
        ref={(el) => {
          refs.current[i] = el;
        }}
        position-y={i === 0 ? 0 : 0.1}
      >
        <mesh geometry={a.tail} material={i % 2 ? a.stripe : a.plain} position-y={0.05} scale={[r, r * 1.25, r]} />
        {build(i + 1)}
      </group>
    );
  };
  return <>{build(0)}</>;
}
