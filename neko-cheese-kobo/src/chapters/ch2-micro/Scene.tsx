import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { script, micro } from './script';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog } from '../../game/dialog';
import { game } from '../../game/game';
import { say } from '../../game/say';
import { setShot } from '../../three/CameraRig';
import { Tappable } from '../../three/common';
import { fx } from '../../three/fx';
import { useTarget } from '../../three/targets';
import { WorkshopLights, WorkshopRoom } from '../../three/env/Workshop';
import { MilkCat } from '../../three/characters/MilkCat';
import { glassMat, milkMat, Table } from '../../three/props/Kitchen';
import { Loupe } from '../../three/props/Loupe';
import { Bacterium, CaseinCloud, type LabState } from '../../three/micro';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';
import { parseRuby } from '../../game/ruby';
import { RubyText } from '../../ui/RubyText';

const FEEDS = 8;

export default function MicroScene() {
  useChapterStart(script);
  const [phase, setPhase] = useState<'room' | 'micro'>('room');
  const [meter, setMeter] = useState(false);
  const [acid, setAcid] = useState(0);

  useBus('zoomOut', () => {
    game.flash();
    playSfx('whoosh');
    setTimeout(() => setPhase('room'), 550);
  });
  useBus('showMeter', () => setMeter(true));

  return (
    <>
      {phase === 'room' ? (
        <Room
          onLoupe={() => {
            playSfx('magic');
            setShot([0.2, 1.35, 0.9], [0, 0.95, 0], { speed: 4, fit: 0.3 });
            setTimeout(() => {
              game.flash();
              playSfx('whoosh');
            }, 350);
            setTimeout(() => {
              setPhase('micro');
              dialog.completeTask('useLoupe');
            }, 950);
          }}
          after={acid > 0}
        />
      ) : (
        <Micro acid={acid} setAcid={setAcid} />
      )}
      {meter && phase === 'micro' && (
        <ui.In>
          <AcidMeter acid={acid} />
        </ui.In>
      )}
    </>
  );
}

function Room({ onLoupe, after }: { onLoupe: () => void; after: boolean }) {
  const loupeRef = useTarget('loupe');
  const used = useRef(false);
  useLayoutEffect(() => {
    if (after) setShot([1.2, 2.4, 4.2], [0, 1.1, 0], { immediate: true, fit: 0.8 });
    else setShot([1.4, 2.5, 4.8], [0.3, 1.0, 0], { immediate: true, fit: 0.8 });
  }, [after]);
  return (
    <>
      <WorkshopLights />
      <color attach="background" args={['#fdf0d8']} />
      <WorkshopRoom />
      <group position={[0, 0, 0]}>
        <Table w={1.6} d={1} h={0.75} />
        <group position={[-0.2, 0.79, 0]}>
          <mesh material={milkMat} position-y={0.31}>
            <cylinderGeometry args={[0.235, 0.215, 0.6, 24]} />
          </mesh>
          <mesh material={glassMat} position-y={0.36}>
            <cylinderGeometry args={[0.26, 0.23, 0.72, 24, 1, true]} />
          </mesh>
        </group>
        <group ref={loupeRef} position={[0.45, 0.88, 0.15]} rotation={[0.25, 0.4, 0.15]}>
          <Tappable
            hitScale={1.15}
            onTap={() => {
              if (dialog.isTask('useLoupe') && !used.current) {
                used.current = true;
                onLoupe();
              } else playSfx('tap');
            }}
          >
            <Loupe />
          </Tappable>
        </group>
      </group>
      <MilkCat position={[1.5, 0, 0.5]} rotationY={-0.5} onTap={() => dialog.side(say('むしめがねで のぞくと、 わくわく するね！', 'wink'))} />
    </>
  );
}

// ---------------- ミクロの せかい ----------------

function Micro({ acid, setAcid }: { acid: number; setAcid: (n: number) => void }) {
  const camera = useThree((s) => s.camera);
  const [labsVisible, setLabsVisible] = useState(false);
  const [labs, setLabs] = useState<LabState[]>([]);
  const feeds = useRef(0);
  const said = useRef({ eat: false, split: false });
  const fatRef = useTarget('fat');
  const caseinRef = useTarget('casein');
  const sugarRef = useTarget('sugar');
  const clock = useRef(0);

  useLayoutEffect(() => {
    setShot([0, 0.3, 8], [0, 0, 0], { immediate: true, fit: 0.9, sway: 2 });
  }, []);

  // あぶらの つぶ
  const fats = useMemo(
    () => [
      { p: new THREE.Vector3(-2.6, 1.6, -1.5), r: 1.25 },
      { p: new THREE.Vector3(3.2, -1.6, -2.5), r: 1.5 },
      { p: new THREE.Vector3(2.7, 2.5, -4), r: 1.1 },
      { p: new THREE.Vector3(-3.6, -2.4, -3.5), r: 1.35 },
      { p: new THREE.Vector3(0.5, 3.2, -6), r: 1.6 },
      { p: new THREE.Vector3(-5.5, 0.8, -6), r: 1.2 },
      { p: new THREE.Vector3(5.5, 0.6, -6.5), r: 1.4 },
    ],
    [],
  );
  // カゼイン
  const casein = useRef<THREE.Vector3[]>(
    Array.from({ length: 34 }, (_, i) => {
      if (i === 0) return new THREE.Vector3(1.7, 0.9, 2.2);
      const v = new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7.5, -Math.random() * 8 + 2.5);
      return v;
    }),
  );
  const caseinHome = useMemo(() => casein.current.map((v) => v.clone()), []);
  const hair = useRef(1);

  // 乳糖（キラキラ）
  const sugarMesh = useRef<THREE.InstancedMesh>(null);
  const sugars = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      home: new THREE.Vector3(-3.5 + (i % 7) * 1.15 + Math.random() * 0.4, (i < 7 ? -1.9 : 1.9) + (Math.random() - 0.5) * 0.8, 1.5 + Math.random() * 1.6),
      pos: new THREE.Vector3(),
      fly: null as null | { from: THREE.Vector3; to: LabState; t: number },
      hidden: 0,
    })),
  );
  sugars.current.forEach((s) => s.pos.lengthSq() === 0 && s.pos.copy(s.home));

  useBus('labAppear', () => {
    const now = clock.current;
    const mk = (x: number, y: number, z: number, pink = false): LabState => ({
      pos: new THREE.Vector3(x, y, z),
      home: new THREE.Vector3(x, y, z),
      scale: 1,
      eatT: -10,
      phase: Math.random() * 6,
      meals: 0,
      spawnT: now,
      pink,
    });
    setLabs([mk(-1.4, 0.4, 1.8), mk(1.0, -0.5, 1.2, true), mk(0.0, 1.3, 0.4)]);
    setLabsVisible(true);
    fx.burst([0, 0.4, 1.4], { star: true, count: 24, color: ['#c9b6ff', '#ffc2dc', '#ffffff'], speed: 3, gravity: 0, life: 1.2, size: 0.4 });
  });

  const feed = (i: number) => {
    const s = sugars.current[i];
    if (!s || s.fly || s.hidden > 0) return;
    if (!dialog.isTask('feed') || labs.length === 0) {
      playSfx('sparkle');
      dialog.side(say(micro.sugarSide));
      return;
    }
    // いちばん近い 乳酸菌へ（乳酸菌は およがない。乳糖のほうが とどく）
    let best = labs[0];
    labs.forEach((l) => {
      if (l.pos.distanceTo(s.pos) < best.pos.distanceTo(s.pos)) best = l;
    });
    s.fly = { from: s.pos.clone(), to: best, t: 0 };
    playSfx('bubble');
  };

  const arrive = (lab: LabState) => {
    lab.eatT = clock.current;
    lab.meals++;
    feeds.current++;
    playSfx('munch');
    fx.burst(lab.pos, { count: 10, color: ['#ff8fb8', '#ffb3cf', '#ffd6e6'], speed: 1.6, gravity: -0.4, life: 1.6, size: 0.3, spread: 1 });
    const left = Math.max(0, FEEDS - feeds.current);
    setAcid(Math.min(1, feeds.current / FEEDS));
    dialog.setProgress(left > 0 ? `あと ${left}` : undefined);
    if (!said.current.eat) {
      said.current.eat = true;
      setTimeout(() => dialog.side(say(micro.firstEat, 'excited')), 500);
    }
    if (lab.meals >= 2 && labs.length < 12) {
      lab.meals = 0;
      // ぶんれつ！
      setTimeout(() => {
        const off = new THREE.Vector3().randomDirection().multiplyScalar(0.9);
        off.z = Math.abs(off.z) * 0.3;
        const child: LabState = {
          pos: lab.pos.clone().add(off),
          home: lab.home.clone().add(off),
          scale: 1,
          eatT: -10,
          phase: Math.random() * 6,
          meals: 0,
          spawnT: clock.current,
          pink: !lab.pink,
        };
        setLabs((ls) => [...ls, child]);
        playSfx('pop');
        fx.burst(child.pos, { star: true, count: 10, color: ['#ffffff', '#c9b6ff'], speed: 2, gravity: 0, life: 0.8, size: 0.3 });
        if (!said.current.split) {
          said.current.split = true;
          setTimeout(() => dialog.side(say(micro.firstSplit, 'surprised')), 300);
        }
      }, 700);
    }
    if (feeds.current >= FEEDS) {
      setTimeout(() => dialog.completeTask('feed'), 900);
    }
  };

  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((st, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const t = st.clock.elapsedTime;
    clock.current = t;
    // ゆらゆら（ブラウン運動）
    casein.current.forEach((v, i) => {
      const h = caseinHome[i];
      v.set(h.x + Math.sin(t * 0.6 + i) * 0.15, h.y + Math.cos(t * 0.5 + i * 1.3) * 0.15, h.z + Math.sin(t * 0.4 + i * 0.7) * 0.1);
    });
    labs.forEach((l) => {
      l.pos.set(l.home.x + Math.sin(t * 0.5 + l.phase) * 0.18, l.home.y + Math.cos(t * 0.7 + l.phase) * 0.18, l.home.z);
    });
    const m = sugarMesh.current;
    sugars.current.forEach((s, i) => {
      if (s.fly) {
        s.fly.t += dt / 0.6;
        const k = Math.min(1, s.fly.t);
        s.pos.lerpVectors(s.fly.from, s.fly.to.pos, k);
        s.pos.y += Math.sin(k * Math.PI) * 0.6;
        if (k >= 1) {
          const lab = s.fly.to;
          s.fly = null;
          s.hidden = 2.5;
          arrive(lab);
        }
      } else if (s.hidden > 0) {
        s.hidden -= dt;
        s.pos.copy(s.home);
      } else {
        s.pos.set(s.home.x, s.home.y + Math.sin(t * 1.4 + i) * 0.12, s.home.z);
      }
      if (m) {
        o.position.copy(s.pos);
        const vis = s.hidden > 0 ? Math.max(0, 1 - s.hidden / 0.5) * (s.hidden < 0.5 ? 1 : 0) : 1;
        o.scale.setScalar((0.9 + Math.sin(t * 5 + i) * 0.15) * vis);
        o.rotation.set(t + i, t * 0.7 + i, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      }
    });
    if (m) m.instanceMatrix.needsUpdate = true;
  });

  const firstSugar = sugars.current[3].home;
  return (
    <>
      <color attach="background" args={['#e6ecff']} />
      <fogExp2 attach="fog" args={['#e9eeff', 0.045]} />
      <hemisphereLight args={['#ffffff', '#ffe9c4', 1.6]} />
      <directionalLight position={[3, 6, 8]} intensity={1.6} color="#fff6e0" />
      <pointLight position={[0, 0, 5]} intensity={8} distance={14} color="#fff0d8" />

      {/* あぶらの つぶ */}
      {fats.map((f, i) => (
        <group key={i} position={f.p} ref={i === 0 ? fatRef : undefined}>
          <Tappable
            onTap={() => {
              playSfx('bubble');
              if (dialog.isTask('tapFat')) dialog.completeTask('tapFat');
              else dialog.side(say('あぶらの つぶ。 ぷかぷか ふわふわ。'));
            }}
          >
            <mesh>
              <sphereGeometry args={[f.r, 32, 24]} />
              <meshStandardMaterial color="#fff3c8" roughness={0.12} emissive="#ffd970" emissiveIntensity={0.12} />
            </mesh>
            <mesh scale={1.04}>
              <sphereGeometry args={[f.r, 24, 16]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} depthWrite={false} />
            </mesh>
          </Tappable>
        </group>
      ))}

      {/* カゼイン */}
      <CaseinCloud
        positions={casein}
        hair={hair}
        radius={0.2}
        onTap={() => {
          playSfx('pop');
          if (dialog.isTask('tapCasein')) dialog.completeTask('tapCasein');
          else dialog.side(say('カゼインの つぶ。 ふさふさの バリアで、 いまは くっつかないよ。'));
        }}
      />
      <CaseinTarget
        pos={casein}
        reg={caseinRef}
        onTap={() => {
          playSfx('pop');
          if (dialog.isTask('tapCasein')) dialog.completeTask('tapCasein');
        }}
      />

      {/* 乳糖 */}
      <instancedMesh
        ref={sugarMesh}
        args={[undefined, undefined, sugars.current.length]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 14 || e.instanceId === undefined) return;
          feed(e.instanceId);
        }}
      >
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#fffbe8" emissive="#ffd34d" emissiveIntensity={0.55} roughness={0.2} />
      </instancedMesh>
      <group ref={sugarRef} position={firstSugar} />

      {/* 乳酸菌 */}
      {labsVisible && labs.map((l, i) => <Bacterium key={i} s={l} look={camera.position} size={1.45} />)}

      {/* あわの中の ミルク */}
      <group position={[-1.75, -0.55, 4.1]}>
        <MilkCat scale={0.6} shadow={false} onTap={() => dialog.side(say('あわの なかから ごあいさつ だニャ！', 'wink'))} />
        <mesh position-y={0.42}>
          <sphereGeometry args={[0.62, 28, 20]} />
          <meshStandardMaterial color="#dff3ff" transparent opacity={0.2} roughness={0.05} depthWrite={false} />
        </mesh>
      </group>
      {acid > 0 && <AcidSparkles acid={acid} />}
    </>
  );
}

function CaseinTarget({ pos, reg, onTap }: { pos: React.RefObject<THREE.Vector3[]>; reg: (o: THREE.Object3D | null) => void; onTap: () => void }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.position.copy(pos.current[0]);
  });
  return (
    <group
      ref={(o) => {
        g.current = o;
        reg(o);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 14) return;
        onTap();
      }}
    >
      {/* 小さい つぶでも タッチしやすいように 見えない あたり判定 */}
      <mesh>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** すっぱさ（乳酸）が ふえると、ピンクの つぶが ふわふわ ただよう */
function AcidSparkles({ acid }: { acid: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = 40;
  const seeds = useMemo(() => Array.from({ length: n }, () => new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, Math.random() * -7 + 3)), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const m = ref.current;
    if (!m) return;
    seeds.forEach((s, i) => {
      const on = i / n < acid ? 1 : 0;
      o.position.set(s.x + Math.sin(t * 0.3 + i) * 0.4, s.y + ((t * 0.2 + i * 0.37) % 2) - 1, s.z);
      o.scale.setScalar(on * (0.6 + Math.sin(t * 2 + i) * 0.2));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
      <sphereGeometry args={[0.07, 8, 6]} />
      <meshStandardMaterial color="#ff9fc4" emissive="#ff6fa8" emissiveIntensity={0.4} transparent opacity={0.8} />
    </instancedMesh>
  );
}

function AcidMeter({ acid }: { acid: number }) {
  return (
    <div className="panel top" style={{ top: 'calc(140px + var(--safe-t))' }}>
      <div className="meter" data-testid="acid">
        <RubyText segs={parseRuby('すっぱさ（[乳酸:にゅうさん]）')} />
        <div className="bar">
          <i style={{ width: `${Math.round(acid * 100)}%`, background: 'linear-gradient(90deg,#ffd6e6,#ff6fa8)' }} />
        </div>
      </div>
    </div>
  );
}
