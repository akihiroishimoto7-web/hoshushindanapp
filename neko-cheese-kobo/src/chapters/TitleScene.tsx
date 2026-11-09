import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { setShot } from '../three/CameraRig';
import { SkyDome } from '../three/common';
import { Clouds, FarmLights, Flowers, Ground, Grass, Trees, Windmill, CatHouse, Birds } from '../three/env/Farm';
import { MilkCat } from '../three/characters/MilkCat';
import { Cow } from '../three/characters/Cow';
import { CheeseWheel } from '../three/props/Cheese';
import { catFace, catGesture } from '../game/dialog';

const TREES: [number, number, number][] = [
  [-9, -8, 1.1],
  [9, -10, 1.3],
  [-14, 2, 1],
  [13, 1, 1.2],
];

/** タイトル画面: チーズの上で ミルクが手をふる */
export function TitleScene() {
  const cheese = useRef<THREE.Group>(null);
  useEffect(() => {
    setShot([0, 2.4, 7.2], [0, 1.6, 0], { immediate: true, fit: 0.8 });
    catFace('happy');
    const id = setInterval(() => catGesture(Math.random() < 0.7 ? 'wave' : 'jump'), 3800);
    const t = setTimeout(() => catGesture('wave'), 600);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, []);
  useFrame((st) => {
    if (cheese.current) cheese.current.rotation.y = st.clock.elapsedTime * 0.25;
  });
  return (
    <>
      <FarmLights />
      <SkyDome />
      <Clouds />
      <Ground />
      <Grass count={260} />
      <Flowers count={60} />
      <Trees spots={TREES} />
      <Windmill position={[-10, 0, -16]} />
      <CatHouse position={[11, -20]} rotationY={-0.4} />
      <CatHouse position={[17, -14]} wall="#e0f1ff" roof="#6cb8f0" rotationY={-0.9} />
      <Birds />
      <Cow position={[-4.2, 0, -3]} rotationY={0.7} seed={1} />
      <Cow kind="jersey" position={[4.5, 0, -4.5]} rotationY={-0.6} seed={3} />
      <group ref={cheese}>
        <CheeseWheel radius={1.3} height={0.9} position={[0, 0.45, 0]} mark="paw" cut />
      </group>
      <MilkCat position={[0, 0.9, 0.1]} scale={1.15} />
    </>
  );
}
