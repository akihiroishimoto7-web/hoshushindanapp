import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { bake, G } from '../bake';
import { bakedMat } from '../look';
import { Tappable } from '../common';
import { fx } from '../fx';
import { findSecret, SECRETS } from '../../game/secrets';
import { dialog } from '../../game/dialog';
import { playSfx } from '../../audio/sfx';

/** ひみつを みつけた ときの きょうつう しょり */
export function discover(id: string, at?: THREE.Vector3 | THREE.Vector3Tuple) {
  const def = SECRETS.find((s) => s.id === id);
  if (!def) return;
  const fresh = findSecret(id);
  if (at) fx.burst(at, { star: true, count: fresh ? 26 : 8, color: ['#ffd34d', '#ffffff', '#ff8fa3', '#7cc8f5'], speed: 2.4, gravity: 0.6, life: 1.3, size: 0.36 });
  dialog.side([{ t: 'say', text: fresh ? `ひみつ はっけん！ ${def.note}` : def.note, face: fresh ? 'excited' : 'happy', gesture: fresh ? 'cheer' : undefined }]);
}

/** ねずみの チュウ。どの章にも 1ぴき かくれている */
export function Mouse({ id, position, rotationY = 0, scale = 1 }: { id: string; position: THREE.Vector3Tuple; rotationY?: number; scale?: number }) {
  const geo = useMemo(
    () =>
      bake([
        { geo: G.sphere(0.13, 16, 12), color: '#b9b2c4', pos: [0, 0.12, 0], scale: [1, 0.9, 1.25] },
        { geo: G.sphere(0.095, 14, 10), color: '#c6c0d0', pos: [0, 0.2, 0.15] },
        { geo: G.sphere(0.055, 10, 8), color: '#f5b5c6', pos: [0.085, 0.3, 0.12], scale: [1, 1, 0.35] },
        { geo: G.sphere(0.055, 10, 8), color: '#f5b5c6', pos: [-0.085, 0.3, 0.12], scale: [1, 1, 0.35] },
        { geo: G.sphere(0.022, 8, 6), color: '#ff8fa3', pos: [0, 0.19, 0.245] },
        { geo: G.sphere(0.018, 8, 6), color: '#2b1a2a', pos: [0.04, 0.23, 0.225] },
        { geo: G.sphere(0.018, 8, 6), color: '#2b1a2a', pos: [-0.04, 0.23, 0.225] },
        { geo: G.sphere(0.04, 8, 6), color: '#f5b5c6', pos: [0.07, 0.03, 0.1], scale: [1, 0.5, 1.4] },
        { geo: G.sphere(0.04, 8, 6), color: '#f5b5c6', pos: [-0.07, 0.03, 0.1], scale: [1, 0.5, 1.4] },
        { geo: G.torus(0.11, 0.012, 6, 14, Math.PI), color: '#f5b5c6', pos: [0, 0.06, -0.24], rot: [Math.PI / 2, 0, 0.4] },
      ]),
    [],
  );
  const g = useRef<THREE.Group>(null);
  const hop = useRef(-10);
  const pending = useRef(false);
  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    if (pending.current) {
      pending.current = false;
      hop.current = t;
    }
    const k = (t - hop.current) / 0.5;
    g.current.position.y = k < 1 ? Math.sin(k * Math.PI) * 0.25 : 0;
    g.current.rotation.z = Math.sin(t * 3 + position[0]) * 0.05;
    g.current.rotation.x = Math.sin(t * 1.3) * 0.06;
  });
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <Tappable
        hit={0.42}
        hitOffset={[0, 0.18, 0]}
        onTap={(e) => {
          pending.current = true;
          playSfx('chirp');
          discover(id, e.point);
        }}
      >
        <group ref={g}>
          <mesh geometry={geo} material={bakedMat(0.85, 0.35)} />
        </group>
      </Tappable>
    </group>
  );
}

/** タッチすると ひみつが みつかる もの */
export function SecretSpot({ id, position, children, hit = 0.5, rotationY = 0 }: { id: string; position: THREE.Vector3Tuple; children?: ReactNode; hit?: number; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <Tappable
        hit={hit}
        onTap={(e) => {
          playSfx('sparkle');
          discover(id, e.point);
        }}
      >
        {children}
      </Tappable>
    </group>
  );
}

/** まどから ひょっこり かおを だす（タッチで でてくる） */
export function WindowPeek({ id, position, children, rise = 0.9 }: { id: string; position: THREE.Vector3Tuple; children: ReactNode; rise?: number }) {
  const g = useRef<THREE.Group>(null);
  const up = useRef(0);
  const want = useRef(0);
  useFrame((_, dt) => {
    up.current = THREE.MathUtils.lerp(up.current, want.current, 1 - Math.exp(-5 * dt));
    if (g.current) {
      g.current.position.y = -rise + up.current * rise;
      g.current.visible = up.current > 0.03;
    }
  });
  return (
    <group position={position}>
      <Tappable
        hit={1.0}
        sparkle={false}
        bounce={0}
        onTap={(e) => {
          want.current = 1;
          playSfx('boing');
          discover(id, e.point);
        }}
      >
        <group ref={g} visible={false}>
          {children}
        </group>
      </Tappable>
    </group>
  );
}

/** まどから のぞく うしさんの かお */
export function CowFace() {
  const geo = useMemo(
    () =>
      bake([
        { geo: G.sphere(0.42, 20, 16), color: '#fbfaf6', pos: [0, 0.45, 0], scale: [1, 1.05, 0.9] },
        { geo: G.sphere(0.24, 14, 12), color: '#2b2622', pos: [0.2, 0.62, 0.12], scale: [0.9, 1, 0.8] },
        { geo: G.sphere(0.27, 16, 12), color: '#ffb3bd', pos: [0, 0.27, 0.27], scale: [1.15, 0.75, 0.8] },
        { geo: G.sphere(0.035, 8, 6), color: '#6b3a3a', pos: [0.09, 0.3, 0.48] },
        { geo: G.sphere(0.035, 8, 6), color: '#6b3a3a', pos: [-0.09, 0.3, 0.48] },
        { geo: G.sphere(0.06, 10, 8), color: '#2b1a12', pos: [0.17, 0.56, 0.33] },
        { geo: G.sphere(0.06, 10, 8), color: '#2b1a12', pos: [-0.17, 0.56, 0.33] },
        { geo: G.sphere(0.12, 10, 8), color: '#fbfaf6', pos: [0.48, 0.66, 0], scale: [1.5, 0.5, 0.8] },
        { geo: G.sphere(0.12, 10, 8), color: '#2b2622', pos: [-0.48, 0.66, 0], scale: [1.5, 0.5, 0.8] },
        { geo: G.cone(0.05, 0.16, 8), color: '#f3e6c8', pos: [0.2, 0.9, 0], rot: [0, 0, -0.4] },
        { geo: G.cone(0.05, 0.16, 8), color: '#f3e6c8', pos: [-0.2, 0.9, 0], rot: [0, 0, 0.4] },
      ]),
    [],
  );
  return <mesh geometry={geo} material={bakedMat(0.85, 0.3)} />;
}

/** まどに とまる ことり */
export function BirdBody() {
  const geo = useMemo(
    () =>
      bake([
        { geo: G.sphere(0.2, 16, 12), color: '#7cc8f5', pos: [0, 0.2, 0], scale: [1, 1, 1.1] },
        { geo: G.sphere(0.15, 14, 10), color: '#9ad7fa', pos: [0, 0.42, 0.06] },
        { geo: G.sphere(0.13, 12, 10), color: '#fff7e6', pos: [0, 0.17, 0.1], scale: [0.9, 0.9, 0.8] },
        { geo: G.cone(0.04, 0.1, 8), color: '#ffb347', pos: [0, 0.41, 0.22], rot: [Math.PI / 2, 0, 0] },
        { geo: G.sphere(0.022, 8, 6), color: '#1b1b2a', pos: [0.06, 0.46, 0.17] },
        { geo: G.sphere(0.022, 8, 6), color: '#1b1b2a', pos: [-0.06, 0.46, 0.17] },
        { geo: G.sphere(0.1, 10, 8), color: '#5aa9df', pos: [0.19, 0.2, -0.02], scale: [0.4, 1, 1.3] },
        { geo: G.sphere(0.1, 10, 8), color: '#5aa9df', pos: [-0.19, 0.2, -0.02], scale: [0.4, 1, 1.3] },
      ]),
    [],
  );
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) {
      g.current.rotation.z = Math.sin(st.clock.elapsedTime * 4) * 0.12;
      g.current.position.y = Math.abs(Math.sin(st.clock.elapsedTime * 5)) * 0.05;
    }
  });
  return (
    <group ref={g}>
      <mesh geometry={geo} material={bakedMat(0.8, 0.35)} />
    </group>
  );
}

/** よつばの クローバー */
export function Clover() {
  const geo = useMemo(
    () =>
      bake([
        ...[0, 1, 2, 3].map((i) => ({
          geo: G.sphere(0.09, 10, 8),
          color: '#3fae4a',
          pos: [Math.cos((i / 4) * Math.PI * 2 + 0.78) * 0.09, 0.22, Math.sin((i / 4) * Math.PI * 2 + 0.78) * 0.09] as THREE.Vector3Tuple,
          scale: [1, 0.25, 1] as THREE.Vector3Tuple,
        })),
        { geo: G.cyl(0.012, 0.012, 0.22, 5), color: '#2f8a3a', pos: [0, 0.11, 0] },
      ]),
    [],
  );
  return <mesh geometry={geo} material={bakedMat(0.8, 0.5)} rotation-x={0.35} />;
}
