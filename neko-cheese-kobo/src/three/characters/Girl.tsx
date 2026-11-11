import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { fabricTex, hairTex } from '../tex';
import { BlobShadow } from '../common';
import { bake, G, type Part } from '../bake';
import { bakedMat, unlitMat, withRim } from '../look';

/**
 * 主人公の女の子（プレイヤー）。チーズ色のワンピースに、赤いリボンの ふたつむすび。
 * パーツは 頂点カラーで まとめて 10 ドローコールほど。
 */
const SKIN = '#ffdcc6';
const HAIR = '#7a4526';
const HAIR2 = '#8f5530';
const DRESS = '#ffd24a';
const RED = '#ef4e5e';

let cheerFlag = 0;
/** 「やったー！」と とびはねる（シーンから呼ぶ） */
export function girlCheer() {
  cheerFlag++;
}

interface Assets {
  leg: THREE.BufferGeometry;
  arm: THREE.BufferGeometry;
  body: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  hair: THREE.BufferGeometry;
  tails: THREE.BufferGeometry;
  eyes: THREE.BufferGeometry;
  happy: THREE.BufferGeometry;
  blush: THREE.BufferGeometry;
}
let assets: Assets | null = null;
let _hair: THREE.MeshPhysicalMaterial | null = null;
/** かみの毛: すじの もようと、つやの わ（エンジェルリング） */
function hairMat(): THREE.MeshPhysicalMaterial {
  if (!_hair)
    _hair = withRim(
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        map: hairTex(),
        roughness: 0.42,
        sheen: 0.6,
        sheenColor: new THREE.Color('#ffd9b0'),
        sheenRoughness: 0.4,
        anisotropy: 0.8,
        anisotropyRotation: Math.PI / 2,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
      }),
      '#ffe9c8',
      0.3,
    );
  return _hair!;
}
let _dress: THREE.MeshPhysicalMaterial | null = null;
/** ワンピース: ぬのの 織り目と、ふんわりした つや（シーン） */
function dressMat(): THREE.MeshPhysicalMaterial {
  if (!_dress)
    _dress = withRim(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, map: fabricTex(), roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#fff4d0'), sheenRoughness: 0.5 }),
      '#fff1d8',
      0.3,
    );
  return _dress!;
}
const blushMat = new THREE.MeshBasicMaterial({ color: '#ff7d96', transparent: true, opacity: 0.5, depthWrite: false });

function build(): Assets {
  const leg = bake([
    { geo: G.capsule(0.055, 0.2, 8), color: SKIN, pos: [0, -0.14, 0] },
    { geo: G.cyl(0.062, 0.058, 0.1, 10), color: '#ffffff', pos: [0, -0.21, 0] },
    { geo: G.sphere(0.078, 12, 8), color: '#d8414f', pos: [0, -0.29, 0.03], scale: [1, 0.65, 1.45] },
  ]);
  const arm = bake([
    { geo: G.sphere(0.075, 10, 8), color: '#fff6dc', pos: [0, -0.02, 0], scale: [1, 0.9, 1] },
    { geo: G.capsule(0.043, 0.19, 8), color: SKIN, pos: [0, -0.16, 0] },
    { geo: G.sphere(0.052, 10, 8), color: SKIN, pos: [0, -0.3, 0] },
  ]);
  const pts = [
    [0.0, 0.0],
    [0.36, 0.0],
    [0.37, 0.03],
    [0.31, 0.14],
    [0.2, 0.38],
    [0.16, 0.5],
    [0.15, 0.58],
    [0.0, 0.6],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body: Part[] = [
    { geo: new THREE.LatheGeometry(pts, 24), color: DRESS, pos: [0, 0.24, 0] },
    // すその しろい ライン
    { geo: G.torus(0.355, 0.02, 6, 28), color: '#fff6dc', pos: [0, 0.265, 0], rot: [Math.PI / 2, 0, 0] },
    { geo: G.torus(0.13, 0.042, 8, 18), color: '#ffffff', pos: [0, 0.82, 0], rot: [Math.PI / 2, 0, 0] },
    // むねの リボン
    { geo: G.sphere(0.04, 8, 6), color: RED, pos: [-0.04, 0.775, 0.14], scale: [1.3, 0.8, 0.5] },
    { geo: G.sphere(0.04, 8, 6), color: RED, pos: [0.04, 0.775, 0.14], scale: [1.3, 0.8, 0.5] },
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const y = 0.34 + (i % 2) * 0.14;
    const r = 0.305 - (i % 2) * 0.07;
    body.push({ geo: G.sphere(0.028, 8, 6), color: '#ffffff', pos: [Math.sin(a) * r, y, Math.cos(a) * r] });
  }
  const head: Part[] = [
    { geo: G.sphere(0.28, 28, 22), color: SKIN, pos: [0, 0.25, 0], scale: [1.04, 0.97, 1] },
    // かみ（あたまの うえ と うしろ）
    // はな と くち
    { geo: G.sphere(0.012, 6, 5), color: '#f5b9a0', pos: [0, 0.2, 0.283] },
    // みみ
    { geo: G.sphere(0.045, 8, 6), color: SKIN, pos: [-0.285, 0.22, 0.0], scale: [0.6, 1, 0.8] },
    { geo: G.sphere(0.045, 8, 6), color: SKIN, pos: [0.285, 0.22, 0.0], scale: [0.6, 1, 0.8] },
    // あほげ
  ];
  const hair: Part[] = [
    { geo: new THREE.SphereGeometry(0.295, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.46), color: HAIR, pos: [0, 0.27, -0.03], rot: [-0.32, 0, 0], scale: [1.06, 1, 1.05] },
    { geo: new THREE.SphereGeometry(0.29, 20, 16, Math.PI * 1.0, Math.PI * 1.0, 0, Math.PI * 0.82), color: HAIR, pos: [0, 0.25, -0.03], scale: [1.07, 1.08, 1.03] },
    { geo: G.cone(0.03, 0.12, 6), color: HAIR2, pos: [0.02, 0.6, 0], rot: [0, 0, -0.5] },
  ];
  // まえがみ（ぱっつん ぎみに ならべる）
  [-0.2, -0.1, 0, 0.1, 0.2].forEach((x, i) => {
    hair.push({ geo: G.sphere(0.085, 10, 8), color: i % 2 ? HAIR2 : HAIR, pos: [x, 0.445 - Math.abs(x) * 0.2, 0.2 - Math.abs(x) * 0.3], scale: [0.85, 0.6, 0.55] });
  });
  const tails: Part[] = [];
  [-1, 1].forEach((sx) => {
    tails.push(
      { geo: G.sphere(0.11, 12, 10), color: HAIR, pos: [sx * 0.37, 0.2, -0.05], scale: [0.8, 1.35, 0.8], rot: [0, 0, sx * 0.25] },
      { geo: G.sphere(0.07, 10, 8), color: HAIR2, pos: [sx * 0.4, 0.06, -0.05], scale: [0.8, 1.1, 0.8] },
      { geo: G.sphere(0.055, 8, 6), color: RED, pos: [sx * 0.3, 0.35, -0.02], scale: [1.3, 0.8, 0.6], rot: [0, 0, sx * 0.6] },
      { geo: G.sphere(0.055, 8, 6), color: RED, pos: [sx * 0.33, 0.3, -0.02], scale: [0.8, 1.3, 0.6], rot: [0, 0, sx * 0.6] },
      { geo: G.sphere(0.03, 8, 6), color: '#ff8fa3', pos: [sx * 0.31, 0.325, 0.02] },
    );
  });
  const eyes: Part[] = [];
  const happy: Part[] = [];
  [-1, 1].forEach((sx) => {
    const x = sx * 0.105;
    const ry = sx * 0.33;
    eyes.push(
      { geo: G.sphere(1, 16, 12), color: '#3a2012', pos: [x, 0, 0], rot: [0, ry, 0], scale: [0.052, 0.072, 0.025] },
      { geo: G.sphere(1, 12, 10), color: '#8a5230', pos: [x, -0.02, 0.012], rot: [0, ry, 0], scale: [0.038, 0.04, 0.02] },
      { geo: G.sphere(1, 10, 8), color: '#ffffff', pos: [x + 0.016, 0.028, 0.026], scale: [0.02, 0.022, 0.01] },
      { geo: G.sphere(1, 8, 6), color: '#ffffff', pos: [x - 0.018, -0.02, 0.026], scale: [0.009, 0.01, 0.006] },
      // まつげ・まゆ
      { geo: G.box(0.04, 0.008, 0.008), color: '#3a2012', pos: [x + sx * 0.05, 0.05, 0.0], rot: [0, ry, sx * 0.5] },
      { geo: G.box(0.07, 0.01, 0.008), color: '#6a3c20', pos: [x, 0.125, 0.008], rot: [0, ry, -sx * 0.12] },
      // くち（にっこり）
    );
    happy.push(
      { geo: G.torus(0.04, 0.013, 6, 12, Math.PI), color: '#3a2012', pos: [x, -0.012, 0.012], rot: [0, ry, 0], scale: [1, 1, 0.6] },
      { geo: G.box(0.07, 0.01, 0.008), color: '#6a3c20', pos: [x, 0.125, 0.008], rot: [0, ry, -sx * 0.25] },
    );
  });
  eyes.push({ geo: G.torus(0.04, 0.011, 6, 12, Math.PI), color: '#c94b55', pos: [0, -0.1, 0.0], rot: [0, 0, Math.PI] });
  happy.push(
    { geo: G.sphere(0.045, 12, 10), color: '#b93a48', pos: [0, -0.115, -0.005], scale: [1, 0.8, 0.3] },
    { geo: G.sphere(0.028, 8, 6), color: '#ff8fa3', pos: [0, -0.135, 0.005], scale: [1, 0.5, 0.3] },
  );
  const blush = bake([
    { geo: G.sphere(0.05, 10, 8), pos: [-0.18, 0.155, 0.215], rot: [0, -0.6, 0], scale: [1, 0.62, 0.2] },
    { geo: G.sphere(0.05, 10, 8), pos: [0.18, 0.155, 0.215], rot: [0, 0.6, 0], scale: [1, 0.62, 0.2] },
  ]);
  return { leg, arm, body: bake(body), head: bake(head), hair: bake(hair), tails: bake(tails), eyes: bake(eyes), happy: bake(happy), blush };
}

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
  if (!assets) assets = build();
  const A = assets;
  const own = useRef<THREE.Group>(null);
  const root = groupRef ?? own;
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Mesh>(null);
  const happy = useRef<THREE.Mesh>(null);
  const tails = useRef<THREE.Mesh>(null);
  const st = useRef({ last: new THREE.Vector3(), speed: 0, phase: 0, blinkAt: 1.5, cheerN: cheerFlag, cheerT: -10 });
  const v = useMemo(() => new THREE.Vector3(), []);

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
    if (s.cheerN !== cheerFlag) {
      s.cheerN = cheerFlag;
      s.cheerT = t;
    }
    const ck = (t - s.cheerT) / 1.2;
    const cheering = ck >= 0 && ck < 1;
    const hop = cheering ? Math.abs(Math.sin(ck * Math.PI * 2)) : 0;
    const walking = s.speed > 0.25;
    s.phase += dt * (walking ? 11 : 0);
    const sw = walking ? Math.sin(s.phase) : 0;
    if (body.current) {
      body.current.position.y = hop * 0.28 + (walking ? Math.abs(Math.sin(s.phase)) * 0.05 : Math.sin(t * 2) * 0.008);
      const sq = cheering ? (hop - 0.5) * 0.1 : 0;
      body.current.scale.set(1 - sq * 0.5, 1 + sq, 1 - sq * 0.5);
      body.current.rotation.z = walking ? Math.sin(s.phase) * 0.04 : 0;
    }
    if (legL.current) legL.current.rotation.x = sw * 0.6;
    if (legR.current) legR.current.rotation.x = -sw * 0.6;
    const lerp = THREE.MathUtils.lerp;
    if (armL.current) {
      armL.current.rotation.x = lerp(armL.current.rotation.x, carry ? -1.1 : cheering ? 0 : -sw * 0.5, 0.3);
      armL.current.rotation.z = lerp(armL.current.rotation.z, carry ? -0.15 : cheering ? 2.5 : 0.2, 0.3);
    }
    if (armR.current) {
      armR.current.rotation.x = lerp(armR.current.rotation.x, carry ? -1.1 : cheering ? 0 : sw * 0.5, 0.3);
      armR.current.rotation.z = lerp(armR.current.rotation.z, carry ? 0.15 : cheering ? -2.5 : -0.2, 0.3);
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.8) * 0.04;
      head.current.rotation.x = cheering ? -0.15 : 0;
    }
    if (tails.current) {
      tails.current.rotation.x = walking ? Math.sin(s.phase * 2) * 0.12 : Math.sin(t * 1.5) * 0.04;
      tails.current.position.y = -hop * 0.05;
    }
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.13;
      blink = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2.5 + Math.random() * 3;
    }
    if (eyes.current) {
      eyes.current.visible = !cheering;
      eyes.current.scale.y = blink;
    }
    if (happy.current) happy.current.visible = cheering;
  });

  return (
    <group ref={root} position={position} rotation-y={rotationY} dispose={null}>
      <BlobShadow size={0.9} />
      <group ref={body}>
        <mesh ref={legL} geometry={A.leg} material={bakedMat(0.75, 0.3)} position={[0.09, 0.32, 0]} />
        <mesh ref={legR} geometry={A.leg} material={bakedMat(0.75, 0.3)} position={[-0.09, 0.32, 0]} />
        <mesh geometry={A.body} material={dressMat()} />
        <mesh ref={armL} geometry={A.arm} material={bakedMat(0.75, 0.3)} position={[0.2, 0.78, 0]} rotation-z={0.2} />
        <mesh ref={armR} geometry={A.arm} material={bakedMat(0.75, 0.3)} position={[-0.2, 0.78, 0]} rotation-z={-0.2} />
        {carry && holding && <group position={[0, 0.55, 0.36]}>{holding}</group>}
        <group ref={head} position-y={0.86}>
          <mesh geometry={A.head} material={bakedMat(0.75, 0.3)} />
          <mesh geometry={A.hair} material={hairMat()} />
          <mesh ref={tails} geometry={A.tails} material={hairMat()} />
          <mesh ref={eyes} geometry={A.eyes} material={unlitMat()} position={[0, 0.235, 0.262]} />
          <mesh ref={happy} geometry={A.happy} material={unlitMat()} position={[0, 0.235, 0.262]} visible={false} />
          <mesh geometry={A.blush} material={blushMat} />
        </group>
      </group>
    </group>
  );
}
