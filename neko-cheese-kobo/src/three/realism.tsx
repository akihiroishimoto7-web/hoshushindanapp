import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { rng } from './tex';

/**
 * 質感を リアルにする しくみ（どの章にも 自動で かかる）
 *  1. 本物の影: 太陽・ランプの光から 影を 落とす（シャドウマップ 1枚だけ）
 *  2. 凹凸: 色の テクスチャから 法線マップを 自動で つくり、木目・石・チーズの皮・毛並みに 立体感を 出す
 * 重い端末では PerformanceMonitor から setShadows(false) で 影だけ 切る。
 */
let shadowsOn = true;
// 確認用: URL に ?shadows を つけると、重い端末でも 影を 切らない
const FORCE = typeof window !== 'undefined' && /[?&]shadows/.test(window.location.search);
export function setShadows(on: boolean) {
  shadowsOn = on || FORCE;
}

const normalCache = new WeakMap<THREE.Texture, THREE.Texture>();

function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const w = Math.min(256, src.width);
  const h = Math.min(256, src.height);
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tg = tmp.getContext('2d', { willReadFrequently: true })!;
  tg.drawImage(src, 0, 0, w, h);
  const px = tg.getImageData(0, 0, w, h).data;
  const H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) / 255;
  const out = tg.createImageData(w, h);
  const at = (x: number, y: number) => H[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      out.data[i] = (-dx / l) * 127 + 128;
      out.data[i + 1] = (dy / l) * 127 + 128;
      out.data[i + 2] = (1 / l) * 127 + 128;
      out.data[i + 3] = 255;
    }
  tg.putImageData(out, 0, 0);
  return tmp;
}

/** 色テクスチャから 法線マップを つくる（同じ テクスチャには 1回だけ） */
function normalFor(map: THREE.Texture): THREE.Texture | null {
  const hit = normalCache.get(map);
  if (hit) return hit;
  const img = map.image as HTMLCanvasElement | undefined;
  if (!img || typeof (img as HTMLCanvasElement).getContext !== 'function') return null;
  const t = new THREE.CanvasTexture(heightToNormal(img, 3));
  t.wrapS = map.wrapS;
  t.wrapT = map.wrapT;
  t.repeat.copy(map.repeat);
  t.offset.copy(map.offset);
  t.anisotropy = 4;
  normalCache.set(map, t);
  return t;
}

let fine: THREE.Texture | null = null;
/** こまかい ざらざら（毛並み・ぬの・ぬりかべ用） */
function fineNormal() {
  if (fine) return fine;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 128, 128);
  const r = rng(77);
  for (let i = 0; i < 2600; i++) {
    const v = Math.floor(r() * 255);
    g.strokeStyle = `rgba(${v},${v},${v},0.5)`;
    g.lineWidth = 1;
    const x = r() * 128;
    const y = r() * 128;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 3, y + 2 + r() * 5);
    g.stroke();
  }
  fine = new THREE.CanvasTexture(heightToNormal(c, 2.2));
  fine.wrapS = fine.wrapT = THREE.RepeatWrapping;
  fine.repeat.set(5, 5);
  return fine;
}

type Std = THREE.MeshStandardMaterial;
const LIT = new Set(['MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshLambertMaterial']);

function upgradeMaterial(m: THREE.Material) {
  if (m.userData.rz) return;
  m.userData.rz = true;
  if (m.type !== 'MeshStandardMaterial' && m.type !== 'MeshPhysicalMaterial') return;
  const s = m as Std;
  if (s.normalMap || s.transparent || s.metalness > 0.5) return;
  if (s.map) {
    const n = normalFor(s.map);
    if (n) {
      s.normalMap = n;
      s.normalScale.set(0.55, 0.55);
      s.needsUpdate = true;
    }
  } else if (s.vertexColors || s.roughness >= 0.7) {
    s.normalMap = fineNormal();
    s.normalScale.set(0.3, 0.3);
    s.needsUpdate = true;
  }
}

export function Realism() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const acc = useRef(1);
  const was = useRef(true);
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  // 映りこみは ひかえめに（明るく なりすぎて 色が とぶのを ふせぐ）
  useFrame(() => {
    if (scene.environmentIntensity !== 0.16) scene.environmentIntensity = 0.16;
  });
  useFrame((_, dt) => {
    if (was.current !== shadowsOn) {
      was.current = shadowsOn;
      gl.shadowMap.enabled = shadowsOn;
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => (m.needsUpdate = true));
      });
    }
    // あとから 出てきた ものにも かかるように、ときどき 見まわる
    acc.current += dt;
    if (acc.current < 0.6) return;
    acc.current = 0;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.rz) return;
      mesh.userData.rz = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const m0 = mats[0];
      if (!m0) return;
      mats.forEach(upgradeMaterial);
      const lit = LIT.has(m0.type);
      const inst = (mesh as unknown as THREE.InstancedMesh).isInstancedMesh ? (mesh as unknown as THREE.InstancedMesh).count : 0;
      mesh.receiveShadow = lit && !m0.transparent;
      // 影を うける 設定は シェーダーの 作りなおしが いる
      if (mesh.receiveShadow) mats.forEach((m) => (m.needsUpdate = true));
      mesh.castShadow = lit && !m0.transparent && mesh.name !== 'ground' && inst < 200 && m0.side !== THREE.BackSide && !mesh.userData.noShadow;
    });
  });
  return null;
}

/** 影を 落とす 主役の光。follow を わたすと その あとを ついていく（牧場の 女の子など） */
export function SunShadow({
  position,
  intensity = 2.5,
  color = '#fff1d6',
  range = 10,
  focus = [0, 0, 0],
  follow,
}: {
  position: THREE.Vector3Tuple;
  intensity?: number;
  color?: string;
  range?: number;
  focus?: THREE.Vector3Tuple;
  follow?: React.RefObject<THREE.Object3D | null>;
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const size = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600 ? 1024 : 2048;
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(...focus);
    l.target.updateMatrixWorld();
    const c = l.shadow.camera;
    c.left = c.bottom = -range;
    c.right = c.top = range;
    c.near = 0.5;
    c.far = 60;
    c.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);
  useFrame(() => {
    const l = light.current;
    if (!l || !follow?.current) return;
    const p = follow.current.position;
    l.position.set(p.x + position[0], position[1], p.z + position[2]);
    l.target.position.set(p.x, 0, p.z);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight
      ref={light}
      position={[focus[0] + position[0], position[1], focus[2] + position[2]]}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize={[size, size]}
      shadow-bias={-0.0006}
      shadow-normalBias={0.035}
      shadow-radius={3}
    />
  );
}

/** 床と 壁の さかいめの やわらかい かげ（部屋の 角を 立体的に 見せる） */
let aoTex: THREE.Texture | null = null;
function aoStrip() {
  if (aoTex) return aoTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)');
  gr.addColorStop(0.35, 'rgba(0,0,0,0.25)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 64);
  aoTex = new THREE.CanvasTexture(c);
  return aoTex;
}

export function RoomAO({ width, depth, back, size = 1.4, sides = true, front }: { width: number; depth: number; back: number; size?: number; sides?: boolean; front?: number }) {
  const mat = useRef(
    new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: aoStrip(), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  ).current;
  const fz = front ?? back + depth;
  const strips: { pos: THREE.Vector3Tuple; rot: THREE.Vector3Tuple; w: number; h: number }[] = [
    // 床に たおれる かげ
    { pos: [0, 0.012, back + size / 2], rot: [-Math.PI / 2, 0, Math.PI], w: width, h: size },
    // 壁の 下の かげ
    { pos: [0, size / 2, back + 0.01], rot: [0, 0, Math.PI], w: width, h: size },
  ];
  if (sides)
    [-1, 1].forEach((sx) => {
      strips.push({ pos: [sx * (width / 2 - size / 2), 0.012, (back + fz) / 2], rot: [-Math.PI / 2, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2], w: fz - back, h: size });
      strips.push({ pos: [sx * (width / 2 - 0.01), size / 2, (back + fz) / 2], rot: [0, -sx * Math.PI / 2, Math.PI], w: fz - back, h: size });
    });
  return (
    <group>
      {strips.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} material={mat} userData={{ rz: true }} renderOrder={1}>
          <planeGeometry args={[s.w, s.h]} />
        </mesh>
      ))}
    </group>
  );
}
