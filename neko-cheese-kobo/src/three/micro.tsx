import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * ミクロの せかいの なかまたち（2章・3章で共通）
 *  - CaseinCloud : カゼインの つぶ（まわりに ふさふさ＝κ-カゼインの「くっつかないで バリア」）
 *  - Bacterium   : 乳酸菌（ラクトコッカスのように まるい つぶが 2こ つながった形。ほんとうは べん毛は ない）
 */
const HAIRS = 22;

export function CaseinCloud({
  positions,
  hair,
  radius = 0.16,
  color = '#fff1dc',
  hairColor = '#f0c9a0',
  onTap,
}: {
  positions: React.RefObject<THREE.Vector3[]>;
  /** ふさふさの長さ 0..1 */
  hair: React.RefObject<number>;
  radius?: number;
  color?: string;
  hairColor?: string;
  onTap?: (i: number) => void;
}) {
  const n = positions.current.length;
  const balls = useRef<THREE.InstancedMesh>(null);
  const dirs = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < n * HAIRS; i++) out.push(new THREE.Vector3().randomDirection());
    return out;
  }, [n]);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * HAIRS * 2 * 3), 3));
    return g;
  }, [n]);
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const P = lineGeo.attributes.position.array as Float32Array;
    const h = hair.current;
    positions.current.forEach((c, i) => {
      if (balls.current) {
        o.position.copy(c);
        o.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.03);
        o.updateMatrix();
        balls.current.setMatrixAt(i, o.matrix);
      }
      for (let k = 0; k < HAIRS; k++) {
        const d = dirs[i * HAIRS + k];
        const w = Math.sin(t * 3 + k + i) * 0.015;
        const j = (i * HAIRS + k) * 6;
        P[j] = c.x + d.x * radius * 0.95;
        P[j + 1] = c.y + d.y * radius * 0.95;
        P[j + 2] = c.z + d.z * radius * 0.95;
        const L = radius * (0.95 + 0.75 * h);
        P[j + 3] = c.x + d.x * L + w;
        P[j + 4] = c.y + d.y * L + w;
        P[j + 5] = c.z + d.z * L;
      }
    });
    if (balls.current) balls.current.instanceMatrix.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh
        ref={balls}
        args={[undefined, undefined, n]}
        frustumCulled={false}
        onClick={
          onTap
            ? (e) => {
                e.stopPropagation();
                if (e.delta > 14 || e.instanceId === undefined) return;
                onTap(e.instanceId);
              }
            : undefined
        }
      >
        <icosahedronGeometry args={[radius, 2]} />
        <meshPhysicalMaterial color={color} roughness={0.45} sheen={1} sheenColor="#ffe2c0" transparent opacity={0.92} />
      </instancedMesh>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial color={hairColor} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

const labMats = {
  body: new THREE.MeshPhysicalMaterial({ color: '#c9b6ff', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), emissive: '#7a5cff', emissiveIntensity: 0.1 }),
  body2: new THREE.MeshPhysicalMaterial({ color: '#ffc2dc', roughness: 0.4, emissive: '#ff6fa8', emissiveIntensity: 0.1 , clearcoat: 0.8, clearcoatRoughness: 0.2, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') }),
  eye: new THREE.MeshBasicMaterial({ color: '#3a2a5a' }),
  shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  mouth: new THREE.MeshBasicMaterial({ color: '#7a2e4e' }),
  cheek: new THREE.MeshBasicMaterial({ color: '#ff8fb8', transparent: true, opacity: 0.6 }),
};

export interface LabState {
  pos: THREE.Vector3;
  home: THREE.Vector3;
  scale: number;
  eatT: number;
  phase: number;
  meals: number;
  spawnT: number;
  pink: boolean;
}

/** 乳酸菌くん（えがおは わかりやすくする ための 表現） */
export function Bacterium({ s, look, size = 1 }: { s: LabState; look?: THREE.Vector3; size?: number }) {
  const g = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    const eat = Math.max(0, 1 - (t - s.eatT) / 0.8);
    const born = THREE.MathUtils.clamp((t - s.spawnT) / 0.6, 0, 1);
    g.current.position.copy(s.pos);
    const k = size * s.scale * (0.3 + 0.7 * born) * (1 + Math.sin(eat * Math.PI * 4) * 0.12 * eat);
    g.current.scale.setScalar(k);
    if (look) g.current.lookAt(look);
    g.current.rotateZ(Math.sin(t * 1.5 + s.phase) * 0.25);
    if (mouth.current) mouth.current.scale.set(1, 0.4 + eat * 1.4 + Math.abs(Math.sin(t * 2 + s.phase)) * 0.2, 1);
  });
  const mat = s.pink ? labMats.body2 : labMats.body;
  return (
    <group ref={g}>
      <mesh material={mat} position-x={-0.2}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      <mesh material={mat} position-x={0.22} scale={0.92}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      {/* かお（まえの つぶ） */}
      <group position={[-0.2, 0.02, 0.27]}>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.09, 0.05, 0]}>
            <mesh material={labMats.eye} scale={[0.8, 1.1, 0.5]}>
              <sphereGeometry args={[0.045, 10, 8]} />
            </mesh>
            <mesh material={labMats.shine} position={[0.013, 0.02, 0.02]}>
              <sphereGeometry args={[0.014, 6, 4]} />
            </mesh>
          </group>
        ))}
        <mesh ref={mouth} material={labMats.mouth} position={[0, -0.07, 0.01]} scale={[1, 0.4, 1]}>
          <circleGeometry args={[0.035, 12]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={'c' + sx} material={labMats.cheek} position={[sx * 0.15, -0.04, -0.01]}>
            <circleGeometry args={[0.035, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
