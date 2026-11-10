import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { script } from './script';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog, useDialog, catGesture } from '../../game/dialog';
import { say } from '../../game/say';
import { useProgress } from '../../game/progress';
import { cheeseLook, curdSizeFromCuts, decideType, MARK_COLOR } from '../../game/cheese';
import type { CheeseMark, CheeseResult, CheeseType } from '../../game/types';
import { setShot } from '../../three/CameraRig';
import { RewardRays, Tappable } from '../../three/common';
import { BirdBody, Mouse, WindowPeek } from '../../three/props/Secrets';
import { fx } from '../../three/fx';
import { useTarget } from '../../three/targets';
import { Vat, VAT, WorkshopLights, WorkshopRoom } from '../../three/env/Workshop';
import { MilkCat } from '../../three/characters/MilkCat';
import { Table } from '../../three/props/Kitchen';
import { Jar, VatSurface, type Ripple } from '../../three/props/Dairy';
import { CheeseWheel } from '../../three/props/Cheese';
import { speckleTex, rng } from '../../three/tex';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';

const R = VAT.r - 0.05;
const SURF_Y = VAT.bottom + 0.02 + 0.78 * (VAT.top - VAT.bottom - 0.2);
const MOLD_T: THREE.Vector3Tuple = [1.55, 0, 2.25];
const MOLD_Y = 0.79;
const SHOTS: Record<string, [THREE.Vector3Tuple, THREE.Vector3Tuple, number]> = {
  top: [[0, 5.4, 2.8], [0, 1.5, 0.1], 0.75],
  vat: [[0.4, 4.7, 6.6], [0, 1.4, 0.2], 0.85],
  mold: [[0.7, 3.5, 6.6], [1.45, 1.05, 2.0], 0.7],
};
const WHEY = '#e6e39a';

interface Cut {
  axis: 'x' | 'z';
  c: number;
}
interface Cube {
  a: number;
  r: number;
  y: number;
  rot: THREE.Euler;
  gone: boolean;
  cy?: number;
}

export default function MakerScene() {
  useChapterStart(script);
  const clock = useRef(0);
  const [mode, setMode] = useState<'cut' | 'stir' | 'none'>('none');
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [stage, setStage] = useState<'whole' | 'cubes' | 'drained' | 'molded'>('whole');
  const [fill, setFill] = useState(0);
  const [pressUI, setPressUI] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [cheese, setCheese] = useState<{ type: CheeseType; mark: CheeseMark | null } | null>(null);
  const level = useRef(0.78);
  const curd = useRef(1);
  const ripples = useRef<Ripple[]>([]);
  const whey = useRef(0.0);
  const draining = useRef(false);
  const stirAngle = useRef(0);
  const stirTotal = useRef(0);
  const omega = useRef(0);
  const shrink = useRef(1);
  const press = useRef({ holding: false, power: 0, plate: 0 });
  const pressed = useRef<boolean | null>(null);
  const flip = useRef(-1);
  const salt = useRef(0);
  const lift = useRef(0);
  const pointer = useRef(new THREE.Vector3());
  const down = useRef<THREE.Vector3 | null>(null);
  const tool = useRef<THREE.Group>(null);
  const toolOn = useRef(false);

  const curdRef = useTarget('curd');
  const valveRef = useTarget('valve');
  const moldRef = useTarget('mold');
  const saltRef = useTarget('salt');

  const counts = useMemo(() => {
    const nx = cuts.filter((c) => c.axis === 'x').length;
    const nz = cuts.length - nx;
    return { nx, nz, ...curdSizeFromCuts(nx, nz, R) };
  }, [cuts]);

  // カードの さいころ
  const cubeSize = THREE.MathUtils.clamp(counts.d * 0.5, 0.17, 0.5);
  const cubes = useMemo<Cube[]>(() => {
    if (stage === 'whole') return [];
    const r = rng(cuts.length * 7 + 3);
    const n = THREE.MathUtils.clamp(Math.round(((Math.PI * R * R) / (counts.d * counts.d)) * 0.45), 14, 90);
    return Array.from({ length: n }, () => ({
      a: r() * Math.PI * 2,
      r: Math.sqrt(r()) * (R - cubeSize),
      y: r(),
      rot: new THREE.Euler(r() * 0.5, r() * 6, r() * 0.5),
      gone: false,
    }));
    // stage が 'cubes' に なった ときだけ つくる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage === 'whole']);

  useLayoutEffect(() => {
    const s = SHOTS.vat;
    setShot(s[0], s[1], { immediate: true, fit: s[2] });
  }, []);
  const shot = (n: string) => {
    const s = SHOTS[n];
    setShot(s[0], s[1], { fit: s[2] });
  };
  useBus('cam:top', () => shot('top'));
  useBus('cam:vat', () => shot('vat'));
  useBus('cam:mold', () => shot('mold'));
  useBus('task', (id) => {
    setMode(id === 'cut' ? 'cut' : id === 'stir' ? 'stir' : 'none');
    if (id === 'cut' || id === 'stir') shot('top');
    if (id === 'stir') {
      setStage('cubes');
      whey.current = Math.max(whey.current, 0.42);
    }
    if (id === 'mold' || id === 'salt') shot('mold');
    if (id === 'press') {
      setPressUI(true);
      pressed.current = true;
    }
    if (id === 'drain') shot('vat');
  });
  useBus('flip', () => {
    pressed.current = false;
    flip.current = clock.current;
    playSfx('whoosh');
  });
  useBus('unmold', () => {
    const type = decideType(counts.size, Boolean(pressed.current), press.current.power);
    dialog.setVar('pressType', type);
    setCheese({ type, mark: null });
    setPressUI(false);
    lift.current = 0.001;
    setTimeout(() => {
      setRevealed(true);
      catGesture('cheer');
      setShot([1.0, 2.5, 5.0], [1.5, 1.15, 2.2], { fit: 0.6, speed: 1.5 });
      fx.burst([MOLD_T[0], MOLD_Y + 0.6, MOLD_T[2]], { star: true, count: 26, color: ['#ffd34d', '#ffffff', '#ff8fa3'], speed: 2.5, gravity: 0.8, life: 1.3, size: 0.4 });
    }, 700);
  });
  useBus('saveCheese', () => {
    const idx = (useDialog.getState().vars.mark as number | undefined) ?? 0;
    const mark: CheeseMark = (['paw', 'star', 'heart'] as const)[idx] ?? 'paw';
    const type = decideType(counts.size, Boolean(pressed.current), press.current.power);
    const result: CheeseResult = {
      curdSize: counts.size,
      cuts: cuts.length,
      pressed: Boolean(pressed.current),
      pressPower: press.current.power,
      salt: salt.current,
      type,
      mark,
      agedDays: 0,
    };
    useProgress.getState().setCheese(result);
    setCheese({ type, mark });
    fx.burst([MOLD_T[0], MOLD_Y + 0.6, MOLD_T[2]], { star: true, count: 16, color: [MARK_COLOR[mark], '#ffffff'], speed: 2, gravity: 0.5, life: 1, size: 0.35 });
  });

  // ---- ゆびの そうさ（切る・まぜる）----
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -SURF_Y), []);
  const hit = (e: ThreeEvent<PointerEvent>) => {
    const p = new THREE.Vector3();
    if (!e.ray.intersectPlane(plane, p)) return null;
    return p;
  };
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (mode === 'none') return;
    e.stopPropagation();
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
    const p = hit(e);
    if (!p) return;
    down.current = p.clone();
    pointer.current.copy(p);
    stirAngle.current = Math.atan2(p.z, p.x);
    toolOn.current = true;
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!down.current) return;
    const p = hit(e);
    if (!p) return;
    pointer.current.copy(p);
    if (mode === 'stir' && Math.hypot(p.x, p.z) > 0.25) {
      const a = Math.atan2(p.z, p.x);
      let d = a - stirAngle.current;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      stirAngle.current = a;
      if (Math.abs(d) < 1.2) {
        stirTotal.current += Math.abs(d);
        omega.current = THREE.MathUtils.clamp(omega.current + d * 2.2, -4, 4);
        shrink.current = Math.max(0.82, 1 - stirTotal.current * 0.012);
        whey.current = Math.min(0.62, 0.42 + stirTotal.current * 0.014);
        const goal = Math.PI * 4;
        const left = Math.max(0, Math.ceil(((goal - stirTotal.current) / goal) * 100));
        dialog.setProgress(left > 0 ? `${100 - left}%` : undefined);
        if (stirTotal.current >= goal && dialog.isTask('stir')) {
          playSfx('success');
          dialog.completeTask('stir');
          down.current = null;
          toolOn.current = false;
        }
        if (Math.random() < 0.08) playSfx('bubble');
      }
    }
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    const start = down.current;
    down.current = null;
    toolOn.current = false;
    if (!start || mode !== 'cut') return;
    const p = hit(e) ?? pointer.current;
    const dx = p.x - start.x;
    const dz = p.z - start.z;
    if (Math.hypot(dx, dz) < 0.7) return;
    const axis: 'x' | 'z' = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z';
    const c = THREE.MathUtils.clamp(axis === 'x' ? (start.z + p.z) / 2 : (start.x + p.x) / 2, -R + 0.15, R - 0.15);
    addCut(axis, c);
  };
  const addCut = (axis: 'x' | 'z', c: number) => {
    setCuts((prev) => {
      const same = prev.filter((k) => k.axis === axis);
      if (same.length >= 7 || same.some((k) => Math.abs(k.c - c) < 0.14)) return prev;
      const next = [...prev, { axis, c }];
      const nx = next.filter((k) => k.axis === 'x').length;
      const info = curdSizeFromCuts(nx, next.length - nx, R);
      const before = curdSizeFromCuts(prev.filter((k) => k.axis === 'x').length, prev.filter((k) => k.axis === 'z').length, R);
      dialog.setVar('curdSize', info.size);
      if (next.length === 1) setTimeout(() => dialog.side(say('スパッ！ きった ところから、 みずが しみでて きたよ。 これが ホエイ。', 'surprised')), 300);
      else if (info.size === 'small' && before.size !== 'small')
        setTimeout(() => dialog.side(say('こまかく きるほど ホエイが たくさん でて、 かたい チーズに なるんだ。', 'excited')), 300);
      return next;
    });
    playSfx('cut');
    ripples.current.push({ x: axis === 'z' ? c : 0, z: axis === 'x' ? c : 0, t0: clock.current, amp: 0.05 });
    fx.burst([axis === 'z' ? c : 0, SURF_Y + 0.05, axis === 'x' ? c : 0], { count: 8, color: [WHEY, '#ffffff'], speed: 1.2, gravity: 3, life: 0.6, size: 0.2 });
  };

  // ---- 型づめ ----
  const fliers = useRef<{ from: THREE.Vector3; t: number }[]>([]);
  const scoop = () => {
    if (!dialog.isTask('mold')) {
      if (stage !== 'molded') dialog.side(say('あなの あいた チーズの かた。 ここに カードを つめるよ。'));
      return;
    }
    if (fill >= 1) return;
    playSfx('pop');
    catGesture('stir');
    const live = cubes.filter((c) => !c.gone);
    const take = Math.ceil(cubes.length / 4);
    for (let i = 0; i < take && i < live.length; i++) {
      const c = live[i];
      c.gone = true;
      fliers.current.push({ from: new THREE.Vector3(Math.cos(c.a) * c.r, VAT.bottom + 0.2, Math.sin(c.a) * c.r), t: -i * 0.04 });
    }
    const nf = Math.min(1, fill + 0.25);
    setTimeout(() => {
      setFill(nf);
      playSfx('squish');
      if (nf >= 1) {
        setStage('molded');
        dialog.completeTask('mold');
      }
    }, 650);
  };

  const shakeSalt = () => {
    if (!dialog.isTask('salt')) {
      dialog.side(say('しお。 チーズの さいごの しあげに つかうよ。'));
      return;
    }
    salt.current++;
    playSfx('shake');
    fx.burst([MOLD_T[0], MOLD_Y + 1.3, MOLD_T[2]], { count: 26, color: ['#ffffff', '#eef6ff'], speed: 0.8, gravity: 5, life: 0.7, size: 0.12, spread: 0.4 });
    const left = 3 - salt.current;
    dialog.setProgress(left > 0 ? `あと ${left}` : undefined);
    if (left <= 0) setTimeout(() => dialog.completeTask('salt'), 700);
  };

  const openValve = () => {
    if (!dialog.isTask('drain')) {
      dialog.side(say('この せんを あけると、 なべの ホエイが ぬけるよ。'));
      return;
    }
    if (draining.current) return;
    draining.current = true;
    playSfx('pour');
    setTimeout(() => {
      setStage('drained');
      dialog.completeTask('drain');
    }, 2600);
  };

  // ---- 毎フレーム ----
  const cubeMesh = useRef<THREE.InstancedMesh>(null);
  const flyMesh = useRef<THREE.InstancedMesh>(null);
  const wheyMesh = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const plate = useRef<THREE.Group>(null);
  const moldGroup = useRef<THREE.Group>(null);
  const hoop = useRef<THREE.Group>(null);
  const fillMesh = useRef<THREE.Mesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((st, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const t = st.clock.elapsedTime;
    clock.current = t;
    if (draining.current) whey.current = Math.max(0.03, whey.current - dt * 0.24);
    omega.current *= Math.exp(-1.5 * dt);
    const wy = VAT.bottom + 0.02 + whey.current * (VAT.top - VAT.bottom - 0.2);
    if (wheyMesh.current) {
      wheyMesh.current.visible = stage !== 'whole' && whey.current > 0.04;
      wheyMesh.current.position.y = wy;
    }
    if (stream.current) stream.current.visible = draining.current && whey.current > 0.05;
    // さいころ
    const m = cubeMesh.current;
    if (m) {
      cubes.forEach((c, i) => {
        c.a += omega.current * dt * (0.6 + 0.4 * (1 - c.r / R));
        const s = cubeSize * shrink.current;
        const floatY = wy - s * 0.25 + Math.sin(t * 2 + i) * 0.02;
        const bottomY = VAT.bottom + s / 2 + (c.y < 0.5 ? 0 : s * 0.85);
        const ty = Math.max(bottomY, floatY);
        c.cy = c.cy === undefined ? ty : THREE.MathUtils.lerp(c.cy, ty, 0.1);
        o.position.set(Math.cos(c.a) * c.r, c.cy, Math.sin(c.a) * c.r);
        o.rotation.copy(c.rot);
        o.rotation.y += c.a;
        o.scale.setScalar(c.gone ? 0 : s);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
    // とんでいく カード
    const fm = flyMesh.current;
    if (fm) {
      const target = new THREE.Vector3(MOLD_T[0], MOLD_Y + 0.4, MOLD_T[2]);
      for (let i = 0; i < 24; i++) {
        const f = fliers.current[i];
        if (!f || f.t >= 1) {
          o.scale.setScalar(0);
        } else {
          f.t += dt / 0.6;
          const k = THREE.MathUtils.clamp(f.t, 0, 1);
          o.position.lerpVectors(f.from, target, k);
          o.position.y += Math.sin(k * Math.PI) * 1.4;
          o.scale.setScalar(f.t < 0 ? 0 : cubeSize * shrink.current);
          o.rotation.set(t * 5, t * 3, 0);
        }
        o.updateMatrix();
        fm.setMatrixAt(i, o.matrix);
      }
      fliers.current = fliers.current.filter((f) => f.t < 1);
      fm.instanceMatrix.needsUpdate = true;
    }
    // おしぶた
    const pr = press.current;
    if (pr.holding) {
      pr.power = Math.min(1, pr.power + dt / 3);
      if (Math.random() < dt * 10) fx.burst([MOLD_T[0] + (Math.random() - 0.5) * 0.9, MOLD_Y + 0.05, MOLD_T[2] + (Math.random() - 0.5) * 0.9], { count: 1, color: WHEY, speed: 0.3, gravity: 3, life: 0.5, size: 0.16 });
    }
    const squash = 1 - pr.power * 0.3;
    pr.plate = THREE.MathUtils.lerp(pr.plate, pressUI || pressed.current ? squash : 1.6, 0.1);
    if (plate.current) plate.current.position.y = 0.06 + 0.78 * Math.min(pr.plate, 1.6);
    if (fillMesh.current) {
      const h = Math.max(0.001, fill * 0.78 * (pressed.current ? squash : 1));
      fillMesh.current.scale.y = h;
      fillMesh.current.position.y = h / 2 + 0.02;
      fillMesh.current.visible = fill > 0 && !revealed;
    }
    if (moldGroup.current) {
      const k = flip.current > 0 ? THREE.MathUtils.clamp((t - flip.current) / 2, 0, 1) : 0;
      moldGroup.current.rotation.x = k * Math.PI * 2;
      moldGroup.current.position.y = Math.sin(k * Math.PI) * 0.6;
    }
    if (hoop.current && lift.current > 0) {
      lift.current = Math.min(1, lift.current + dt * 1.4);
      hoop.current.position.y = lift.current * 1.2;
      hoop.current.scale.setScalar(Math.max(0.001, 1 - Math.max(0, lift.current - 0.5) * 2));
      hoop.current.visible = lift.current < 0.99;
    }
    // ナイフ・へら
    if (tool.current) {
      tool.current.visible = toolOn.current && mode !== 'none';
      tool.current.position.lerp(new THREE.Vector3(pointer.current.x, SURF_Y + 0.25, pointer.current.z), 0.5);
      if (down.current && mode === 'cut') {
        const dx = pointer.current.x - down.current.x;
        const dz = pointer.current.z - down.current.z;
        tool.current.rotation.y = Math.abs(dx) > Math.abs(dz) ? 0 : Math.PI / 2;
      } else tool.current.rotation.y = t * 2;
    }
  });

  const curdMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbefc6', map: speckleTex('#ffffff', '#e8cf8a', 'curd-speck', 220), roughness: 0.55 }), []);
  useEffect(() => () => curdMat.dispose(), [curdMat]);
  const look = cheese ? cheeseLook(cheese.type) : null;

  return (
    <>
      <WorkshopLights />
      <color attach="background" args={['#fdf0d8']} />
      <WorkshopRoom />
      <Vat valveRef={valveRef} onValve={openValve}>
        {stage === 'whole' && <VatSurface level={level} curd={curd} ripples={ripples} surfaceRef={curdRef} />}
        {stage !== 'whole' && <group ref={curdRef} position={[0, SURF_Y - 0.2, 0]} />}
        {/* きりこみ */}
        {stage === 'whole' &&
          cuts.map((c, i) => {
            const L = 2 * Math.sqrt(Math.max(0, R * R - c.c * c.c));
            return (
              <mesh key={i} position={c.axis === 'x' ? [0, SURF_Y + 0.01, c.c] : [c.c, SURF_Y + 0.01, 0]}>
                <boxGeometry args={c.axis === 'x' ? [L, 0.03, 0.045] : [0.045, 0.03, L]} />
                <meshStandardMaterial color={WHEY} roughness={0.2} />
              </mesh>
            );
          })}
        {/* ホエイ */}
        <mesh ref={wheyMesh} rotation-x={-Math.PI / 2} visible={false}>
          <circleGeometry args={[VAT.r - 0.02, 48]} />
          <meshStandardMaterial color={WHEY} transparent opacity={0.82} roughness={0.15} />
        </mesh>
        {stage !== 'whole' && (
          <instancedMesh ref={cubeMesh} args={[undefined, undefined, cubes.length]} material={curdMat} frustumCulled={false} key={cubes.length}>
            <boxGeometry args={[1, 1, 1]} />
          </instancedMesh>
        )}
        {/* ゆびの うけとめ */}
        <mesh position-y={SURF_Y} rotation-x={-Math.PI / 2} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
          <circleGeometry args={[VAT.r + 0.3, 32]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <group ref={tool} visible={false}>
          {mode === 'cut' ? (
            <group>
              <mesh>
                <boxGeometry args={[1.0, 0.32, 0.03]} />
                <meshStandardMaterial color="#dfe5ea" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.08]} />
                <meshStandardMaterial color="#b0603a" />
              </mesh>
            </group>
          ) : (
            <group rotation-z={0.2}>
              <mesh position-y={0.4}>
                <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
                <meshStandardMaterial color="#c58b52" />
              </mesh>
              <mesh position-y={-0.15} scale={[1, 0.3, 1]}>
                <sphereGeometry args={[0.18, 12, 8]} />
                <meshStandardMaterial color="#c58b52" />
              </mesh>
            </group>
          )}
        </group>
        {/* ホエイの ながれ と バケツ */}
        <mesh ref={stream} position={[1.5, 0.62, 1.5]} visible={false}>
          <cylinderGeometry args={[0.05, 0.06, 0.6, 8]} />
          <meshStandardMaterial color={WHEY} transparent opacity={0.85} />
        </mesh>
        <group position={[1.55, 0, 1.55]}>
          <mesh position-y={0.18}>
            <cylinderGeometry args={[0.28, 0.22, 0.36, 18, 1, true]} />
            <meshStandardMaterial color="#7cc8f5" side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={0.02}>
            <cylinderGeometry args={[0.22, 0.22, 0.03, 18]} />
            <meshStandardMaterial color="#7cc8f5" />
          </mesh>
        </group>
      </Vat>
      <instancedMesh ref={flyMesh} args={[undefined, undefined, 24]} material={curdMat} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* かた の テーブル */}
      <group position={MOLD_T}>
        <Table w={1.6} d={1.1} h={0.75} />
        <group position-y={MOLD_Y}>
          <mesh position-y={0.02}>
            <boxGeometry args={[1.3, 0.04, 1.0]} />
            <meshStandardMaterial color="#e9f4ff" roughness={0.6} />
          </mesh>
          <group ref={moldRef}>
            <Tappable onTap={scoop} bounce={0.06}>
              <group ref={moldGroup}>
                <group ref={hoop}>
                  <Mold />
                </group>
                <mesh ref={fillMesh} material={curdMat} visible={false}>
                  <cylinderGeometry args={[0.5, 0.5, 1, 28]} />
                </mesh>
              </group>
            </Tappable>
          </group>
          {(pressUI || pressed.current) && !revealed && <PressRig plateRef={plate} />}
          <RewardRays on={revealed} position={[0, 0.45, -0.9]} size={2.6} />
          {revealed && cheese && look && (
            <CheeseWheel
              radius={look.radius}
              height={look.height}
              rind={look.fresh}
              paste={look.fresh}
              mark={cheese.mark}
              markColor={cheese.mark ? MARK_COLOR[cheese.mark] : undefined}
              position={[0, look.height / 2 + 0.04, 0]}
              rough={0.2}
            />
          )}
          <group ref={saltRef} position={[-0.55, 0.02, 0.32]}>
            <Tappable onTap={shakeSalt}>
              <Jar label="しお" color="#e9f4ff" lid="#7cc8f5" />
            </Tappable>
          </group>
        </group>
      </group>

      <Mouse id="mouse4" position={[0.2, 0, 2.6]} rotationY={-0.3} />
      <WindowPeek id="bird" position={[-3, 2.42, -4.7]} rise={0.7}>
        <BirdBody />
      </WindowPeek>
      <MilkCat
        position={[-1.75, 0, 1.55]}
        rotationY={0.45}
        onTap={() => {
          playSfx('meow');
          dialog.side(say('きみ、 しょくにんの さいのう あるニャ！', 'excited'));
        }}
      />

      {mode === 'cut' && (
        <ui.In>
          <CutPanel n={cuts.length} size={counts.size} />
        </ui.In>
      )}
      {pressUI && (
        <ui.In>
          <PressPanel
            press={press}
            onDone={() => {
              setPressUI(false);
              playSfx('thud');
              dialog.completeTask('press');
            }}
          />
        </ui.In>
      )}
    </>
  );
}

function Mold() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#f4f7fa';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#9aa6b2';
    for (let y = 10; y < 64; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 256; x += 16) {
      g.beginPath();
      g.arc(x + 4, y, 3, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position-y={0.42}>
      <cylinderGeometry args={[0.55, 0.55, 0.8, 32, 1, true]} />
      <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.4} metalness={0.2} />
    </mesh>
  );
}

function PressRig({ plateRef }: { plateRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]}>
          <boxGeometry args={[0.1, 1.9, 0.1]} />
          <meshStandardMaterial color="#8c5b32" />
        </mesh>
      ))}
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.7, 0.14, 0.18]} />
        <meshStandardMaterial color="#8c5b32" />
      </mesh>
      <group ref={plateRef}>
        <mesh>
          <cylinderGeometry args={[0.52, 0.52, 0.08, 28]} />
          <meshStandardMaterial color="#c58b52" />
        </mesh>
        <mesh position-y={0.55}>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
          <meshStandardMaterial color="#aeb5bd" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function CutPanel({ n, size }: { n: number; size: 'big' | 'medium' | 'small' }) {
  const label = size === 'big' ? 'おおきい' : size === 'medium' ? 'ふつう' : 'ちいさい';
  const blocks = size === 'big' ? 2 : size === 'medium' ? 3 : 5;
  return (
    <div className="panel top" style={{ top: 'calc(178px + var(--safe-t))', flexWrap: 'nowrap' }}>
      <div className="meter" data-testid="cutmeter" style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${blocks}, 1fr)`, gap: 2, width: 44, flex: 'none' }}>
          {Array.from({ length: blocks * blocks }, (_, i) => (
            <span key={i} style={{ aspectRatio: '1', background: '#fbefc6', border: '1.5px solid #d9d27a', borderRadius: 3 }} />
          ))}
        </div>
        <span style={{ lineHeight: 1.35 }}>
          カードの おおきさ
          <br />
          <b style={{ fontSize: 20 }}>{label}</b>
        </span>
      </div>
      <button className="btn green" style={{ minHeight: 64 }} disabled={n < 2} data-testid="cutdone" onClick={() => dialog.completeTask('cut')}>
        {n < 2 ? `あと ${2 - n}かい` : '✂️ できた！'}
      </button>
    </div>
  );
}

function PressPanel({ press, onDone }: { press: React.RefObject<{ holding: boolean; power: number; plate: number }>; onDone: () => void }) {
  const [p, setP] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setP(press.current.power);
      if (press.current.power >= 1 && press.current.holding) {
        press.current.holding = false;
        setHold(false);
        onDone();
      }
    }, 80);
    return () => clearInterval(id);
  }, [press, onDone]);
  const stop = () => {
    if (!press.current.holding) return;
    press.current.holding = false;
    setHold(false);
    if (press.current.power >= 0.2) onDone();
  };
  return (
    <div className="panel">
      <div className="meter">
        おす ちから
        <div className="bar">
          <i style={{ width: `${p * 100}%` }} />
        </div>
      </div>
      <button
        className="btn big pink"
        data-testid="press"
        style={{ transform: hold ? 'translateY(4px)' : undefined }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          press.current.holding = true;
          setHold(true);
          playSfx('thud');
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        ⬇️ おす
      </button>
    </div>
  );
}
