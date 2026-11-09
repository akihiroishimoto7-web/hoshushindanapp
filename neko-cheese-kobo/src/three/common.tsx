import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { radialTex, SKY } from './tex';
import { targetWorldPos } from './targets';
import { useDialog } from '../game/dialog';

/** まるい ぼかし影（本物の影より ずっと軽い） */
const shadowMat = new THREE.MeshBasicMaterial({
  color: '#3b2a10',
  transparent: true,
  opacity: 0.28,
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
    m.opacity = opacity;
    return m;
  }, [opacity]);
  return (
    <mesh geometry={shadowGeo} material={mat} rotation-x={-Math.PI / 2} position-y={y} scale={[size, size, 1]} renderOrder={1} dispose={null} />
  );
}

/** グラデーションの空 */
export function SkyDome({
  top = SKY.top,
  mid = SKY.mid,
  bottom = SKY.bottom,
  radius = 140,
}: {
  top?: THREE.Color;
  mid?: THREE.Color;
  bottom?: THREE.Color;
  radius?: number;
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: top }, mid: { value: mid }, bottom: { value: bottom } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: /* glsl */ `
          uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
          void main(){
            float h = vP.y;
            vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.7, h)) : mix(bottom, mid, smoothstep(-0.05, 0.12, h));
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [top, mid, bottom],
  );
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 24, 12]} />
    </mesh>
  );
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
 * タップできるもの。押すと ぷにっと はずむ。
 * (R3F の onClick はタッチでも動く)
 */
export function Tappable({
  children,
  onTap,
  hitScale = 1,
  bounce = 0.12,
  ...rest
}: {
  children: ReactNode;
  onTap: (e: ThreeEvent<MouseEvent>) => void;
  hitScale?: number;
  bounce?: number;
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
    const s = dt < 0.8 ? 1 + Math.sin(dt * 18) * bounce * Math.exp(-dt * 6) : 1;
    g.current.scale.setScalar(s * hitScale);
  });
  return (
    <group
      {...rest}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 14) return;
        pending.current = true;
        onTap(e);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <group ref={g}>{children}</group>
    </group>
  );
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
