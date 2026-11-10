import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fxAtlasTex } from './tex';

/**
 * 1つの Points で まとめて描く 軽いパーティクル。
 * fx.burst(...) で どこからでも 呼べる。
 * かたち（まる・ほし・ハート・わ）は 1まいの テクスチャに ならべてあり、ドローコールは 1回だけ。
 */
export type FxShape = 'soft' | 'star' | 'heart' | 'ring';
export interface BurstOpts {
  count?: number;
  color?: THREE.ColorRepresentation | THREE.ColorRepresentation[];
  speed?: number;
  spread?: number;
  gravity?: number;
  life?: number;
  size?: number;
  up?: number;
  dir?: THREE.Vector3Tuple;
  /** 旧指定（star: true） */
  star?: boolean;
  shape?: FxShape;
  /** 生まれる場所の ばらつき */
  radius?: number;
}

type BurstFn = (pos: THREE.Vector3 | THREE.Vector3Tuple, o: BurstOpts) => void;
const listeners = new Set<BurstFn>();
const SHAPE_ID: Record<FxShape, number> = { soft: 0, star: 1, heart: 2, ring: 3 };

export const fx = {
  burst(pos: THREE.Vector3 | THREE.Vector3Tuple, o: BurstOpts = {}) {
    listeners.forEach((l) => l(pos, o));
  },
  /** タップしたときの 小さな キラッ */
  pop(pos: THREE.Vector3 | THREE.Vector3Tuple, color: THREE.ColorRepresentation[] = ['#fff6c8', '#ffd34d', '#ffffff']) {
    fx.burst(pos, { shape: 'ring', count: 1, color: '#ffffff', speed: 0, gravity: 0, life: 0.45, size: 0.9 });
    fx.burst(pos, { shape: 'star', count: 7, color, speed: 1.8, gravity: 1.2, life: 0.7, size: 0.3 });
  },
  /** うれしい ハート */
  hearts(pos: THREE.Vector3 | THREE.Vector3Tuple, count = 6) {
    fx.burst(pos, { shape: 'heart', count, color: ['#ff7d96', '#ffb3c4', '#ff9fb4'], speed: 1.1, gravity: -0.9, life: 1.5, size: 0.42, spread: 0.6, radius: 0.25 });
  },
  /** できた！の おいわい */
  celebrate(pos: THREE.Vector3 | THREE.Vector3Tuple) {
    fx.burst(pos, { shape: 'star', count: 28, color: ['#ffd34d', '#ffffff', '#ff8fa3', '#7cc8f5', '#9be28a'], speed: 3.2, gravity: 2.2, life: 1.5, size: 0.42 });
    fx.burst(pos, { shape: 'ring', count: 1, color: '#fff2a8', speed: 0, gravity: 0, life: 0.7, size: 2.6 });
  },
};

const MAX = 700;

function PointPool() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    // x: おおきさ, y: とうめいど, z: かたち
    g.setAttribute('info', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: fxAtlasTex() }, scale: { value: 420 } },
        vertexShader: /* glsl */ `
          attribute vec3 info; attribute vec3 color;
          varying float vA; varying vec3 vC; varying float vS; uniform float scale;
          void main(){
            vA = info.y; vC = color; vS = info.z;
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            gl_PointSize = info.x * scale / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D map; varying float vA; varying vec3 vC; varying float vS;
          void main(){
            vec2 cell = vec2(mod(vS, 2.0), floor(vS / 2.0));
            vec2 uv = (clamp(gl_PointCoord, 0.02, 0.98) + cell) * 0.5;
            vec4 t = texture2D(map, vec2(uv.x, 1.0 - uv.y));
            gl_FragColor = vec4(mix(vC, vec3(1.0), t.r * 0.35), t.a * vA);
            if (gl_FragColor.a < 0.01) discard;
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  const state = useRef({
    vel: new Float32Array(MAX * 3),
    life: new Float32Array(MAX),
    max: new Float32Array(MAX),
    grav: new Float32Array(MAX),
    base: new Float32Array(MAX),
    next: 0,
    live: 0,
  });

  useEffect(() => {
    const c = new THREE.Color();
    const fn: BurstFn = (pos, o) => {
      const s = state.current;
      const p = Array.isArray(pos) ? pos : pos.toArray();
      const n = o.count ?? 16;
      const shape = SHAPE_ID[o.shape ?? (o.star ? 'star' : 'soft')];
      const colors = Array.isArray(o.color) ? o.color : [o.color ?? '#ffffff'];
      const P = geo.attributes.position.array as Float32Array;
      const C = geo.attributes.color.array as Float32Array;
      const I = geo.attributes.info.array as Float32Array;
      const rad = o.radius ?? 0;
      for (let k = 0; k < n; k++) {
        const i = s.next;
        s.next = (s.next + 1) % MAX;
        const sp = (o.speed ?? 2) * (0.4 + Math.random() * 0.6);
        const spread = o.spread ?? 1;
        let dx = (Math.random() - 0.5) * 2 * spread;
        let dy = Math.random() * (o.up ?? 1) + (1 - spread) * 0.2;
        let dz = (Math.random() - 0.5) * 2 * spread;
        if (o.dir) {
          dx += o.dir[0];
          dy += o.dir[1];
          dz += o.dir[2];
        }
        const len = Math.hypot(dx, dy, dz) || 1;
        s.vel[i * 3] = (dx / len) * sp;
        s.vel[i * 3 + 1] = (dy / len) * sp;
        s.vel[i * 3 + 2] = (dz / len) * sp;
        P[i * 3] = p[0] + (Math.random() - 0.5) * 2 * rad;
        P[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 2 * rad;
        P[i * 3 + 2] = p[2] + (Math.random() - 0.5) * 2 * rad;
        c.set(colors[k % colors.length]);
        C[i * 3] = c.r;
        C[i * 3 + 1] = c.g;
        C[i * 3 + 2] = c.b;
        const life = (o.life ?? 1) * (n === 1 ? 1 : 0.7 + Math.random() * 0.5);
        s.life[i] = life;
        s.max[i] = life;
        s.grav[i] = o.gravity ?? 3;
        s.base[i] = (o.size ?? 0.18) * (n === 1 ? 1 : 0.6 + Math.random() * 0.7);
        I[i * 3 + 2] = shape;
      }
      s.live = 2;
      geo.attributes.color.needsUpdate = true;
    };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [geo]);

  const pts = useRef<THREE.Points>(null);
  useFrame((_, dt0) => {
    const s = state.current;
    // なにも とんでいない ときは 描かない（ドローコール 0）
    if (pts.current) pts.current.visible = s.live > 0;
    if (s.live <= 0) return;
    const dt = Math.min(dt0, 0.05);
    const P = geo.attributes.position.array as Float32Array;
    const I = geo.attributes.info.array as Float32Array;
    let any = false;
    for (let i = 0; i < MAX; i++) {
      if (s.life[i] <= 0) {
        I[i * 3 + 1] = 0;
        continue;
      }
      any = true;
      s.life[i] -= dt;
      s.vel[i * 3 + 1] -= s.grav[i] * dt;
      s.vel[i * 3] *= 0.985;
      s.vel[i * 3 + 2] *= 0.985;
      P[i * 3] += s.vel[i * 3] * dt;
      P[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
      P[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
      const k = Math.max(0, s.life[i] / s.max[i]);
      const shape = I[i * 3 + 2];
      I[i * 3 + 1] = Math.min(1, k * 2.2);
      if (shape === 3) I[i * 3] = s.base[i] * (0.25 + (1 - k) * 0.95);
      else if (shape === 1) I[i * 3] = s.base[i] * (0.6 + 0.4 * Math.sin(k * 20));
      else if (shape === 2) I[i * 3] = s.base[i] * Math.min(1, (1 - k) * 6 + 0.3);
      else I[i * 3] = s.base[i] * (0.5 + k * 0.5);
    }
    s.live = any ? 2 : s.live - 1;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.info.needsUpdate = true;
  });

  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} renderOrder={10} visible={false} />;
}

/** 画面の どこを タップしても、小さな キラキラが でる（さわった 手ごたえ） */
function TapSparkle() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const el = gl.domElement;
    const v = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const onDown = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(camera);
      dir.copy(v).sub(camera.position).normalize();
      v.copy(camera.position).addScaledVector(dir, 3);
      fx.burst(v, { shape: 'star', count: 4, color: ['#ffffff', '#fff2a8'], speed: 0.5, gravity: 0.4, life: 0.45, size: 0.11 });
      fx.burst(v, { shape: 'ring', count: 1, color: '#ffffff', speed: 0, gravity: 0, life: 0.35, size: 0.28 });
    };
    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  }, [gl, camera]);
  return null;
}

export function Particles() {
  return (
    <>
      <PointPool />
      <TapSparkle />
    </>
  );
}
