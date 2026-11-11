import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rng } from './tex';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * 自然の リアルな 表現（草原・雲・木）。
 * どれも インスタンス描画か スプライトで、ドローコールは 1〜2回ずつ。
 */

// ---------- 草原: 1本ずつの 草の葉が 風に ゆれる ----------
function bladeGeometry() {
  // 根もとが太く 先が細い、3段の 葉
  const g = new THREE.BufferGeometry();
  const w = 0.045;
  const pos = [-w, 0, 0, w, 0, 0, -w * 0.75, 0.35, 0, w * 0.75, 0.35, 0, -w * 0.45, 0.7, 0, w * 0.45, 0.7, 0, 0, 1, 0];
  const idx = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
  const hgt = [0, 0, 0.35, 0.35, 0.7, 0.7, 1];
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('h', new THREE.Float32BufferAttribute(hgt, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(7).fill([0, 0.75, 0.66]).flat(), 3));
  g.setIndex(idx);
  return g;
}

export function GrassField({
  count = 7000,
  radius = 26,
  height,
  avoid = [],
  keepOut,
  seed = 3,
}: {
  count?: number;
  radius?: number;
  height: (x: number, z: number) => number;
  avoid?: [number, number, number][];
  /** 道など、草を はやさない 場所なら true */
  keepOut?: (x: number, z: number) => boolean;
  seed?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const small = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
  const n = Math.round(count * (small ? 0.8 : 1));
  const geo = useMemo(bladeGeometry, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float h;\nuniform float uTime;\nvarying float vH;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vH = h;
           #ifdef USE_INSTANCING
             vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
             float ph = ip.x * 0.35 + ip.z * 0.27;
             float gust = sin(uTime * 1.3 + ph) * 0.5 + sin(uTime * 2.7 + ph * 1.9) * 0.25 + sin(uTime * 0.45 + ip.x * 0.08) * 0.6;
             transformed.x += gust * 0.16 * h * h;
             transformed.z += cos(uTime * 1.1 + ph) * 0.08 * h * h;
             transformed.y -= abs(gust) * 0.05 * h * h;
           #endif`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vH;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           // 根もとは 暗く、先は 日に すけて 明るい
           diffuseColor.rgb *= mix(0.55, 1.18, vH);
           diffuseColor.rgb += vec3(0.10, 0.12, 0.0) * vH * vH;`,
        );
    };
    return m;
  }, []);
  const uTime = useMemo(() => ({ value: 0 }), []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(seed);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    let i = 0;
    let guard = 0;
    while (i < n && guard++ < n * 4) {
      const a = r() * Math.PI * 2;
      // 手前（まんなか）ほど こく
      const d = Math.pow(r(), 0.7) * radius;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar * 0.55)) continue;
      if (keepOut?.(x, z)) continue;
      // かたまって はえる（まばらな ところと こい ところ）
      const patch = Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31);
      if (patch < -0.9 && r() < 0.7) continue;
      o.position.set(x, height(x, z), z);
      o.rotation.set((r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.5);
      const s = 0.16 + r() * 0.22 + Math.max(0, patch) * 0.08;
      o.scale.set(0.7 + r() * 0.6, s, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.setHSL(0.23 + r() * 0.07 + patch * 0.01, 0.5 + r() * 0.2, 0.36 + r() * 0.14);
      m.setColorAt(i, c);
      i++;
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, radius, seed]);
  useFrame((st) => {
    uTime.value = st.clock.elapsedTime;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} userData={{ noShadow: true }} />;
}

// ---------- 地面の こまかい 模様 ----------
let groundTex: THREE.Texture | null = null;
export function groundDetailTex() {
  if (groundTex) return groundTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c9c9c9';
  g.fillRect(0, 0, 256, 256);
  const r = rng(91);
  for (let i = 0; i < 5200; i++) {
    const v = 150 + Math.floor(r() * 105);
    g.strokeStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.4})`;
    g.lineWidth = 1 + r();
    const x = r() * 256;
    const y = r() * 256;
    const a = r() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * (3 + r() * 6), y + Math.sin(a) * (3 + r() * 6));
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(90,90,90,${r() * 0.18})`;
    g.beginPath();
    g.arc(r() * 256, r() * 256, 6 + r() * 22, 0, Math.PI * 2);
    g.fill();
  }
  groundTex = new THREE.CanvasTexture(c);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(46, 46);
  groundTex.anisotropy = 4;
  return groundTex;
}

// ---------- 雲: やわらかい もこもこの スプライト ----------
let cloudTexs: THREE.Texture[] | null = null;
function cloudTextures() {
  if (cloudTexs) return cloudTexs;
  cloudTexs = [11, 23, 37].map((seed) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d')!;
    const r = rng(seed);
    // たくさんの ぼけた 丸を かさねて、底が 平らで 上が もこもこの 雲に
    for (let i = 0; i < 46; i++) {
      const x = 40 + r() * 176;
      const t = 1 - Math.abs(x - 128) / 110;
      const y = 86 - r() * 52 * Math.max(0.15, t);
      const rad = 14 + r() * 26 * Math.max(0.3, t);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(0.6, 'rgba(255,255,255,0.22)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // 底の かげ
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, 40, 0, 110);
    sh.addColorStop(0, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(150,170,205,0.55)');
    g.fillStyle = sh;
    g.fillRect(0, 0, 256, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  return cloudTexs;
}

export function SoftClouds({ count = 14, tint = '#fff6ea' }: { count?: number; tint?: string }) {
  const g = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    const r = rng(5);
    const texs = cloudTextures();
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.4;
      const d = 62 + r() * 40;
      const s = 22 + r() * 26;
      return {
        pos: [Math.cos(a) * d, 16 + r() * 22, Math.sin(a) * d] as THREE.Vector3Tuple,
        scale: [s, s * 0.5, 1] as THREE.Vector3Tuple,
        mat: new THREE.SpriteMaterial({ map: texs[i % texs.length], color: tint, transparent: true, opacity: 0.82 + r() * 0.15, depthWrite: false, fog: false }),
      };
    });
  }, [count, tint]);
  useEffect(() => () => items.forEach((i) => i.mat.dispose()), [items]);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.004;
  });
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <sprite key={i} position={it.pos} scale={it.scale} material={it.mat} renderOrder={-5} />
      ))}
    </group>
  );
}

// ---------- 木: でこぼこの 葉のかたまり と 木の はだ ----------
function foliageGeometry() {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 2));
  const p = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // こまかい でこぼこ（葉の むれ）
    const n =
      Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7 + v.x * 2.1) * 0.13 + Math.sin(v.x * 11 + v.z * 9) * Math.sin(v.y * 10) * 0.06;
    v.multiplyScalar(1 + n);
    p.setXYZ(i, v.x, v.y * 0.88, v.z);
    // 下と くぼみは 暗く、上は 日が あたって 明るい
    const k = THREE.MathUtils.clamp(0.52 + v.y * 0.36 + n * 1.6, 0.3, 1.12);
    col.set([k, k, k], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function RealTrees({ spots, height }: { spots: [number, number, number][]; height: (x: number, z: number) => number }) {
  const leaves = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(foliageGeometry, []);
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.13, 0.3, 2.2, 9, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const k = 1 + Math.sin(a * 3 + y * 2) * 0.08 + (y < -0.9 ? 0.25 : 0);
      p.setX(i, p.getX(i) * k + Math.sin(y * 1.3) * 0.05);
      p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      trunkGeo.dispose();
    },
    [geo, trunkGeo],
  );
  const per = 6;
  useLayoutEffect(() => {
    const r = rng(9);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    spots.forEach(([x, z, s], t) => {
      const y = height(x, z);
      o.position.set(x, y + 1.05 * s, z);
      o.rotation.set(0, r() * 6, (r() - 0.5) * 0.12);
      o.scale.setScalar(s);
      o.updateMatrix();
      trunks.current?.setMatrixAt(t, o.matrix);
      const hue = 0.25 + r() * 0.07;
      for (let k = 0; k < per; k++) {
        const top = k === 0;
        const a = (k / (per - 1)) * Math.PI * 2 + r();
        const rad = top ? 0 : (0.55 + r() * 0.35) * s;
        o.position.set(x + Math.cos(a) * rad, y + (top ? 3.25 : 2.3 + r() * 0.75) * s, z + Math.sin(a) * rad);
        o.rotation.set(r() * 6, r() * 6, r() * 6);
        o.scale.setScalar((top ? 1.0 : 0.72 + r() * 0.32) * s);
        o.updateMatrix();
        leaves.current?.setMatrixAt(t * per + k, o.matrix);
        c.setHSL(hue + (r() - 0.5) * 0.03, 0.52 + r() * 0.12, 0.4 + r() * 0.1);
        leaves.current?.setColorAt(t * per + k, c);
      }
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true;
      if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;
    }
  }, [spots, height]);
  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeo, undefined, spots.length]} frustumCulled={false}>
        <meshStandardMaterial color="#7a5234" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[geo, undefined, spots.length * per]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
