import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { radialTex, raysTex, SKY } from './tex';
import { targetWorldPos } from './targets';
import { useDialog } from '../game/dialog';
import { fx } from './fx';

/** まるい ぼかし影（本物の影より ずっと軽い） */
const shadowMat = new THREE.MeshBasicMaterial({
  color: '#3b2a10',
  transparent: true,
  opacity: 0.13,
  depthWrite: false,
});
let shadowMapSet = false;
const shadowGeo = new THREE.PlaneGeometry(1, 1);
export function BlobShadow({ size = 1, opacity = 0.28, y = 0.01 }: { size?: number; opacity?: number; y?: number }) {
  if (!shadowMapSet) {
    shadowMat.alphaMap = radialTex();
    shadowMat.needsUpdate = true;
    shadowMapSet = true;
  }
  const mat = useMemo(() => {
    if (opacity === 0.28) return shadowMat;
    const m = shadowMat.clone();
    m.opacity = opacity * 0.45;
    return m;
  }, [opacity]);
  return (
    <mesh geometry={shadowGeo} material={mat} rotation-x={-Math.PI / 2} position-y={y} scale={[size, size, 1]} renderOrder={1} dispose={null} />
  );
}

/** グラデーションの空（たいようの まぶしさ つき） */
export function SkyDome({
  top = SKY.top,
  mid = SKY.mid,
  bottom = SKY.bottom,
  radius = 140,
  sun = [0.45, 0.5, -0.74],
  sunColor = '#fff6d0',
}: {
  top?: THREE.Color;
  mid?: THREE.Color;
  bottom?: THREE.Color;
  radius?: number;
  sun?: THREE.Vector3Tuple;
  sunColor?: string;
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: top },
          mid: { value: mid },
          bottom: { value: bottom },
          sunDir: { value: new THREE.Vector3(...sun).normalize() },
          sunColor: { value: new THREE.Color(sunColor) },
        },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: /* glsl */ `
          uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vP;
          void main(){
            vec3 d = normalize(vP);
            float h = d.y;
            vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.75, h)) : mix(bottom, mid, smoothstep(-0.05, 0.12, h));
            float s = max(0.0, dot(d, sunDir));
            c += sunColor * (pow(s, 600.0) * 1.2 + pow(s, 40.0) * 0.35 + pow(s, 6.0) * 0.16);
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [top, mid, bottom, sunColor],
  );
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 24, 12]} />
    </mesh>
  );
}

/** ランプや まどの ふんわりした 光（加算スプライト。ポストプロセスなしの「にじみ」） */
const glowMats = new Map<string, THREE.SpriteMaterial>();
export function Glow({ color = '#ffe2a8', size = 1, opacity = 0.6, position, pulse = 0 }: { color?: string; size?: number; opacity?: number; position?: THREE.Vector3Tuple; pulse?: number }) {
  const key = color + opacity;
  let m = glowMats.get(key);
  if (!m) {
    m = new THREE.SpriteMaterial({ map: radialTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    glowMats.set(key, m);
  }
  const ref = useRef<THREE.Sprite>(null);
  useFrame((st) => {
    if (pulse && ref.current) ref.current.scale.setScalar(size * (1 + Math.sin(st.clock.elapsedTime * 2.3 + (position?.[0] ?? 0)) * pulse));
  });
  return <sprite ref={ref} material={m} position={position} scale={size} dispose={null} />;
}

/** くうきの なかを ただよう つぶ（かふん・ほこり・ひかりの こな）。1ドローコール */
export function Motes({
  count = 60,
  area = [10, 5, 10],
  center = [0, 2.5, 0],
  color = '#fff6c8',
  size = 0.09,
  opacity = 0.75,
  speed = 1,
}: {
  count?: number;
  area?: THREE.Vector3Tuple;
  center?: THREE.Vector3Tuple;
  color?: string;
  size?: number;
  opacity?: number;
  speed?: number;
}) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p.set([(Math.random() - 0.5) * area[0], (Math.random() - 0.5) * area[1], (Math.random() - 0.5) * area[2]], i * 3);
      s[i] = Math.random() * 10;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(s, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: radialTex() }, time: { value: 0 }, color: { value: new THREE.Color(color) }, size: { value: size * 420 }, opacity: { value: opacity } },
        vertexShader: /* glsl */ `
          attribute float seed; uniform float time; uniform float size; varying float vA;
          void main(){
            vec3 p = position;
            p.x += sin(time * 0.4 + seed * 3.1) * 0.35;
            p.y += sin(time * 0.3 + seed * 1.7) * 0.3 + mod(time * 0.05 + seed, 1.0) * 0.4;
            p.z += cos(time * 0.35 + seed * 2.3) * 0.35;
            vA = 0.45 + 0.55 * sin(time * 1.6 + seed * 5.0);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (0.6 + fract(seed) * 0.8) / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D map; uniform vec3 color; uniform float opacity; varying float vA;
          void main(){
            float a = texture2D(map, gl_PointCoord).r * vA * opacity;
            if (a < 0.01) discard;
            gl_FragColor = vec4(color, a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useFrame((st) => {
    mat.uniforms.time.value = st.clock.elapsedTime * speed;
  });
  return <points geometry={geo} material={mat} position={center} frustumCulled={false} renderOrder={5} />;
}

/** いま やってほしいことを しめす、ぴょこぴょこ矢印 */
export function TaskMarker({ yOffset = 1.2, scale = 1 }: { yOffset?: number; scale?: number }) {
  const target = useDialog((s) => s.task?.target);
  const g = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((st) => {
    if (!g.current) return;
    const p = target ? targetWorldPos(target, tmp) : null;
    g.current.visible = Boolean(p);
    if (!p) return;
    const t = st.clock.elapsedTime;
    const o = (g.current.userData.off as number | undefined) ?? 0;
    g.current.position.set(p.x, p.y + yOffset + o + Math.abs(Math.sin(t * 3)) * 0.25, p.z);
    g.current.rotation.y = t * 1.5;
    if (ring.current) {
      const k = (t * 0.8) % 1;
      ring.current.scale.setScalar(0.5 + k * 1.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - k);
      ring.current.position.y = -(yOffset + Math.abs(Math.sin(t * 3)) * 0.25) + 0.05;
    }
  });
  return (
    <group ref={g} scale={scale} visible={false}>
      <mesh rotation-x={Math.PI} position-y={0.1}>
        <coneGeometry args={[0.22, 0.42, 16]} />
        <meshStandardMaterial color="#ffcf3f" emissive="#ff9d00" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      <mesh position-y={0.45}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#ffcf3f" emissive="#ff9d00" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.45, 0.55, 32]} />
        <meshBasicMaterial color="#fff2a8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * タップできるもの。押すと ぷにっと つぶれて はずみ、キラッと 光る。
 * hit を 指定すると、見えない 大きめの あたり判定を つける（小さい ゆびでも さわりやすい）。
 * (R3F の onClick はタッチでも動く。visible=false の メッシュは 描かれないが タップは ひろう)
 */
const hitGeo = new THREE.SphereGeometry(1, 10, 8);
export function Tappable({
  children,
  onTap,
  hitScale = 1,
  bounce = 0.12,
  hit,
  hitOffset,
  sparkle = true,
  ...rest
}: {
  children: ReactNode;
  onTap: (e: ThreeEvent<MouseEvent>) => void;
  hitScale?: number;
  bounce?: number;
  /** あたり判定の 半径（ワールド単位） */
  hit?: number;
  hitOffset?: THREE.Vector3Tuple;
  sparkle?: boolean;
} & ThreeElements['group']) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef(-10);
  const pending = useRef(false);
  useFrame((st) => {
    if (!g.current) return;
    const now = st.clock.elapsedTime;
    if (pending.current) {
      pending.current = false;
      t0.current = now;
    }
    const dt = now - t0.current;
    const w = dt < 0.9 ? Math.sin(dt * 17) * bounce * Math.exp(-dt * 5.5) : 0;
    // つぶれて のびる（スクワッシュ＆ストレッチ）
    g.current.scale.set(hitScale * (1 - w * 0.7), hitScale * (1 + w * 1.3), hitScale * (1 - w * 0.7));
  });
  return (
    <group
      {...rest}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 14) return;
        pending.current = true;
        if (sparkle) fx.pop(e.point);
        onTap(e);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <group ref={g}>{children}</group>
      {hit && <mesh geometry={hitGeo} scale={hit} position={hitOffset} visible={false} dispose={null} />}
    </group>
  );
}

/** 見えない あたり判定だけ ほしいとき */
export function HitArea({ r = 0.5, position }: { r?: number; position?: THREE.Vector3Tuple }) {
  return <mesh geometry={hitGeo} scale={r} position={position} visible={false} dispose={null} />;
}

/** ふわふわ上下 */
export function Bob({ children, amp = 0.1, speed = 1.5, phase = 0 }: { children: ReactNode; amp?: number; speed?: number; phase?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) g.current.position.y = Math.sin(st.clock.elapsedTime * speed + phase) * amp;
  });
  return <group ref={g}>{children}</group>;
}

/** easing */
export const ease = {
  out: (t: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3),
  inOut: (t: number) => {
    const x = THREE.MathUtils.clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },
  back: (t: number) => {
    const x = THREE.MathUtils.clamp(t, 0, 1);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
};

/** 0 → 1 へ なめらかに近づける値 */
export function damp(cur: number, target: number, speed: number, dt: number) {
  return THREE.MathUtils.lerp(cur, target, 1 - Math.exp(-speed * dt));
}

/** できあがりの 瞬間に うしろで まわる 光の すじ（ごほうび演出） */
export function RewardRays({ on, position, size = 3, color = '#fff0b0' }: { on: boolean; position?: THREE.Vector3Tuple; size?: number; color?: string }) {
  const mats = useMemo(
    () =>
      [0, 1].map(
        () => new THREE.SpriteMaterial({ map: raysTex(), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
      ),
    [color],
  );
  const a = useRef<THREE.Sprite>(null);
  const b = useRef<THREE.Sprite>(null);
  const k = useRef(0);
  useFrame((st, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, on ? 1 : 0, 1 - Math.exp(-(on ? 4 : 2) * dt));
    const t = st.clock.elapsedTime;
    mats[0].rotation = t * 0.35;
    mats[1].rotation = -t * 0.22;
    mats[0].opacity = k.current * 0.3;
    mats[1].opacity = k.current * 0.18;
    const s = size * (0.4 + 0.6 * k.current) * (1 + Math.sin(t * 3) * 0.04);
    a.current?.scale.setScalar(s);
    b.current?.scale.setScalar(s * 1.35);
    if (a.current) a.current.visible = k.current > 0.01;
    if (b.current) b.current.visible = k.current > 0.01;
  });
  return (
    <group position={position}>
      <sprite ref={a} material={mats[0]} renderOrder={2} />
      <sprite ref={b} material={mats[1]} renderOrder={2} />
    </group>
  );
}
