import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { radialTex, sparkTex } from './tex';

/**
 * 1つの Points で まとめて描く 軽いパーティクル。
 * fx.burst(...) で どこからでも 呼べる。
 */
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
  star?: boolean;
}

type BurstFn = (pos: THREE.Vector3 | THREE.Vector3Tuple, o: BurstOpts) => void;
const listeners = new Set<BurstFn>();
export const fx = {
  burst(pos: THREE.Vector3 | THREE.Vector3Tuple, o: BurstOpts = {}) {
    listeners.forEach((l) => l(pos, o));
  },
};

const MAX = 600;

function PointPool({ star }: { star: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(MAX), 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: star ? sparkTex() : radialTex() }, scale: { value: 420 } },
        vertexShader: /* glsl */ `
          attribute float size; attribute float alpha; attribute vec3 color;
          varying float vA; varying vec3 vC; uniform float scale;
          void main(){
            vA = alpha; vC = color;
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            gl_PointSize = size * scale / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D map; varying float vA; varying vec3 vC;
          void main(){
            vec4 t = texture2D(map, gl_PointCoord);
            gl_FragColor = vec4(vC, t.a * vA);
            if (gl_FragColor.a < 0.01) discard;
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [star],
  );
  const state = useRef({
    vel: new Float32Array(MAX * 3),
    life: new Float32Array(MAX),
    max: new Float32Array(MAX),
    grav: new Float32Array(MAX),
    base: new Float32Array(MAX),
    next: 0,
  });

  useEffect(() => {
    const c = new THREE.Color();
    const fn: BurstFn = (pos, o) => {
      if (Boolean(o.star) !== star) return;
      const s = state.current;
      const p = Array.isArray(pos) ? pos : pos.toArray();
      const n = o.count ?? 16;
      const colors = Array.isArray(o.color) ? o.color : [o.color ?? '#ffffff'];
      const P = geo.attributes.position.array as Float32Array;
      const C = geo.attributes.color.array as Float32Array;
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
        P[i * 3] = p[0];
        P[i * 3 + 1] = p[1];
        P[i * 3 + 2] = p[2];
        c.set(colors[k % colors.length]);
        C[i * 3] = c.r;
        C[i * 3 + 1] = c.g;
        C[i * 3 + 2] = c.b;
        const life = (o.life ?? 1) * (0.7 + Math.random() * 0.5);
        s.life[i] = life;
        s.max[i] = life;
        s.grav[i] = o.gravity ?? 3;
        s.base[i] = (o.size ?? 0.18) * (0.6 + Math.random() * 0.7);
      }
      geo.attributes.color.needsUpdate = true;
    };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [geo, star]);

  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const s = state.current;
    const P = geo.attributes.position.array as Float32Array;
    const S = geo.attributes.size.array as Float32Array;
    const A = geo.attributes.alpha.array as Float32Array;
    let any = false;
    for (let i = 0; i < MAX; i++) {
      if (s.life[i] <= 0) {
        if (A[i] !== 0) {
          A[i] = 0;
          any = true;
        }
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
      A[i] = Math.min(1, k * 2);
      S[i] = s.base[i] * (star ? 0.6 + 0.4 * Math.sin(k * 20) : 0.5 + k * 0.5);
    }
    if (any) {
      geo.attributes.position.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;
      geo.attributes.alpha.needsUpdate = true;
    }
  });

  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={10} />;
}

export function Particles() {
  return (
    <>
      <PointPool star={false} />
      <PointPool star />
    </>
  );
}
