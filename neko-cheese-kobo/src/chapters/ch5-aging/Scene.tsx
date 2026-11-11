import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { script, milestones, flipLines } from './script';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog } from '../../game/dialog';
import { say } from '../../game/say';
import { useProgress } from '../../game/progress';
import { agedLook, agingMaxDays, cheeseLook, DEFAULT_CHEESE, formatDays, MARK_COLOR } from '../../game/cheese';
import { setShot } from '../../three/CameraRig';
import { BlobShadow, Glow, RewardRays, Tappable } from '../../three/common';
import { Mouse, SecretSpot } from '../../three/props/Secrets';
import { RoomAO, SunShadow } from '../../three/realism';
import { Environment, Lightformer } from '@react-three/drei';
import { fx } from '../../three/fx';
import { useTarget } from '../../three/targets';
import { MilkCat } from '../../three/characters/MilkCat';
import { Table } from '../../three/props/Kitchen';
import { CheeseWheel, Mozzarella, roundedWheel } from '../../three/props/Cheese';
import { rindTex, rng, stoneTex, textTex, woodTex } from '../../three/tex';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';
import { Dial } from '../../ui/Dial';

const TABLE: THREE.Vector3Tuple = [0, 0, -12];
const FRESH: THREE.Vector3Tuple = [2.6, 0, -11.2];

export default function AgingScene() {
  useChapterStart(script);
  const cheese = useProgress((s) => s.cheese) ?? DEFAULT_CHEESE;
  const type = cheese.type;
  const max = agingMaxDays(type);
  const look = cheeseLook(type);
  const [open, setOpen] = useState(false);
  const [dialOn, setDialOn] = useState(false);
  const [v, setV] = useState(0);
  const [spored, setSpored] = useState(type !== 'soft');
  const flipT = useRef(-10);
  const clock = useRef(0);
  const passed = useRef(new Set<number>());
  const queue = useRef<string[]>([]);
  const done = useRef(false);
  const doorRef = useTarget('door');
  const cheeseRef = useTarget('cheese');
  const freshRef = useTarget('fresh');
  const misterRef = useTarget('mister');

  useLayoutEffect(() => {
    setShot([0.8, 2.3, 4.6], [0, 2.0, -4], { immediate: true, fit: 0.8 });
  }, []);
  useBus('cam:inside', () => setShot([0, 3.0, -5.5], [0, 1.4, -12], { fit: 0.8 }));
  useBus('cam:cheese', () => setShot([0.4, 2.5, -8.6], [0, 1.15, -12], { fit: 0.75 }));
  useBus('cam:fresh', () => setShot([1.6, 2.3, -8.2], [FRESH[0] - 0.2, 1.0, FRESH[2]], { fit: 0.75 }));
  useBus('showDial', () => setDialOn(true));
  useBus('task', (id) => {
    if (id === 'dial') setShot([0.4, 2.5, -8.6], [0, 1.15, -12], { fit: 0.75 });
    if (id !== 'dial' && done.current) setDialOn(false);
  });

  const days = v * max;

  // 通りすぎた めじるしで ひとこと（順番に）
  useEffect(() => {
    milestones[type].forEach((m, i) => {
      if (days >= m.day && !passed.current.has(i)) {
        passed.current.add(i);
        queue.current.push(m.text);
        if (type !== 'soft' && m.day > 300) fx.burst([TABLE[0], 1.4, TABLE[2]], { star: true, count: 16, color: ['#ffffff', '#fff3c4'], speed: 1.2, gravity: 0, life: 1.4, size: 0.25 });
        if (type === 'soft' && i === 0) playSfx('sparkle');
      }
    });
    if (v >= 0.999 && !done.current && dialog.isTask('dial')) {
      done.current = true;
      useProgress.getState().patchCheese({ agedDays: max });
      setTimeout(() => {
        const wait = () => {
          if (queue.current.length || dialog.busy()) return setTimeout(wait, 400);
          dialog.completeTask('dial');
          setDialOn(false);
        };
        wait();
      }, 500);
    }
  }, [days, v, type, max]);
  useEffect(() => {
    const id = setInterval(() => {
      if (!queue.current.length || dialog.busy()) return;
      const text = queue.current.shift()!;
      if (!dialog.side(say(text, 'surprised'))) queue.current.unshift(text);
    }, 350);
    return () => clearInterval(id);
  }, []);

  const tapDoor = () => {
    if (open) return;
    if (!dialog.isTask('openDoor')) {
      dialog.side(say('おおきな きの とびら。 なかは ひんやり しているよ。'));
      return;
    }
    setOpen(true);
    playSfx('door');
    setTimeout(() => dialog.completeTask('openDoor'), 1300);
  };
  const tapCheese = () => {
    flipT.current = clock.current;
    playSfx('boing');
    if (!dialog.busy()) dialog.side(say(type === 'soft' ? flipLines.soft : flipLines.hard));
  };
  const spray = () => {
    if (!dialog.isTask('spore')) {
      playSfx('tap');
      return;
    }
    playSfx('whoosh');
    fx.burst([TABLE[0], 1.5, TABLE[2]], { count: 50, color: ['#ffffff', '#f4f0e6'], speed: 1.2, gravity: 0.4, life: 1.4, size: 0.18, spread: 0.6 });
    setSpored(true);
    setTimeout(() => dialog.completeTask('spore'), 900);
  };

  // 熟成の見た目
  const a = v;
  const al = agedLook(type, a);
  const { hardish, rind, paste, shrink, sag } = al;
  const mold = !hardish && spored ? THREE.MathUtils.clamp((days - 3) / 10, 0, 1) : 0;

  const turner = useRef<THREE.Group>(null);
  useFrame((st) => {
    clock.current = st.clock.elapsedTime;
    if (turner.current) {
      const k = THREE.MathUtils.clamp((clock.current - flipT.current) / 0.8, 0, 1);
      turner.current.rotation.x = k < 1 ? Math.sin(k * Math.PI) * 0.6 : 0;
      turner.current.position.y = Math.sin(k * Math.PI) * 0.4;
    }
  });

  return (
    <>
      <color attach="background" args={['#2a1d14']} />
      <fog attach="fog" args={['#3a2a1c', 12, 30]} />
      <hemisphereLight args={['#ffe9c8', '#6a4a30', 0.7]} />
      <SunShadow position={[3, 9, 4]} intensity={2.6} color="#ffe2b0" range={9} focus={[0, 0, -11]} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#ffdca8" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb060" position={[-5, 2, 3]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#6a4a30" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <pointLight position={[0, 3.2, -11]} intensity={7} distance={10} color="#ffcf8a" />
      <pointLight position={[0, 2.8, -2.5]} intensity={4} distance={8} color="#ffd9a0" />

      <Corridor />
      <BigDoor open={open} onTap={tapDoor} doorRef={doorRef} />
      <Cellar />
      <group position={[0, 0, 0]}>
        <RoomAO width={10} depth={10} back={-17} front={-7} size={1.2} />
      </group>

      {/* まんなかの だいと きみの チーズ */}
      <group position={TABLE}>
        <Table w={1.8} d={1.2} h={0.85} color="#b97a45" />
        <mesh position-y={0.92}>
          <cylinderGeometry args={[0.85, 0.85, 0.06, 32]} />
          <meshStandardMaterial map={woodTex('#d9a066', '#9c6534', 'board', 4)} />
        </mesh>
        <group ref={cheeseRef} position-y={0.95}>
          <Tappable onTap={tapCheese} bounce={0.05}>
            <group ref={turner}>
              <CheeseWheel
                radius={look.radius * shrink}
                height={look.height * shrink * sag}
                rind={rind}
                paste={paste}
                inside={hardish ? 'plain' : a > 0.5 ? 'creamy' : 'plain'}
                mold={mold}
                mark={cheese.mark}
                markColor={MARK_COLOR[cheese.mark]}
                rough={al.rough}
                position={[0, (look.height * shrink * sag) / 2, 0]}
                cut={hardish ? a > 0.15 : a > 0.7}
              />
            </group>
          </Tappable>
        </group>
        {type === 'soft' && (
          <group ref={misterRef} position={[0.75, 0.9, 0.3]}>
            <Tappable onTap={spray}>
              <Mister />
            </Tappable>
          </group>
        )}
      </group>

      {/* フレッシュチーズの コーナー */}
      <group position={FRESH}>
        <Table w={1} d={0.8} h={0.75} color="#c58b52" />
        <group ref={freshRef} position-y={0.79}>
          <Tappable
            onTap={() => {
              playSfx('bubble');
              if (dialog.isTask('tapFresh')) dialog.completeTask('tapFresh');
              else dialog.side(say('モッツァレラ。 じゅくせい させずに、 できたてを たべるよ。'));
            }}
          >
            <mesh position-y={0.14}>
              <cylinderGeometry args={[0.42, 0.32, 0.28, 24, 1, true]} />
              <meshStandardMaterial color="#e9f4ff" transparent opacity={0.5} side={THREE.DoubleSide} roughness={0.05} />
            </mesh>
            <mesh position-y={0.22} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.4, 24]} />
              <meshStandardMaterial color="#d6ecff" transparent opacity={0.6} roughness={0.05} />
            </mesh>
            <Mozzarella r={0.13} position={[-0.12, 0.2, 0.05]} />
            <Mozzarella r={0.12} position={[0.14, 0.19, -0.06]} />
            <Mozzarella r={0.1} position={[0.05, 0.2, 0.17]} />
          </Tappable>
        </group>
        <mesh position={[0, 1.5, -0.3]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshBasicMaterial map={textTex('フレッシュ', { w: 384, h: 128, bg: '#e9f4ff', color: '#2f6b9a', size: 64, border: '#7cc8f5' })} transparent />
        </mesh>
      </group>

      <MilkCat
        position={open ? [-1.6, 0, -11.2] : [-1.3, 0, -1.6]}
        rotationY={0.4}
        onTap={() => {
          playSfx('meow');
          dialog.side(say('ここは しずかで ひんやり。 チーズたちの おやすみ べや だニャ。', 'gentle'));
        }}
      />
      <Dust />
      <RewardRays on={v >= 0.999} position={[TABLE[0], 1.4, TABLE[2] - 0.6]} size={3.6} color="#ffe2a0" />
      <Mouse id="mouse5" position={[-0.75, 0, -11.15]} rotationY={0.4} />
      <SecretSpot id="oldCheese" position={[2.9, 0, -14.6]} hit={0.9}>
        <CheeseWheel radius={0.85} height={0.5} rind="#a8672a" paste="#e9b24a" rough={1} position={[0, 0.25, 0]} />
      </SecretSpot>
      <Glow position={[0, 4.4, -16.8]} size={3.2} color="#fff0c0" opacity={0.55} pulse={0.04} />
      <Glow position={[-3.6, 2.95, -3.4]} size={1.6} color="#ffc060" opacity={0.7} pulse={0.1} />
      <Glow position={[3.6, 2.95, -3.4]} size={1.6} color="#ffc060" opacity={0.7} pulse={0.1} />

      {dialOn && (
        <ui.In>
          <div className="panel">
            <Dial value={v} onChange={setV} label={formatDays(days)} sub={type === 'soft' ? 'しろカビの チーズ' : type === 'hard' ? 'かたい チーズ' : 'ほどよい かたさの チーズ'} />
          </div>
        </ui.In>
      )}
    </>
  );
}

function Mister() {
  return (
    <group>
      <BlobShadow size={0.4} />
      <mesh position-y={0.18}>
        <cylinderGeometry args={[0.1, 0.12, 0.36, 14]} />
        <meshStandardMaterial color="#9fd8ff" transparent opacity={0.8} roughness={0.2} />
      </mesh>
      <mesh position-y={0.42}>
        <boxGeometry args={[0.1, 0.14, 0.14]} />
        <meshStandardMaterial color="#ff8fa3" />
      </mesh>
      <mesh position={[0, 0.44, 0.1]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#ff8fa3" />
      </mesh>
    </group>
  );
}

function Corridor() {
  const stone = stoneTex();
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -4]}>
        <planeGeometry args={[12, 36]} />
        <meshStandardMaterial map={stone} color="#b8a48c" roughness={0.95} />
      </mesh>
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} position={[x, 2.5, -1]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial map={stone} roughness={0.95} />
        </mesh>
      ))}
      {/* たいまつ風ランプ */}
      {[-3.6, 3.6].map((x) => (
        <group key={x} position={[x, 2.6, -3.4]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#5a3a1a" />
          </mesh>
          <mesh position-y={0.35}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshBasicMaterial color="#ffd27a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BigDoor({ open, onTap, doorRef }: { open: boolean; onTap: () => void; doorRef: (o: THREE.Object3D | null) => void }) {
  const wood = woodTex('#8c5b32', '#5e3a1c', 'bigdoor', 7);
  const stone = stoneTex();
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const k = useRef(0);
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, open ? 1 : 0, 1 - Math.exp(-2.2 * dt));
    if (left.current) left.current.rotation.y = -k.current * 1.7;
    if (right.current) right.current.rotation.y = k.current * 1.7;
  });
  const panel = (side: 1 | -1) => (
    <group position={[side * -1.3, 0, 0]}>
      <mesh position-y={1.9}>
        <boxGeometry args={[2.6, 3.8, 0.18]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      {[0.8, 2.9].map((y) => (
        <mesh key={y} position={[0, y, 0.11]}>
          <boxGeometry args={[2.6, 0.16, 0.05]} />
          <meshStandardMaterial color="#3d3a38" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[side * 1.0, 1.9, 0.18]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.16, 0.035, 8, 20]} />
        <meshStandardMaterial color="#c9a04a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
  return (
    <group position={[0, 0, -4]}>
      {/* アーチ */}
      <mesh position={[0, 4.3, 0]} rotation-x={0}>
        <torusGeometry args={[2.9, 0.35, 10, 24, Math.PI]} />
        <meshStandardMaterial map={stone} roughness={0.95} />
      </mesh>
      {[-2.9, 2.9].map((x) => (
        <mesh key={x} position={[x, 2.15, 0]}>
          <boxGeometry args={[0.7, 4.3, 0.7]} />
          <meshStandardMaterial map={stone} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 4.4, -0.05]}>
        <circleGeometry args={[2.6, 24, 0, Math.PI]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      {/* 壁 */}
      {[-6.2, 6.2].map((x) => (
        <mesh key={x} position={[x, 3, 0]}>
          <boxGeometry args={[6, 6, 0.6]} />
          <meshStandardMaterial map={stone} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 6.6, 0]}>
        <boxGeometry args={[6.4, 1.2, 0.6]} />
        <meshStandardMaterial map={stone} roughness={0.95} />
      </mesh>
      <group ref={doorRef} position={[0, 1.8, 0.4]} />
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 14) return;
          onTap();
        }}
      >
        <group ref={left} position={[2.6, 0, 0]}>
          {panel(1)}
        </group>
        <group ref={right} position={[-2.6, 0, 0]}>
          {panel(-1)}
        </group>
      </group>
    </group>
  );
}

/** たくさんの チーズが ねむる たな（InstancedMesh で軽く） */
function Cellar() {
  const stone = stoneTex();
  const wheels = useRef<THREE.InstancedMesh>(null);
  const boards = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(12);
    const w: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const b: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    const palette = ['#e9b949', '#d99b3a', '#c98a3a', '#f2d27a', '#f4efe2', '#b8742a'];
    [-1, 1].forEach((side) => {
      for (let row = 0; row < 4; row++) {
        const y = 0.5 + row * 1.0;
        o.position.set(side * 4.3, y, -12);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, 1, 1);
        o.updateMatrix();
        b.push(o.matrix.clone());
        for (let k = 0; k < 7; k++) {
          const s = 0.75 + r() * 0.35;
          o.position.set(side * (4.1 + r() * 0.3), y + 0.05 + 0.17 * s, -15.2 + k * 1.05 + r() * 0.2);
          o.rotation.set(0, r() * 6, 0);
          o.scale.set(s, s, s);
          o.updateMatrix();
          w.push({ m: o.matrix.clone(), c: new THREE.Color(palette[Math.floor(r() * palette.length)]) });
        }
      }
    });
    return { w, b };
  }, []);
  useLayoutEffect(() => {
    data.w.forEach((d, i) => {
      wheels.current?.setMatrixAt(i, d.m);
      wheels.current?.setColorAt(i, d.c);
    });
    data.b.forEach((m, i) => boards.current?.setMatrixAt(i, m));
    if (wheels.current) {
      wheels.current.instanceMatrix.needsUpdate = true;
      if (wheels.current.instanceColor) wheels.current.instanceColor.needsUpdate = true;
    }
    if (boards.current) boards.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <group>
      {/* へや */}
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 3, -12]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}>
          <planeGeometry args={[10, 6]} />
          <meshStandardMaterial map={stone} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 3, -17]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial map={stone} roughness={0.95} />
      </mesh>
      {/* 小さな まど と 光 */}
      <mesh position={[0, 4.4, -16.95]}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial color="#fff2c4" />
      </mesh>
      <mesh position={[0, 2.6, -14.5]} rotation={[-0.75, 0, 0]}>
        <planeGeometry args={[1.3, 6]} />
        <meshBasicMaterial color="#fff2c4" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={boards} args={[undefined, undefined, data.b.length]} frustumCulled={false}>
        <boxGeometry args={[1.1, 0.08, 8]} />
        <meshStandardMaterial color="#8c5b32" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={wheels} args={[undefined, undefined, data.w.length]} frustumCulled={false}>
        <primitive object={roundedWheel(0.38, 0.34, 24)} attach="geometry" />
        <meshStandardMaterial map={rindTex('natural')} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

/** ひかりの なかを ただよう ほこり */
function Dust() {
  const n = 80;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 6, Math.random() * 5, -8 - Math.random() * 8], i * 3);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const ref = useRef<THREE.Points>(null);
  useFrame((st) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.05) * 0.2;
      ref.current.position.y = Math.sin(st.clock.elapsedTime * 0.2) * 0.2;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#ffe9b8" size={0.05} transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}
