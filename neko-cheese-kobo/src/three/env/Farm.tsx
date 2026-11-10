import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Environment, Lightformer } from '@react-three/drei';
import { SunShadow } from '../realism';
import { rng, textTex, woodTex } from '../tex';
import { BlobShadow } from '../common';

/**
 * 牧場の景色（丘・草・花・木・雲・柵・風車・納屋・工房・ねこの家・鳥・ちょうちょ）。
 * たくさんあるものは InstancedMesh で まとめて描いて、スマホでも軽くする。
 */
const FLAT = 15;

export function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  const s = THREE.MathUtils.smoothstep(r, FLAT, FLAT + 26);
  return s * (5 + 2.5 * Math.sin(x * 0.09) + 2 * Math.cos(z * 0.07 + 1) + 1.2 * Math.sin((x + z) * 0.17));
}

function distToPath(x: number, z: number, path: THREE.Vector2[]) {
  let best = Infinity;
  const p = new THREE.Vector2(x, z);
  const tmp = new THREE.Vector2();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ab = tmp.copy(b).sub(a);
    const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
    const q = a.clone().add(ab.multiplyScalar(t));
    best = Math.min(best, q.distanceTo(p));
  }
  return best;
}

export function Ground({ path = [], onTap }: { path?: [number, number][]; onTap?: (e: ThreeEvent<MouseEvent>) => void }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(150, 150, 96, 96);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const pv = path.map(([x, z]) => new THREE.Vector2(x, z));
    const c1 = new THREE.Color('#8fd16a');
    const c2 = new THREE.Color('#5fae4e');
    const c3 = new THREE.Color('#b9e27a');
    const dirt = new THREE.Color('#e7c88f');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = groundHeight(x, z);
      pos.setY(i, h);
      const n = Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.5 + 0.5;
      c.copy(c1).lerp(c2, n * 0.6).lerp(c3, Math.max(0, Math.sin(x * 0.11 + z * 0.13)) * 0.35);
      if (pv.length > 1) {
        const d = distToPath(x, z, pv);
        if (d < 1.4) c.lerp(dirt, THREE.MathUtils.smoothstep(1.4 - d, 0, 0.6));
      }
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [path]);
  return (
    <mesh geometry={geo} onClick={onTap} name="ground">
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, mats: THREE.Matrix4[], colors?: THREE.Color[]) {
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((mx, i) => m.setMatrixAt(i, mx));
    if (colors) colors.forEach((c, i) => m.setColorAt(i, c));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [ref, mats, colors]);
}

const _o = new THREE.Object3D();
function mtx(x: number, y: number, z: number, s: number | THREE.Vector3Tuple = 1, ry = 0, rx = 0, rz = 0) {
  _o.position.set(x, y, z);
  _o.rotation.set(rx, ry, rz);
  if (typeof s === 'number') _o.scale.setScalar(s);
  else _o.scale.set(...s);
  _o.updateMatrix();
  return _o.matrix.clone();
}

/** 草のたば */
export function Grass({ count = 520, avoid = [], seed = 1 }: { count?: number; avoid?: [number, number, number][]; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const parts = [0, 1, 2].map((i) => {
      const c = new THREE.ConeGeometry(0.07, 0.45, 3);
      c.translate(0, 0.22, 0);
      c.rotateZ((i - 1) * 0.35);
      c.rotateY(i * 2.1);
      return c;
    });
    const merged = mergeSimple(parts);
    parts.forEach((p) => p.dispose());
    return merged;
  }, []);
  const { mats, colors } = useMemo(() => {
    const r = rng(seed);
    const mats: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    let guard = 0;
    while (mats.length < count && guard++ < count * 5) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 32;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar)) continue;
      mats.push(mtx(x, groundHeight(x, z), z, 0.8 + r() * 0.9, r() * 6));
      colors.push(new THREE.Color().setHSL(0.26 + r() * 0.06, 0.55, 0.38 + r() * 0.15));
    }
    return { mats, colors };
  }, [count, avoid, seed]);
  useInstances(ref, mats, colors);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, mats.length]} frustumCulled={false}>
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** 花 */
export function Flowers({ count = 90, avoid = [], seed = 5, onTap }: { count?: number; avoid?: [number, number, number][]; seed?: number; onTap?: (p: THREE.Vector3) => void }) {
  const heads = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const { hm, sm, colors } = useMemo(() => {
    const r = rng(seed);
    const hm: THREE.Matrix4[] = [];
    const sm: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const palette = ['#ff8fa3', '#ffd34d', '#ffffff', '#b38cff', '#ff9f43', '#7cc8f5'];
    let guard = 0;
    while (hm.length < count && guard++ < count * 6) {
      // まとまって咲く
      const ca = r() * Math.PI * 2;
      const cd = 4 + r() * 22;
      const x = Math.cos(ca) * cd + (r() - 0.5) * 2;
      const z = Math.sin(ca) * cd + (r() - 0.5) * 2;
      if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar)) continue;
      const y = groundHeight(x, z);
      const h = 0.25 + r() * 0.25;
      hm.push(mtx(x, y + h, z, 1, r() * 6));
      sm.push(mtx(x, y + h / 2, z, [1, h / 0.5, 1]));
      colors.push(new THREE.Color(palette[Math.floor(r() * palette.length)]));
    }
    return { hm, sm, colors };
  }, [count, avoid, seed]);
  useInstances(heads, hm, colors);
  useInstances(stems, sm);
  const headGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const p = new THREE.SphereGeometry(0.07, 6, 4);
      p.scale(1, 0.4, 1);
      const a = (i / 5) * Math.PI * 2;
      p.translate(Math.cos(a) * 0.07, 0, Math.sin(a) * 0.07);
      parts.push(p);
    }
    const m = mergeSimple(parts);
    parts.forEach((p) => p.dispose());
    return m;
  }, []);
  return (
    <group>
      <instancedMesh
        ref={heads}
        args={[headGeo, undefined, hm.length]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 14) return;
          onTap?.(e.point);
        }}
      >
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={stems} args={[undefined, undefined, sm.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
        <meshLambertMaterial color="#4f9a3e" />
      </instancedMesh>
    </group>
  );
}

/** 木 */
export function Trees({ spots }: { spots: [number, number, number][] }) {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const { tm, lm, lc } = useMemo(() => {
    const r = rng(9);
    const tm: THREE.Matrix4[] = [];
    const lm: THREE.Matrix4[] = [];
    const lc: THREE.Color[] = [];
    spots.forEach(([x, z, s]) => {
      const y = groundHeight(x, z);
      tm.push(mtx(x, y + 0.9 * s, z, [s, s, s]));
      const blobs = 3;
      for (let k = 0; k < blobs; k++) {
        const a = (k / blobs) * Math.PI * 2 + r();
        lm.push(mtx(x + Math.cos(a) * 0.5 * s, y + (2.2 + r() * 0.6) * s, z + Math.sin(a) * 0.5 * s, (0.95 + r() * 0.3) * s, r() * 6));
        lc.push(new THREE.Color().setHSL(0.27 + r() * 0.06, 0.5, 0.36 + r() * 0.1));
      }
      lm.push(mtx(x, y + 2.9 * s, z, 0.9 * s));
      lc.push(new THREE.Color().setHSL(0.28, 0.55, 0.45));
    });
    return { tm, lm, lc };
  }, [spots]);
  useInstances(trunk, tm);
  useInstances(leaves, lm, lc);
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, tm.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.24, 1.8, 7]} />
        <meshLambertMaterial color="#8c5b32" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, lm.length]} frustumCulled={false}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      {spots.map(([x, z, s], i) => (
        <group key={i} position={[x, groundHeight(x, z), z]}>
          <BlobShadow size={2.4 * s} opacity={0.18} />
        </group>
      ))}
    </group>
  );
}

/** ゆっくり流れる雲 */
export function Clouds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const g = useRef<THREE.Group>(null);
  const mats = useMemo(() => {
    const r = rng(77);
    const out: THREE.Matrix4[] = [];
    for (let c = 0; c < 8; c++) {
      const a = (c / 8) * Math.PI * 2 + r();
      const d = 45 + r() * 25;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      const y = 22 + r() * 10;
      for (let k = 0; k < 5; k++) {
        out.push(mtx(x + (k - 2) * 2.2, y + Math.sin(k) * 0.8, z + (r() - 0.5) * 2, 2 + r() * 1.6 + (k === 2 ? 1 : 0)));
      }
    }
    return out;
  }, []);
  useInstances(ref, mats);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.006;
  });
  return (
    <group ref={g}>
      <instancedMesh ref={ref} args={[undefined, undefined, mats.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshLambertMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} fog={false} />
      </instancedMesh>
    </group>
  );
}

/** 木の柵 */
export function Fence({ points, closed = false }: { points: [number, number][]; closed?: boolean }) {
  const posts = useRef<THREE.InstancedMesh>(null);
  const rails = useRef<THREE.InstancedMesh>(null);
  const { pm, rm } = useMemo(() => {
    const pts = closed ? [...points, points[0]] : points;
    const pm: THREE.Matrix4[] = [];
    const rm: THREE.Matrix4[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.max(1, Math.round(len / 1.6));
      const ang = Math.atan2(x1 - x0, z1 - z0);
      for (let k = 0; k < n; k++) {
        const t0 = k / n;
        const t1 = (k + 1) / n;
        const ax = x0 + (x1 - x0) * t0;
        const az = z0 + (z1 - z0) * t0;
        const bx = x0 + (x1 - x0) * t1;
        const bz = z0 + (z1 - z0) * t1;
        const ya = groundHeight(ax, az);
        pm.push(mtx(ax, ya + 0.45, az));
        const mx = (ax + bx) / 2;
        const mz = (az + bz) / 2;
        const my = groundHeight(mx, mz);
        const seg = len / n;
        rm.push(mtx(mx, my + 0.65, mz, [1, 1, seg], ang));
        rm.push(mtx(mx, my + 0.35, mz, [1, 1, seg], ang));
      }
      if (i === pts.length - 2) pm.push(mtx(x1, groundHeight(x1, z1) + 0.45, z1));
    }
    return { pm, rm };
  }, [points, closed]);
  useInstances(posts, pm);
  useInstances(rails, rm);
  return (
    <group>
      <instancedMesh ref={posts} args={[undefined, undefined, pm.length]} frustumCulled={false}>
        <boxGeometry args={[0.14, 0.9, 0.14]} />
        <meshLambertMaterial color="#f6ead2" />
      </instancedMesh>
      <instancedMesh ref={rails} args={[undefined, undefined, rm.length]} frustumCulled={false}>
        <boxGeometry args={[0.07, 0.1, 1]} />
        <meshLambertMaterial color="#f6ead2" />
      </instancedMesh>
    </group>
  );
}

/** 風車。タップすると はやく まわる */
export function Windmill({ position, onTap }: { position: THREE.Vector3Tuple; onTap?: () => void }) {
  const blades = useRef<THREE.Group>(null);
  const boost = useRef(0);
  useFrame((_, dt) => {
    boost.current = Math.max(0, boost.current - dt * 0.8);
    if (blades.current) blades.current.rotation.z += dt * (0.6 + boost.current * 5);
  });
  const y = groundHeight(position[0], position[2]);
  return (
    <group
      position={[position[0], y, position[2]]}
      rotation-y={0.6}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 14) return;
        boost.current = 2;
        onTap?.();
      }}
    >
      <mesh position-y={3}>
        <cylinderGeometry args={[1.0, 1.6, 6, 10]} />
        <meshLambertMaterial color="#f3e7d3" />
      </mesh>
      <mesh position-y={6.6}>
        <coneGeometry args={[1.35, 1.8, 10]} />
        <meshLambertMaterial color="#d9634f" />
      </mesh>
      <mesh position={[0, 0.8, 1.45]}>
        <boxGeometry args={[0.8, 1.4, 0.2]} />
        <meshLambertMaterial color="#8c5b32" />
      </mesh>
      <mesh position={[0, 3.8, 1.25]}>
        <circleGeometry args={[0.35, 16]} />
        <meshLambertMaterial color="#7cc8f5" />
      </mesh>
      <group ref={blades} position={[0, 5.6, 1.35]}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.25, 0.25, 0.3, 10]} />
          <meshLambertMaterial color="#8c5b32" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation-z={(i / 4) * Math.PI * 2}>
            <mesh position-y={1.8}>
              <boxGeometry args={[0.85, 3.2, 0.06]} />
              <meshLambertMaterial color="#fffaf0" />
            </mesh>
            <mesh position={[-0.3, 1.8, 0.04]}>
              <boxGeometry args={[0.08, 3.2, 0.06]} />
              <meshLambertMaterial color="#8c5b32" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function gableRoof(w: number, d: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}

/** 赤い納屋 */
export function Barn({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  const roof = useMemo(() => gableRoof(5.6, 6.4, 2.2), []);
  const wall = useMemo(() => gableRoof(5, 6, 2), []);
  return (
    <group position={position} rotation-y={rotationY}>
      <BlobShadow size={8} opacity={0.2} />
      <mesh position-y={1.6}>
        <boxGeometry args={[5, 3.2, 6]} />
        <meshLambertMaterial color="#d9534f" />
      </mesh>
      <mesh geometry={wall} position-y={3.2}>
        <meshLambertMaterial color="#d9534f" />
      </mesh>
      <mesh geometry={roof} position-y={3.15}>
        <meshLambertMaterial color="#7a4a2a" />
      </mesh>
      {/* 扉 */}
      <group position={[0, 1.2, 3.02]}>
        <mesh>
          <boxGeometry args={[2.2, 2.4, 0.08]} />
          <meshLambertMaterial color="#fff6ea" />
        </mesh>
        <mesh position-z={0.05}>
          <boxGeometry args={[1.9, 2.1, 0.06]} />
          <meshLambertMaterial color="#c9443f" />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position-z={0.1} rotation-z={s * 0.83}>
            <boxGeometry args={[0.16, 2.8, 0.05]} />
            <meshLambertMaterial color="#fff6ea" />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 3.6, 3.03]}>
        <circleGeometry args={[0.45, 20]} />
        <meshLambertMaterial color="#fff6ea" />
      </mesh>
      {/* ほしくさ */}
      {[
        [3.2, 2.2],
        [3.3, 0.6],
        [-3.1, 2.6],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.55, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.55, 0.55, 1.1, 14]} />
          <meshLambertMaterial color="#f2cf6b" />
        </mesh>
      ))}
    </group>
  );
}

/** チーズ工房（あたたかい クリーム色の家） */
export function CheeseHouse({
  position,
  rotationY = 0,
  doorRef,
  doorOpen = 0,
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  doorRef?: (o: THREE.Object3D | null) => void;
  doorOpen?: number;
}) {
  const roof = useMemo(() => gableRoof(6.4, 5.8, 2.6), []);
  const wall = useMemo(() => gableRoof(5.6, 5, 2.3), []);
  const wood = woodTex('#a86b3c', '#7a4a24', 'door-wood', 5);
  const sign = textTex('チーズこうぼう', { w: 512, h: 128, bg: '#fff6d8', color: '#7a4a24', size: 62, border: '#e8a93a' });
  const smoke = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!smoke.current) return;
    smoke.current.children.forEach((c, i) => {
      const k = (st.clock.elapsedTime * 0.25 + i / 4) % 1;
      c.position.set(Math.sin(k * 4 + i) * 0.3, k * 2.5, 0);
      c.scale.setScalar(0.3 + k * 0.7);
      ((c as THREE.Mesh).material as THREE.MeshLambertMaterial).opacity = 0.7 * (1 - k);
    });
  });
  return (
    <group position={position} rotation-y={rotationY}>
      <BlobShadow size={8} opacity={0.2} />
      <mesh position-y={1.5}>
        <boxGeometry args={[5.6, 3, 5]} />
        <meshLambertMaterial color="#fff1cf" />
      </mesh>
      <mesh geometry={wall} position-y={3}>
        <meshLambertMaterial color="#fff1cf" />
      </mesh>
      <mesh geometry={roof} position-y={2.95}>
        <meshLambertMaterial color="#f29b30" />
      </mesh>
      {/* 柱 */}
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} position={[x, 1.5, 2.5]}>
          <boxGeometry args={[0.25, 3, 0.25]} />
          <meshLambertMaterial color="#a86b3c" />
        </mesh>
      ))}
      {/* 窓 */}
      {[-1.7, 1.7].map((x) => (
        <group key={x} position={[x, 1.7, 2.52]}>
          <mesh>
            <boxGeometry args={[1.0, 1.0, 0.08]} />
            <meshLambertMaterial color="#a86b3c" />
          </mesh>
          <mesh position-z={0.05}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshLambertMaterial color="#ffe9a8" emissive="#ffcf6b" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* 扉 */}
      <group position={[-0.6, 0, 2.52]} ref={doorRef}>
        <group rotation-y={-doorOpen * 1.6}>
          <mesh position={[0.6, 1.1, 0.03]}>
            <boxGeometry args={[1.2, 2.2, 0.1]} />
            <meshLambertMaterial map={wood} />
          </mesh>
          <mesh position={[1.05, 1.1, 0.12]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshLambertMaterial color="#f2c94c" />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 3.25, 2.55]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      {/* まるい チーズの看板 */}
      <group position={[2.0, 3.6, 2.6]} rotation-x={Math.PI / 2}>
        <mesh>
          <cylinderGeometry args={[0.45, 0.45, 0.18, 20, 1, false, 0.5, Math.PI * 2 - 1]} />
          <meshLambertMaterial color="#ffd34d" />
        </mesh>
      </group>
      {/* えんとつ */}
      <mesh position={[1.6, 4.4, -1]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshLambertMaterial color="#c9a37a" />
      </mesh>
      <group ref={smoke} position={[1.6, 5.3, -1]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.4, 10, 8]} />
            <meshLambertMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** ねこの村の小さな家 */
export function CatHouse({ position, wall = '#ffe1e6', roof = '#ff8fa3', rotationY = 0, scale = 1 }: { position: [number, number]; wall?: string; roof?: string; rotationY?: number; scale?: number }) {
  const r = useMemo(() => gableRoof(3.2, 3.2, 1.5), []);
  const y = groundHeight(position[0], position[1]);
  return (
    <group position={[position[0], y, position[1]]} rotation-y={rotationY} scale={scale}>
      <mesh position-y={1.1}>
        <boxGeometry args={[2.8, 2.2, 2.8]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh geometry={r} position-y={2.15}>
        <meshLambertMaterial color={roof} />
      </mesh>
      <mesh position={[0, 0.7, 1.41]}>
        <planeGeometry args={[0.8, 1.4]} />
        <meshLambertMaterial color="#8c5b32" />
      </mesh>
      {/* ねこ耳まど */}
      <mesh position={[0.9, 1.5, 1.41]}>
        <circleGeometry args={[0.35, 16]} />
        <meshLambertMaterial color="#fff7c2" emissive="#ffd36b" emissiveIntensity={0.4} />
      </mesh>
      {[-0.2, 0.2].map((dx) => (
        <mesh key={dx} position={[dx, 3.7, 0]} rotation-z={dx > 0 ? -0.3 : 0.3}>
          <coneGeometry args={[0.28, 0.6, 4]} />
          <meshLambertMaterial color={roof} />
        </mesh>
      ))}
    </group>
  );
}

/** 空を まわる 小鳥 */
export function Birds({ onTap }: { onTap?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const birds = useMemo(
    () => [0, 1, 2, 3, 4].map((i) => ({ r: 9 + i * 2.2, h: 8 + (i % 3) * 1.5, sp: 0.25 + (i % 2) * 0.08, ph: i * 1.3 })),
    [],
  );
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    group.current?.children.forEach((b, i) => {
      const d = birds[i];
      const a = t * d.sp + d.ph;
      b.position.set(Math.cos(a) * d.r, d.h + Math.sin(t * 1.3 + i) * 0.6, Math.sin(a) * d.r - 4);
      b.rotation.y = -a;
      const flap = Math.sin(t * 12 + i) * 0.7;
      (b.children[1] as THREE.Object3D).rotation.z = flap;
      (b.children[2] as THREE.Object3D).rotation.z = -flap;
    });
  });
  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
    >
      {birds.map((_, i) => (
        <group key={i} scale={0.9}>
          <mesh scale={[0.6, 0.6, 1]}>
            <sphereGeometry args={[0.28, 10, 8]} />
            <meshLambertMaterial color={i % 2 ? '#7cc8f5' : '#ffffff'} />
          </mesh>
          <group>
            <mesh position-x={0.32} scale={[1, 0.15, 0.6]}>
              <sphereGeometry args={[0.32, 8, 6]} />
              <meshLambertMaterial color={i % 2 ? '#5aa9df' : '#f0f0f0'} />
            </mesh>
          </group>
          <group>
            <mesh position-x={-0.32} scale={[1, 0.15, 0.6]}>
              <sphereGeometry args={[0.32, 8, 6]} />
              <meshLambertMaterial color={i % 2 ? '#5aa9df' : '#f0f0f0'} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/** ちょうちょ */
export function Butterflies({ center = [0, 0] as [number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    group.current?.children.forEach((b, i) => {
      const a = t * (0.5 + i * 0.13) + i * 2;
      const x = center[0] + Math.cos(a) * (2 + i) + Math.sin(t * 0.7 + i) * 0.8;
      const z = center[1] + Math.sin(a * 1.3) * (2 + i * 0.6);
      b.position.set(x, groundHeight(x, z) + 0.9 + Math.sin(t * 3 + i) * 0.3, z);
      b.rotation.y = -a;
      const f = Math.sin(t * 18 + i) * 1.0;
      (b.children[0] as THREE.Object3D).rotation.z = f;
      (b.children[1] as THREE.Object3D).rotation.z = -f;
    });
  });
  const colors = ['#ffd34d', '#ff8fa3', '#b38cff'];
  return (
    <group ref={group}>
      {colors.map((c) => (
        <group key={c} scale={0.6}>
          <mesh position-x={0.12} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.14, 10]} />
            <meshLambertMaterial color={c} side={THREE.DoubleSide} />
          </mesh>
          <mesh position-x={-0.12} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.14, 10]} />
            <meshLambertMaterial color={c} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 牧場の光 */
export function FarmLights({ follow }: { follow?: React.RefObject<THREE.Object3D | null> } = {}) {
  return (
    <>
      <hemisphereLight args={['#dff1ff', '#8fc45e', 0.85]} />
      <SunShadow position={[9, 14, -5]} intensity={2.9} color="#ffe6b8" range={15} follow={follow} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#cfe8ff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
        <Lightformer form="rect" intensity={2.6} color="#ffe2a8" position={[6, 3, -4]} rotation-y={-Math.PI / 3} scale={[5, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#9fd47a" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
      </Environment>
      <directionalLight position={[-8, 6, 10]} intensity={0.45} color="#cfe6ff" />
      <fog attach="fog" args={['#fbeedb', 34, 105]} />
    </>
  );
}

/** 位置・法線だけの簡単なジオメトリ結合 */
export function mergeSimple(parts: THREE.BufferGeometry[]) {
  const geos = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  let n = 0;
  geos.forEach((g) => (n += g.attributes.position.count));
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  let o = 0;
  geos.forEach((g) => {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geos.forEach((g, i) => g !== parts[i] && g.dispose());
  return out;
}

/** とおくの 山なみ（空気遠近法で あおく かすむ。おくゆきを 出す） */
export function DistantHills() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(31);
    const m: THREE.Matrix4[] = [];
    const c: THREE.Color[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.3;
      const far = i % 2;
      const d = far ? 100 : 74;
      m.push(mtx(Math.cos(a) * d, -4, Math.sin(a) * d, [22 + r() * 16, (far ? 20 : 12) + r() * 9, 18 + r() * 10]));
      c.push(new THREE.Color(far ? '#a9cdea' : '#8fc79a').lerp(new THREE.Color('#cfe6f5'), r() * 0.3));
    }
    return { m, c };
  }, []);
  useInstances(ref, data.m, data.c);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.m.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 20, 12]} />
      <meshBasicMaterial fog={false} />
    </instancedMesh>
  );
}
