import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cheeseTopTex, fiberTex, holesTex, moldTex, speckleTex, veinsTex } from '../tex';

/**
 * いろいろな チーズの 3D モデル。
 * cut を true にすると くさび形に切れて、断面（なか）が見える。
 */
export interface WheelProps {
  radius?: number;
  height?: number;
  rind?: string;
  paste?: string;
  /** 断面の模様 */
  inside?: 'plain' | 'holes' | 'veins' | 'creamy';
  /** しろカビ 0..1 */
  mold?: number;
  mark?: string | null;
  markColor?: string;
  cut?: boolean;
  /** 表面の ざらざら 0..1 */
  rough?: number;
  position?: THREE.Vector3Tuple;
  rotation?: THREE.Vector3Tuple;
  scale?: number | THREE.Vector3Tuple;
  bevel?: boolean;
}

const WEDGE = Math.PI / 3;

export function CheeseWheel({
  radius = 0.6,
  height = 0.4,
  rind = '#e9b949',
  paste = '#f7dc8c',
  inside = 'plain',
  mold = 0,
  mark = null,
  markColor = '#b8741a',
  cut = false,
  rough = 0.5,
  position,
  rotation,
  scale,
}: WheelProps) {
  const wedgeRef = useRef<THREE.Group>(null);
  const cutT = useRef(cut ? 1 : 0);

  // テクスチャは 形と マークごとに 1つ。色は material.color で そめる（熟成で 色が かわっても 作りなおさない）
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({
      map: speckleTex('#ffffff', '#c9a25a', 'rind-speck2', 260),
      roughness: 0.6,
    });
    const top = new THREE.MeshStandardMaterial({
      map: cheeseTopTex('#ffffff', mark, markColor, `top:${mark}:${markColor}`),
      roughness: 0.6,
    });
    const innerMap = inside === 'holes' ? holesTex() : inside === 'veins' ? veinsTex() : speckleTex('#ffffff', '#d9b45a', 'paste-speck', 160);
    // 断面は かげに なりやすいので、すこし 自分で 光らせて 模様（あな・あおカビ）を 見やすく
    const inner = new THREE.MeshStandardMaterial({
      map: innerMap,
      emissiveMap: innerMap,
      emissive: '#ffffff',
      emissiveIntensity: 0.32,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const fuzz = new THREE.MeshStandardMaterial({
      map: moldTex(),
      transparent: true,
      opacity: 0,
      roughness: 1,
      depthWrite: false,
    });
    return { side, top, inner, fuzz };
  }, [inside, mark, markColor]);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  useEffect(() => {
    mats.fuzz.opacity = Math.min(1, mold * 1.1);
    mats.fuzz.visible = mold > 0.01;
    const c = new THREE.Color(rind).lerp(new THREE.Color('#f8f4e8'), Math.min(1, mold));
    mats.side.color.copy(c);
    mats.top.color.copy(c);
    mats.side.roughness = mats.top.roughness = 0.55 + rough * 0.4;
    if (inside === 'plain' || inside === 'creamy') mats.inner.color.set(paste);
    else mats.inner.color.set('#ffffff');
    mats.inner.roughness = inside === 'creamy' ? 0.3 : 0.7;
  }, [mold, mats, rind, paste, rough, inside]);

  const geos = useMemo(() => {
    const body = new THREE.CylinderGeometry(radius, radius, height, 48, 1, false, WEDGE / 2, Math.PI * 2 - WEDGE);
    const full = new THREE.CylinderGeometry(radius, radius, height, 48, 1, false);
    const wedge = new THREE.CylinderGeometry(radius, radius, height, 12, 1, false, -WEDGE / 2, WEDGE);
    const face = new THREE.PlaneGeometry(radius, height);
    face.translate(radius / 2, 0, 0);
    const fuzzGeo = new THREE.CylinderGeometry(radius * 1.015, radius * 1.015, height * 1.02, 48, 1, false);
    return { body, full, wedge, face, fuzzGeo };
  }, [radius, height]);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  useFrame((_, dt) => {
    cutT.current = THREE.MathUtils.lerp(cutT.current, cut ? 1 : 0, 1 - Math.exp(-5 * dt));
    if (wedgeRef.current) {
      const k = cutT.current;
      wedgeRef.current.visible = k > 0.02;
      wedgeRef.current.position.set(0, 0, k * radius * 0.45);
      wedgeRef.current.rotation.y = 0;
    }
  });

  // 面の角度（Cylinder の theta=0 は +z 方向）
  const a0 = WEDGE / 2;
  const a1 = -WEDGE / 2;
  const faceRot = (a: number) => a - Math.PI / 2;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 切ってないとき */}
      {!cut && <mesh geometry={geos.full} material={[mats.side, mats.top, mats.top]} />}
      {cut && (
        <>
          <mesh geometry={geos.body} material={[mats.side, mats.top, mats.top]} />
          <mesh geometry={geos.face} material={mats.inner} rotation-y={faceRot(a0)} />
          <mesh geometry={geos.face} material={mats.inner} rotation-y={faceRot(a1)} />
          <group ref={wedgeRef}>
            <mesh geometry={geos.wedge} material={[mats.side, mats.top, mats.top]} />
            <mesh geometry={geos.face} material={mats.inner} rotation-y={faceRot(a0)} />
            <mesh geometry={geos.face} material={mats.inner} rotation-y={faceRot(a1)} />
          </group>
        </>
      )}
      {mold > 0.01 && !cut && <mesh geometry={geos.fuzzGeo} material={mats.fuzz} />}
    </group>
  );
}

/** モッツァレラ（まるくて しろい、みずみずしい） */
export function Mozzarella({ r = 0.35, cut = false, position, scale }: { r?: number; cut?: boolean; position?: THREE.Vector3Tuple; scale?: number }) {
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.18, metalness: 0 }),
      inner: new THREE.MeshStandardMaterial({ map: fiberTex(), roughness: 0.4, side: THREE.DoubleSide }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return (
    <group position={position} scale={scale}>
      {!cut && (
        <mesh material={mats.skin} scale={[1, 0.9, 1]}>
          <sphereGeometry args={[r, 32, 24]} />
        </mesh>
      )}
      {cut &&
        [-1, 1].map((side) => (
          // ふたつに わって、 どちらも 断面（すじ）が こちらを むくように ならべる
          <group key={side} position-x={side * r * 1.08} rotation-y={side * -0.3}>
            <mesh material={mats.skin} scale={[1, 0.9, 1]} rotation-x={-Math.PI / 2}>
              <sphereGeometry args={[r, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh material={mats.inner} scale={[1, 0.9, 1]}>
              <circleGeometry args={[r, 32]} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

/** チェダー（ブロック） */
export function CheeseBlock({
  size = [0.9, 0.5, 0.6],
  color = '#f29b30',
  cut = false,
  position,
  rotation,
  scale,
}: {
  size?: THREE.Vector3Tuple;
  color?: string;
  cut?: boolean;
  position?: THREE.Vector3Tuple;
  rotation?: THREE.Vector3Tuple;
  scale?: number;
}) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, map: speckleTex('#ffffff', '#b06a10', 'block-speck', 300), roughness: 0.65 }),
    [color],
  );
  const inner = useMemo(
    () => new THREE.MeshStandardMaterial({ color, map: speckleTex('#ffffff', '#e0a040', 'block-in', 120), roughness: 0.75 }),
    [color],
  );
  useEffect(() => () => {
    mat.dispose();
    inner.dispose();
  }, [mat, inner]);
  const [w, h, d] = size;
  const slice = w * 0.22;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {!cut && (
        <mesh material={mat}>
          <boxGeometry args={size} />
        </mesh>
      )}
      {cut && (
        <>
          <mesh material={[inner, mat, mat, mat, mat, mat]} position-x={-slice / 2}>
            <boxGeometry args={[w - slice, h, d]} />
          </mesh>
          <mesh material={[inner, inner, mat, mat, mat, mat]} position-x={w / 2 + 0.12} rotation-z={-0.15}>
            <boxGeometry args={[slice * 0.8, h, d]} />
          </mesh>
        </>
      )}
    </group>
  );
}
