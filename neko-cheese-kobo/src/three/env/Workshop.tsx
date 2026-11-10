import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { plasterTex, woodTex } from '../tex';
import { BlobShadow, Glow, Motes } from '../common';
import { SunShadow } from '../realism';
import { CheeseWheel } from '../props/Cheese';

/**
 * チーズ工房の へや（2〜4章で共通）。
 * あたたかい木の床、しっくいの壁、まどから さしこむ光。
 */
export function WorkshopLights() {
  return (
    <>
      <hemisphereLight args={['#fff4e0', '#b88a5a', 0.6]} />
      <SunShadow position={[-5, 9, 6]} intensity={2.9} color="#ffeccc" range={8} />
      <pointLight position={[0, 4.2, 1]} intensity={5} distance={12} decay={2} color="#ffd9a0" />
      {/* 金属の映りこみ用（最初の1回だけ描く軽い環境マップ） */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#fff3dc" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe2b0" position={[-5, 2, 3]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={1} color="#d6ecff" position={[5, 2, -3]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#c58b52" position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

export function WorkshopRoom({ children }: { children?: ReactNode }) {
  const floor = useMemo(() => {
    const t = woodTex('#d29a62', '#9c6534', 'floor', 8).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const wall = plasterTex('#fdf0d8', 'wall');
  const beam = '#8c5b32';
  const shafts = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!shafts.current) return;
    shafts.current.children.forEach((c, i) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.11 + Math.sin(st.clock.elapsedTime * 0.6 + i) * 0.03;
    });
  });
  return (
    <group>
      {/* 床 */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial map={floor} roughness={0.85} />
      </mesh>
      {/* ラグ */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 1.6]}>
        <circleGeometry args={[2.6, 40]} />
        <meshStandardMaterial color="#e9a17a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 1.6]}>
        <ringGeometry args={[2.0, 2.25, 40]} />
        <meshStandardMaterial color="#fff1d6" roughness={1} />
      </mesh>
      {/* 壁 */}
      <mesh position={[0, 3, -5]}>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      <mesh position={[-8, 3, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      <mesh position={[8, 3, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.25, -4.95]}>
        <boxGeometry args={[18, 0.5, 0.1]} />
        <meshStandardMaterial color={beam} roughness={0.8} />
      </mesh>
      {/* はり */}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 5.6, 0]}>
          <boxGeometry args={[0.35, 0.35, 14]} />
          <meshStandardMaterial color={beam} roughness={0.8} />
        </mesh>
      ))}
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 2.8, -4.85]}>
          <boxGeometry args={[0.35, 5.6, 0.3]} />
          <meshStandardMaterial color={beam} roughness={0.8} />
        </mesh>
      ))}
      {/* まど */}
      {[-3, 3].map((x) => (
        <group key={x} position={[x, 3.3, -4.93]}>
          <mesh>
            <boxGeometry args={[2, 2.2, 0.1]} />
            <meshStandardMaterial color={beam} />
          </mesh>
          <mesh position-z={0.06}>
            <planeGeometry args={[1.7, 1.9]} />
            <meshBasicMaterial color="#d9f1ff" />
          </mesh>
          <mesh position-z={0.08}>
            <boxGeometry args={[0.08, 1.9, 0.04]} />
            <meshStandardMaterial color={beam} />
          </mesh>
          <mesh position-z={0.08}>
            <boxGeometry args={[1.7, 0.08, 0.04]} />
            <meshStandardMaterial color={beam} />
          </mesh>
          {/* 植木ばち */}
          <mesh position={[0, -1.15, 0.25]}>
            <cylinderGeometry args={[0.22, 0.17, 0.3, 12]} />
            <meshStandardMaterial color="#d9734f" />
          </mesh>
          <mesh position={[0, -0.85, 0.25]}>
            <icosahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial color="#6cc070" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <group ref={shafts}>
        {[-3, 3].map((x) => (
          <mesh key={x} position={[x + 0.9, 2.2, -2.6]} rotation={[-0.55, 0, 0.2]}>
            <planeGeometry args={[1.8, 6]} />
            <meshBasicMaterial color="#fff6d0" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {/* 棚と チーズ */}
      <Shelf position={[-6.4, 0, -3.6]} rotationY={0.5} />
      <Shelf position={[6.4, 0, -3.6]} rotationY={-0.5} />
      {/* つりさげランプ */}
      {[-2, 2].map((x) => (
        <group key={x} position={[x, 4.6, 1]}>
          <mesh position-y={0.5}>
            <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
            <meshBasicMaterial color="#5a3a1a" />
          </mesh>
          <mesh>
            <coneGeometry args={[0.45, 0.4, 16, 1, true]} />
            <meshStandardMaterial color="#e8604c" side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={-0.12}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshBasicMaterial color="#fff2c4" />
          </mesh>
        </group>
      ))}
      {[-3, 3].map((x) => (
        <Glow key={'w' + x} position={[x, 3.3, -4.7]} size={3.6} color="#fff3d0" opacity={0.45} />
      ))}
      {[-2, 2].map((x) => (
        <Glow key={'l' + x} position={[x, 4.45, 1]} size={1.5} color="#ffd890" opacity={0.7} pulse={0.05} />
      ))}
      <Motes count={50} area={[8, 3.5, 5]} center={[0, 2.8, -1.5]} color="#fff3c8" size={0.07} opacity={0.55} />
      {children}
    </group>
  );
}

function Shelf({ position, rotationY }: { position: THREE.Vector3Tuple; rotationY: number }) {
  const wood = woodTex('#b97a45', '#8c5b32', 'shelf', 3);
  return (
    <group position={position} rotation-y={rotationY}>
      <BlobShadow size={3} opacity={0.2} />
      {[0.5, 1.5, 2.5].map((y) => (
        <mesh key={y} position-y={y}>
          <boxGeometry args={[2.4, 0.08, 0.8]} />
          <meshStandardMaterial map={wood} />
        </mesh>
      ))}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.1, 3, 0.8]} />
          <meshStandardMaterial map={wood} />
        </mesh>
      ))}
      {[-0.6, 0.1, 0.75].map((x, i) => (
        <CheeseWheel key={'a' + i} radius={0.3} height={0.22} position={[x, 0.65, 0]} rind={['#e9b949', '#d99b3a', '#f2d27a'][i]} />
      ))}
      {[-0.5, 0.5].map((x, i) => (
        <CheeseWheel key={'b' + i} radius={0.36} height={0.28} position={[x, 1.68, 0]} rind={['#c98a3a', '#e9b949'][i]} />
      ))}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={'j' + i} position={[x, 2.75, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.42, 14]} />
          <meshStandardMaterial color={['#ffd9a0', '#c9e8ff', '#ffc2cf'][i]} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------- チーズなべ ----------------
export const VAT = { r: 1.42, bottom: 0.78, top: 1.98 };

const steel = new THREE.MeshStandardMaterial({ color: '#dfe5ea', metalness: 0.85, roughness: 0.22 });
const steelIn = new THREE.MeshStandardMaterial({ color: '#c9d1d8', metalness: 0.8, roughness: 0.3, side: THREE.BackSide });
const copper = new THREE.MeshStandardMaterial({ color: '#d9895a', metalness: 0.8, roughness: 0.3 });

/** 大きな なべ（二重かべの チーズバット）。中身は children で入れる */
export function Vat({ children, valveRef, onValve }: { children?: ReactNode; valveRef?: (o: THREE.Object3D | null) => void; onValve?: () => void }) {
  return (
    <group>
      <BlobShadow size={4.2} opacity={0.3} />
      {/* あし */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} material={steel} position={[Math.cos(a) * 1.2, 0.4, Math.sin(a) * 1.2]}>
            <cylinderGeometry args={[0.07, 0.09, 0.8, 8]} />
          </mesh>
        );
      })}
      {/* 外がわ */}
      <mesh material={copper} position-y={1.4}>
        <cylinderGeometry args={[1.6, 1.5, 1.2, 40, 1, true]} />
      </mesh>
      <mesh material={copper} position-y={0.8}>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 40]} />
      </mesh>
      {/* 内がわ */}
      <mesh material={steelIn} position-y={1.4}>
        <cylinderGeometry args={[VAT.r, VAT.r, 1.2, 40, 1, true]} />
      </mesh>
      <mesh material={steel} position-y={VAT.bottom + 0.01} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[VAT.r, 40]} />
      </mesh>
      {/* ふち */}
      <mesh material={steel} position-y={VAT.top} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.51, 0.09, 10, 48]} />
      </mesh>
      {/* 帯 */}
      {[1.1, 1.7].map((y) => (
        <mesh key={y} material={steel} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.58, 0.03, 6, 48]} />
        </mesh>
      ))}
      {/* せん（ホエイを ぬく） */}
      <group
        ref={valveRef}
        position={[1.15, 1.0, 1.15]}
        rotation-y={Math.PI / 4}
        onClick={
          onValve
            ? (e) => {
                e.stopPropagation();
                if (e.delta > 14) return;
                onValve();
              }
            : undefined
        }
      >
        <mesh material={steel} rotation-x={Math.PI / 2} position-z={0.25}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 10]} />
        </mesh>
        {onValve && (
          <mesh position={[0, 0.1, 0.4]}>
            <sphereGeometry args={[0.42, 10, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
        <mesh position={[0, 0.16, 0.38]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial color="#e8604c" />
        </mesh>
        <mesh position={[0, 0.27, 0.38]} rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.25, 4, 8]} />
          <meshStandardMaterial color="#e8604c" />
        </mesh>
        <mesh position={[0, -0.08, 0.5]}>
          <cylinderGeometry args={[0.07, 0.05, 0.12, 10]} />
          <meshStandardMaterial color="#aeb5bd" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {children}
    </group>
  );
}

/** 同心円の円盤（なみを立てるため、中も細かく分割） */
export function makeDisc(r: number, rings = 22, segs = 56) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  pos.push(0, 0, 0);
  uv.push(0.5, 0.5);
  for (let i = 1; i <= rings; i++) {
    const rr = (i / rings) * r;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      uv.push(0.5 + (Math.cos(a) * rr) / (2 * r), 0.5 + (Math.sin(a) * rr) / (2 * r));
    }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a0 = 1 + (i - 1) * segs;
    const b0 = 1 + i * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      idx.push(a0 + j, a0 + j1, b0 + j);
      idx.push(a0 + j1, b0 + j1, b0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** 温度計（なべに さしてある） */
export function Thermometer({ temp }: { temp: React.RefObject<number> }) {
  const col = useRef<THREE.Mesh>(null);
  const needle = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = THREE.MathUtils.clamp((temp.current - 10) / 40, 0, 1);
    if (col.current) {
      col.current.scale.y = Math.max(0.02, k);
      col.current.position.y = -0.5 + k * 0.5;
    }
    if (needle.current) needle.current.rotation.z = Math.PI * 0.75 - k * Math.PI * 1.5;
  });
  return (
    <group>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
        <meshStandardMaterial color="#dfe5ea" metalness={0.8} roughness={0.25} />
      </mesh>
      <group position-y={1.25} rotation-x={-0.25}>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.32, 0.32, 0.08, 28]} />
          <meshStandardMaterial color="#dfe5ea" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position-z={0.045}>
          <circleGeometry args={[0.28, 28]} />
          <meshBasicMaterial color="#fffdf5" />
        </mesh>
        {/* みどりの はんい（30〜34ど） */}
        <mesh position-z={0.05}>
          <ringGeometry args={[0.17, 0.26, 24, 1, Math.PI * 0.35, Math.PI * 0.15]} />
          <meshBasicMaterial color="#6cc070" />
        </mesh>
        <group ref={needle} position-z={0.06}>
          <mesh position-y={0.11}>
            <boxGeometry args={[0.025, 0.22, 0.01]} />
            <meshBasicMaterial color="#e2574c" />
          </mesh>
        </group>
        <mesh position-z={0.065}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#5a3a1a" />
        </mesh>
        <mesh ref={col} visible={false}>
          <boxGeometry args={[0.01, 1, 0.01]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  );
}
