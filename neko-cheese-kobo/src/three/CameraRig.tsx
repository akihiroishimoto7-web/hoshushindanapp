import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { threeRef } from './targets';

/**
 * カメラの「ショット」を指定すると、なめらかに移動する。
 * 縦画面（スマホ）では 視野角を広げ、少し引き、被写体を画面の上寄りに置いて
 * 下の会話ウィンドウと重ならないようにする。
 */
interface Shot {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  /** 1秒あたりの追従の速さ */
  speed: number;
  /** 縦画面で引く量の調整（0 = 引かない, 1 = ふつう） */
  fit: number;
  sway: number;
}

const shot: Shot = {
  pos: new THREE.Vector3(0, 5, 10),
  look: new THREE.Vector3(0, 1, 0),
  speed: 2.2,
  fit: 1,
  sway: 1,
};
let jump = true;

export interface ShotOpts {
  speed?: number;
  immediate?: boolean;
  fit?: number;
  sway?: number;
}

export function setShot(pos: THREE.Vector3Tuple | THREE.Vector3, look: THREE.Vector3Tuple | THREE.Vector3, o: ShotOpts = {}) {
  if (Array.isArray(pos)) shot.pos.set(...pos);
  else shot.pos.copy(pos);
  if (Array.isArray(look)) shot.look.set(...look);
  else shot.look.copy(look);
  shot.speed = o.speed ?? 2.2;
  shot.fit = o.fit ?? 1;
  shot.sway = o.sway ?? 1;
  if (o.immediate) jump = true;
}

/** 毎フレーム 追いかける用（1章の女の子カメラなど） */
export function followShot(pos: THREE.Vector3, look: THREE.Vector3, speed = 3) {
  shot.pos.copy(pos);
  shot.look.copy(look);
  shot.speed = speed;
}

/** 縦画面かどうかと、どれだけ引くか */
export function aspectInfo(aspect: number) {
  const H = THREE.MathUtils.degToRad(58);
  let vfov = 2 * Math.atan(Math.tan(H / 2) / aspect);
  vfov = THREE.MathUtils.clamp(vfov, THREE.MathUtils.degToRad(47), THREE.MathUtils.degToRad(64));
  const need = Math.tan(H / 2) / (Math.tan(vfov / 2) * aspect);
  const factor = Math.pow(Math.max(1, need), 0.72);
  return { vfov: THREE.MathUtils.radToDeg(vfov), factor, portrait: aspect < 0.95 };
}

const curLook = new THREE.Vector3();
const desired = new THREE.Vector3();
const dir = new THREE.Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const info = useRef(aspectInfo(1));

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    info.current = aspectInfo(aspect);
    const { vfov, portrait } = info.current;
    camera.fov = vfov;
    // 縦画面では、写したいものを画面の上 4割くらいの位置に
    const s = portrait ? 0.13 : 0.05;
    const fullH = size.height * (1 + 2 * s);
    camera.aspect = size.width / fullH;
    camera.setViewOffset(size.width, fullH, 0, fullH - size.height, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-shot.speed * Math.min(dt, 0.1));
    const f = 1 + (info.current.factor - 1) * shot.fit;
    dir.subVectors(shot.pos, shot.look).multiplyScalar(f);
    desired.copy(shot.look).add(dir);
    const t = state.clock.elapsedTime;
    const sw = shot.sway * 0.05;
    desired.x += Math.sin(t * 0.35) * sw;
    desired.y += Math.sin(t * 0.5) * sw * 0.6;
    if (jump) {
      camera.position.copy(desired);
      curLook.copy(shot.look);
      jump = false;
    } else {
      camera.position.lerp(desired, k);
      curLook.lerp(shot.look, k);
    }
    camera.lookAt(curLook);
    threeRef.camera = camera;
    threeRef.width = state.size.width;
    threeRef.height = state.size.height;
    threeRef.calls = state.gl.info.render.calls;
    threeRef.tris = state.gl.info.render.triangles;
    threeRef.geos = state.gl.info.memory.geometries;
    threeRef.texs = state.gl.info.memory.textures;
  });

  return null;
}
