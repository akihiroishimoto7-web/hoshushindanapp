import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { holsteinTex } from '../tex';
import { BlobShadow } from '../common';

/**
 * うしさん。ホルスタイン（しろくろ）とジャージー（ちゃいろ）。
 * 草を食べ、しっぽをふり、タップすると「モ〜」と顔を上げる。
 */
export type CowKind = 'holstein' | 'jersey';

const shared = {
  pink: new THREE.MeshStandardMaterial({ color: '#ffb3bd', roughness: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: '#2b211c', roughness: 0.4 }),
  shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  horn: new THREE.MeshStandardMaterial({ color: '#f3e6c8', roughness: 0.5 }),
  hoof: new THREE.MeshStandardMaterial({ color: '#4a3b30', roughness: 0.6 }),
  bell: new THREE.MeshStandardMaterial({ color: '#f2c94c', roughness: 0.25, metalness: 0.6 }),
  strap: new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.6 }),
  mouth: new THREE.MeshStandardMaterial({ color: '#7a2e2e', roughness: 0.5 }),
};
let holsteinMat: THREE.MeshStandardMaterial | null = null;
const jerseyMat = new THREE.MeshStandardMaterial({ color: '#b97a4a', roughness: 0.85 });
const jerseyLight = new THREE.MeshStandardMaterial({ color: '#e9c9a1', roughness: 0.85 });
const whiteMat = new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.85 });

export function Cow({
  kind = 'holstein',
  position,
  rotationY = 0,
  scale = 1,
  mooAt,
  seed = 0,
  graze = true,
  onTap,
}: {
  kind?: CowKind;
  position?: THREE.Vector3Tuple;
  rotationY?: number;
  scale?: number;
  /** この値（clock 時刻）が変わると モ〜 */
  mooAt?: React.RefObject<number>;
  seed?: number;
  graze?: boolean;
  onTap?: () => void;
}) {
  if (!holsteinMat) holsteinMat = new THREE.MeshStandardMaterial({ map: holsteinTex(), roughness: 0.85 });
  const coat = kind === 'holstein' ? holsteinMat : jerseyMat;
  const face = kind === 'holstein' ? whiteMat : jerseyLight;
  const neck = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);
  const st = useRef({ blinkAt: 2 + seed, mooT: -10, lastMoo: 0 });
  const isCalf = scale < 0.75;

  const bodyGeo = useMemo(() => new THREE.SphereGeometry(0.5, 28, 20), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed * 7;
    const now = state.clock.elapsedTime;
    const s = st.current;
    if (mooAt && mooAt.current !== s.lastMoo) {
      s.lastMoo = mooAt.current;
      s.mooT = now;
    }
    const mooK = (now - s.mooT) / 1.5;
    const mooing = mooK >= 0 && mooK < 1;
    if (neck.current) {
      // 草を食べる → ときどき顔を上げる
      const cycle = (Math.sin(t * 0.35) + 1) / 2;
      const down = graze ? THREE.MathUtils.smoothstep(cycle, 0.35, 0.65) : 0.1;
      let rx = -0.15 + down * 0.95;
      if (mooing) rx = -0.4 * Math.sin(Math.min(1, mooK * 1.2) * Math.PI) + rx * (1 - Math.sin(mooK * Math.PI));
      neck.current.rotation.x = THREE.MathUtils.lerp(neck.current.rotation.x, rx, 0.1);
      neck.current.rotation.y = Math.sin(t * 0.21) * 0.15;
    }
    if (jaw.current) jaw.current.rotation.x = mooing ? 0 : Math.max(0, Math.sin(t * 6)) * 0.08;
    if (mouth.current) {
      mouth.current.visible = mooing;
      mouth.current.scale.y = mooing ? 0.4 + Math.sin(mooK * Math.PI) * 0.8 : 0.1;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 1.7) * 0.35 + Math.sin(t * 4.1) * 0.08;
    const flick = Math.max(0, Math.sin(t * 0.9)) > 0.97 ? Math.sin(t * 40) * 0.3 : 0;
    if (earL.current) earL.current.rotation.z = -0.2 + flick;
    if (earR.current) earR.current.rotation.z = 0.2 - flick;
    let blink = 1;
    if (t > s.blinkAt) {
      const k = (t - s.blinkAt) / 0.18;
      blink = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
      if (k >= 1) s.blinkAt = t + 2.5 + Math.random() * 3;
    }
    if (eyes.current) eyes.current.scale.y = blink;
  });

  return (
    <group
      position={position}
      rotation-y={rotationY}
      scale={scale}
      onClick={
        onTap
          ? (e) => {
              e.stopPropagation();
              if (e.delta > 14) return;
              onTap();
            }
          : undefined
      }
    >
      <BlobShadow size={2.4} opacity={0.3} />
      {/* からだ */}
      <mesh geometry={bodyGeo} material={coat} position-y={1.0} scale={[0.95, 0.85, 1.7]} />
      {/* あし */}
      {[
        [-0.3, 0.55],
        [0.3, 0.55],
        [-0.3, -0.55],
        [0.3, -0.55],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={coat} position-y={0.4}>
            <cylinderGeometry args={[0.11, 0.1, 0.7, 10]} />
          </mesh>
          <mesh material={shared.hoof} position-y={0.06}>
            <cylinderGeometry args={[0.11, 0.12, 0.12, 10]} />
          </mesh>
        </group>
      ))}
      {/* おちち */}
      {!isCalf && (
        <group position={[0, 0.62, -0.35]}>
          <mesh material={shared.pink} scale={[1, 0.75, 1]}>
            <sphereGeometry args={[0.2, 14, 10]} />
          </mesh>
          {[
            [-0.08, -0.08],
            [0.08, -0.08],
            [-0.08, 0.08],
            [0.08, 0.08],
          ].map(([x, z], i) => (
            <mesh key={i} material={shared.pink} position={[x, -0.15, z]}>
              <capsuleGeometry args={[0.025, 0.05, 3, 6]} />
            </mesh>
          ))}
        </group>
      )}
      {/* しっぽ */}
      <group ref={tail} position={[0, 1.25, -0.84]}>
        <mesh material={coat} position-y={-0.32} rotation-x={0.1}>
          <cylinderGeometry args={[0.025, 0.03, 0.65, 6]} />
        </mesh>
        <mesh material={shared.dark} position-y={-0.68}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
      </group>
      {/* くび・あたま */}
      <group ref={neck} position={[0, 1.18, 0.72]}>
        <mesh material={coat} position={[0, 0, 0.12]} rotation-x={0.6}>
          <cylinderGeometry args={[0.28, 0.32, 0.45, 14]} />
        </mesh>
        {!isCalf && (
          <group position={[0, -0.18, 0.22]}>
            <mesh material={shared.strap} rotation-x={Math.PI / 2 + 0.6}>
              <torusGeometry args={[0.26, 0.03, 6, 20]} />
            </mesh>
            <mesh material={shared.bell} position={[0, -0.2, 0.15]}>
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
          </group>
        )}
        <group position={[0, 0.05, 0.38]}>
          <mesh material={face} scale={[0.95, 1, 1.15]}>
            <sphereGeometry args={[0.3, 22, 18]} />
          </mesh>
          {kind === 'holstein' && (
            <mesh material={shared.dark} position={[0.12, 0.12, 0.08]} scale={[0.7, 0.8, 1]}>
              <sphereGeometry args={[0.22, 14, 12]} />
            </mesh>
          )}
          <group ref={jaw}>
            <mesh material={shared.pink} position={[0, -0.12, 0.27]} scale={[1.1, 0.8, 0.85]}>
              <sphereGeometry args={[0.19, 18, 14]} />
            </mesh>
            {[-1, 1].map((sx) => (
              <mesh key={sx} material={shared.dark} position={[sx * 0.07, -0.08, 0.43]} scale={[1, 0.7, 0.5]}>
                <sphereGeometry args={[0.03, 8, 6]} />
              </mesh>
            ))}
            <mesh ref={mouth} material={shared.mouth} position={[0, -0.22, 0.38]} scale={[1, 0.1, 0.5]} visible={false}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
          </group>
          <group ref={eyes} position={[0, 0.1, 0]}>
            {[-1, 1].map((sx) => (
              <group key={sx} position={[sx * 0.17, 0.0, 0.24]} rotation-y={sx * 0.5}>
                <mesh material={shared.dark} scale={[0.8, 1, 0.5]}>
                  <sphereGeometry args={[0.055, 12, 10]} />
                </mesh>
                <mesh material={shared.shine} position={[0.012, 0.022, 0.025]}>
                  <sphereGeometry args={[0.016, 8, 6]} />
                </mesh>
              </group>
            ))}
          </group>
          {[-1, 1].map((sx) => (
            <group key={sx} ref={sx < 0 ? earR : earL} position={[sx * 0.3, 0.14, -0.02]}>
              <mesh material={coat} position={[sx * 0.1, 0, 0]} scale={[1.6, 0.5, 0.9]}>
                <sphereGeometry args={[0.08, 10, 8]} />
              </mesh>
              <mesh material={shared.pink} position={[sx * 0.11, 0, 0.03]} scale={[1.3, 0.35, 0.5]}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
            </group>
          ))}
          {!isCalf &&
            [-1, 1].map((sx) => (
              <mesh key={'h' + sx} material={shared.horn} position={[sx * 0.15, 0.3, -0.04]} rotation-z={-sx * 0.5}>
                <coneGeometry args={[0.04, 0.14, 8]} />
              </mesh>
            ))}
        </group>
      </group>
    </group>
  );
}
