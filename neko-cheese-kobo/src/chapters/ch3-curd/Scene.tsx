import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { script } from './script';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog, catGesture } from '../../game/dialog';
import { say } from '../../game/say';
import { setShot } from '../../three/CameraRig';
import { Tappable } from '../../three/common';
import { fx } from '../../three/fx';
import { useTarget } from '../../three/targets';
import { Thermometer, Vat, VAT, WorkshopLights, WorkshopRoom } from '../../three/env/Workshop';
import { MilkCat } from '../../three/characters/MilkCat';
import { MilkCan, Table } from '../../three/props/Kitchen';
import { Jar, VatSurface, type Ripple } from '../../three/props/Dairy';
import { CaseinCloud } from '../../three/micro';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';
import { FastForward } from '../../ui/FastForward';

const SHOTS: Record<string, [THREE.Vector3Tuple, THREE.Vector3Tuple, number?]> = {
  vat: [[0.4, 4.7, 6.6], [0, 1.4, 0], 0.85],
  thermo: [[-0.4, 3.4, 4.2], [-0.8, 2.3, 0.6], 0.7],
  shelf: [[-0.6, 3.4, 3.6], [-1.3, 2.1, -2.2], 0.7],
  bubble: [[0.4, 3.9, 4.6], [0, 3.4, -0.6], 0.6],
  top: [[0, 4.8, 3.6], [0, 1.6, 0], 0.7],
};
const SHELF: THREE.Vector3Tuple = [-1.3, 0, -2.4];
const CAN: THREE.Vector3Tuple = [-1.35, 0, 2.15];
const CAT: THREE.Vector3Tuple = [1.75, 0, 1.55];

export default function CurdScene() {
  useChapterStart(script);
  const level = useRef(0);
  const curd = useRef(0);
  const ripples = useRef<Ripple[]>([]);
  const temp = useRef(16);
  const clock = useRef(0);
  const [pouring, setPouring] = useState(false);
  const [poured, setPoured] = useState(false);
  const [heatUI, setHeatUI] = useState(false);
  const [ff, setFf] = useState<string | null>(null);
  const [bubble, setBubble] = useState(false);
  const [saltUp, setSaltUp] = useState(false);
  const hair = useRef(1);
  const join = useRef(0);
  const jiggles = useRef(0);
  const heating = useRef(false);
  const inZone = useRef(0);
  const warnedHot = useRef(false);

  const canRef = useTarget('can');
  const thermoRef = useTarget('thermo');
  const starterRef = useTarget('starter');
  const rennetRef = useTarget('rennet');
  const curdRef = useTarget('curd');

  useLayoutEffect(() => {
    const [p, l, f] = SHOTS.vat;
    setShot([p[0] + 1.5, p[1] + 0.6, p[2] + 2], l, { immediate: true, fit: f });
  }, []);

  const shot = (name: string) => {
    const s = SHOTS[name];
    if (s) setShot(s[0], s[1], { fit: s[2] ?? 1 });
  };
  useBus('cam:vat', () => shot('vat'));
  useBus('cam:thermo', () => shot('thermo'));
  useBus('cam:shelf', () => shot('shelf'));
  useBus('cam:bubble', () => shot('bubble'));
  useBus('cam:top', () => shot('top'));
  useBus('task', (id) => {
    if (id === 'heat') setHeatUI(true);
    else setHeatUI(false);
    if (id === 'jiggle') shot('top');
    if (id === 'pour') shot('vat');
  });
  useBus('saltOops', () => {
    setSaltUp(true);
    setTimeout(() => setSaltUp(false), 2600);
  });
  useBus('ff:starter', () => {
    setFf('ほんとうは 30ぷん〜1じかん くらい');
    setTimeout(() => setFf(null), 2700);
    fx.burst([0, VAT.top, 0], { star: true, count: 20, color: ['#c9b6ff', '#ffc2dc'], speed: 1.5, gravity: -0.3, life: 1.5, size: 0.35 });
  });
  useBus('showBubble', () => {
    setBubble(true);
    playSfx('magic');
  });
  useBus('cutHair', () => (hair.current = 1));
  useBus('joinMicelles', () => {
    playSfx('sparkle');
    join.current = 0.001;
  });
  useBus('ff:rennet', () => {
    setFf('ほんとうは 30ぷん〜1じかん くらい');
    setTimeout(() => setFf(null), 2500);
  });
  useBus('setCurd', () => {
    curd.current = 0.001;
    ripples.current.push({ x: 0, z: 0, t0: clock.current, amp: 0.12 });
    setTimeout(() => setBubble(false), 600);
  });

  const cutting = useRef(false);
  useBus('cutHair', () => (cutting.current = true));

  // 温度・注ぐ・アニメ
  useFrame((st, dt0) => {
    const dt = Math.min(dt0, 0.05);
    clock.current = st.clock.elapsedTime;
    if (pouring) level.current = Math.min(0.78, level.current + dt * 0.45);
    if (curd.current > 0 && curd.current < 1) curd.current = Math.min(1, curd.current + dt * 0.8);
    if (cutting.current) hair.current = Math.max(0, hair.current - dt * 0.35);
    if (join.current > 0 && join.current < 1) join.current = Math.min(1, join.current + dt * 0.45);
    // おんど
    if (heatUI) {
      if (heating.current) temp.current = Math.min(55, temp.current + dt * 7);
      else temp.current += (20 - temp.current) * dt * 0.06;
      const ok = temp.current >= 30 && temp.current <= 34;
      inZone.current = ok && !heating.current ? inZone.current + dt : ok ? inZone.current + dt * 0.6 : 0;
      if (temp.current > 40 && !warnedHot.current) {
        warnedHot.current = true;
        dialog.side(say('あちちっ！ あつすぎると [乳酸菌:にゅうさんきん]が よわっちゃうニャ。 てを はなして すこし さまそう。', 'surprised'));
      }
      if (temp.current < 37) warnedHot.current = false;
      if (inZone.current > 1.0 && dialog.isTask('heat')) {
        dialog.completeTask('heat');
        playSfx('success');
        setTimeout(() => setHeatUI(false), 1600);
      }
      if (heating.current && Math.random() < dt * 6) {
        fx.burst([(Math.random() - 0.5) * 2, 0.35, (Math.random() - 0.5) * 2], { count: 2, color: ['#ffb347', '#ff7043'], speed: 0.8, gravity: -1.2, life: 0.6, size: 0.25 });
      }
    }
  });

  const pour = () => {
    if (!dialog.isTask('pour') || pouring) {
      if (!poured) dialog.side(say('この ミルクかんは、 ぼくじょうから はこんで くれた ぎゅうにゅう だよ。'));
      return;
    }
    setPouring(true);
    playSfx('pour');
    setTimeout(() => {
      setPouring(false);
      setPoured(true);
      ripples.current.push({ x: 0.3, z: 0.4, t0: clock.current, amp: 0.05 });
      dialog.completeTask('pour');
    }, 2000);
  };

  const tapJar = (kind: 'starter' | 'rennet' | 'salt') => {
    if (kind === 'starter' && dialog.isTask('starter')) {
      playSfx('sparkle');
      fx.burst([SHELF[0] - 0.4, 2.0, SHELF[2]], { star: true, count: 14, color: ['#ffc2dc', '#c9b6ff'], speed: 2, gravity: 0, life: 1, size: 0.3 });
      fx.burst([0, VAT.top, 0], { count: 30, color: ['#ffc2dc', '#c9b6ff', '#ffffff'], speed: 1.2, gravity: 1.5, life: 1.2, size: 0.18 });
      dialog.completeTask('starter');
      return;
    }
    if (kind === 'rennet' && dialog.isTask('rennet')) {
      playSfx('drip');
      setTimeout(() => playSfx('drip'), 250);
      setTimeout(() => playSfx('drip'), 500);
      fx.burst([0, VAT.top + 0.6, 0], { count: 16, color: ['#fff3c4', '#ffe08a'], speed: 0.6, gravity: 4, life: 0.9, size: 0.2 });
      ripples.current.push({ x: 0, z: 0, t0: clock.current, amp: 0.04 });
      catGesture('stir');
      dialog.completeTask('rennet');
      return;
    }
    playSfx('tap');
    const lines = {
      starter: 'スターターには、 チーズに むいた [乳酸菌:にゅうさんきん]が はいっているよ。',
      rennet: 'レンネット。 ぎゅうにゅうを かためる ひみつの おてつだいさん。',
      salt: 'しお。 チーズづくりの さいごの ほうで つかうよ。',
    };
    dialog.side(say(lines[kind]));
  };

  const touchSurface = (local: THREE.Vector3) => {
    if (level.current < 0.05) return;
    const solid = curd.current > 0.5;
    ripples.current.push({ x: local.x, z: local.z, t0: clock.current, amp: solid ? 0.13 : 0.04 });
    if (ripples.current.length > 6) ripples.current.shift();
    playSfx(solid ? 'squish' : 'bubble');
    if (solid && dialog.isTask('jiggle')) {
      jiggles.current++;
      const left = 3 - jiggles.current;
      dialog.setProgress(left > 0 ? `あと ${left}` : undefined);
      if (left <= 0) setTimeout(() => dialog.completeTask('jiggle'), 600);
    }
  };

  return (
    <>
      <WorkshopLights />
      <color attach="background" args={['#fdf0d8']} />
      <WorkshopRoom />
      <Vat>
        <VatSurface level={level} curd={curd} ripples={ripples} onTouch={(_, l) => touchSurface(l)} surfaceRef={curdRef} />
        <group ref={thermoRef} position={[-1.05, VAT.top - 1.0, 0.85]} rotation={[0, 0.5, 0.12]}>
          <Thermometer temp={temp} />
        </group>
        <HeatGlow on={heatUI} temp={temp} />
      </Vat>

      {/* びんの たな */}
      <group position={SHELF}>
        <Table w={1.4} d={0.8} h={1.5} />
        <group position={[-0.42, 1.54, 0]} ref={starterRef}>
          <Tappable onTap={() => tapJar('starter')}>
            <Jar label="スターター" color="#ffc2dc" lid="#ff7d96" />
          </Tappable>
        </group>
        <group position={[0.05, 1.54, 0.05]} ref={rennetRef}>
          <Tappable onTap={() => tapJar('rennet')}>
            <Jar label="レンネット" color="#fff1b8" lid="#f2a91f" tall />
          </Tappable>
        </group>
        <group position={[0.5, saltUp ? 2.3 : 1.54, 0.1]} rotation-z={saltUp ? 0.4 : 0}>
          <Tappable onTap={() => tapJar('salt')}>
            <Jar label="しお" color="#e9f4ff" lid="#7cc8f5" />
          </Tappable>
        </group>
      </group>

      {/* ミルクかん */}
      {!poured && (
        <group ref={canRef} position={CAN}>
          <PouringCan pouring={pouring} onTap={pour} />
        </group>
      )}

      {bubble && <MicelleBubble hair={hair} join={join} />}

      <MilkCat
        position={CAT}
        rotationY={-0.4}
        onTap={() => {
          playSfx('meow');
          dialog.side(say('ぼくの しっぽ、 なべに いれないように きを つけてるニャ。', 'wink'));
        }}
      />

      {heatUI && (
        <ui.In>
          <HeatPanel temp={temp} heating={heating} />
        </ui.In>
      )}
      {ff && (
        <ui.In>
          <FastForward label={ff} />
        </ui.In>
      )}
    </>
  );
}

function PouringCan({ pouring, onTap }: { pouring: boolean; onTap: () => void }) {
  const g = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  const k = useRef(0);
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, pouring ? 1 : 0, 1 - Math.exp(-4 * dt));
    if (g.current) {
      // なべの ふちまで もちあげて かたむける
      g.current.position.set(k.current * 0.55, k.current * 1.8, -k.current * 1.15);
      g.current.rotation.set(0, -0.5 * k.current, -k.current * 1.9);
    }
    if (stream.current) {
      stream.current.visible = pouring && k.current > 0.8;
    }
  });
  return (
    <group>
      <group ref={g}>
        <Tappable onTap={onTap}>
          <MilkCan scale={1.1} shadow={!pouring} />
        </Tappable>
      </group>
      <mesh ref={stream} position={[1.15, 1.95, -1.2]} visible={false}>
        <cylinderGeometry args={[0.07, 0.09, 0.9, 10]} />
        <meshStandardMaterial color="#fffdf6" roughness={0.2} />
      </mesh>
    </group>
  );
}

function HeatGlow({ on, temp }: { on: boolean; temp: React.RefObject<number> }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st) => {
    if (m.current) m.current.opacity = on ? 0.25 + ((temp.current - 15) / 40) * 0.5 + Math.sin(st.clock.elapsedTime * 8) * 0.05 : 0;
  });
  return (
    <mesh position-y={0.3} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[1.3, 32]} />
      <meshBasicMaterial ref={m} color="#ff9a3c" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/** なべの うえの まほうの まど：カゼインが バリアを きられて つながっていく */
function MicelleBubble({ hair, join }: { hair: React.RefObject<number>; join: React.RefObject<number> }) {
  const N = 12;
  const free = useMemo(() => Array.from({ length: N }, () => new THREE.Vector3().randomDirection().multiplyScalar(0.25 + Math.random() * 0.45)), []);
  // つながった あみ（格子）
  const lattice = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const x = (i % 4) - 1.5;
        const y = Math.floor(i / 4) - 1;
        return new THREE.Vector3(x * 0.26, y * 0.26, (i % 2) * 0.12 - 0.06);
      }),
    [],
  );
  const pos = useRef(free.map((v) => v.clone()));
  const links = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      if (i % 4 !== 3) out.push([i, i + 1]);
      if (i + 4 < N) out.push([i, i + 4]);
    }
    return out;
  }, []);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(links.length * 6), 3));
    return g;
  }, [links]);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const shell = useRef<THREE.Group>(null);
  const born = useRef(0);
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    born.current = Math.min(1, born.current + dt * 2);
    if (shell.current) shell.current.scale.setScalar(born.current);
    const j = join.current;
    pos.current.forEach((p, i) => {
      const f = free[i];
      const wob = new THREE.Vector3(Math.sin(t * 1.3 + i) * 0.05, Math.cos(t * 1.1 + i * 2) * 0.05, 0).multiplyScalar(1 - j);
      p.copy(f).lerp(lattice[i], THREE.MathUtils.smoothstep(j, 0, 1)).add(wob);
    });
    const P = lineGeo.attributes.position.array as Float32Array;
    links.forEach(([a, b], k) => {
      P.set([pos.current[a].x, pos.current[a].y, pos.current[a].z, pos.current[b].x, pos.current[b].y, pos.current[b].z], k * 6);
    });
    lineGeo.attributes.position.needsUpdate = true;
    if (lineMat.current) lineMat.current.opacity = THREE.MathUtils.smoothstep(j, 0.6, 1);
  });
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);
  return (
    <group ref={shell} position={[0, 3.3, -0.6]}>
      <mesh>
        <sphereGeometry args={[0.95, 32, 24]} />
        <meshStandardMaterial color="#e8f6ff" transparent opacity={0.22} roughness={0.05} depthWrite={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.95, 0.04, 8, 48]} />
        <meshStandardMaterial color="#f2c94c" metalness={0.6} roughness={0.3} />
      </mesh>
      <CaseinCloud positions={pos} hair={hair} radius={0.09} />
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial ref={lineMat} color="#e0a040" transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

function HeatPanel({ temp, heating }: { temp: React.RefObject<number>; heating: React.RefObject<boolean> }) {
  const [t, setT] = useState(temp.current);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setT(temp.current), 80);
    return () => clearInterval(id);
  }, [temp]);
  const start = () => {
    heating.current = true;
    setHold(true);
  };
  const stop = () => {
    heating.current = false;
    setHold(false);
  };
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps
  const k = Math.max(0, Math.min(1, (t - 10) / 40));
  const ok = t >= 30 && t <= 34;
  return (
    <div className="panel">
      <div className="meter" data-testid="temp">
        おんど <b style={{ fontSize: 24, color: ok ? '#3f8f45' : t > 34 ? '#e2574c' : undefined }}>{Math.round(t)}ど</b> {ok ? 'ちょうどいい！' : t > 34 ? 'あつい！' : ''}
        <div className="bar">
          <span className="zone" style={{ left: '50%', width: '10%' }} />
          <i style={{ width: `${k * 100}%`, background: 'linear-gradient(90deg,#7cc8f5,#ffd34d,#ff7043)' }} />
        </div>
      </div>
      <button
        className="btn big pink"
        data-testid="heat"
        style={{ transform: hold ? 'translateY(4px)' : undefined }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          start();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        🔥 あたためる
      </button>
    </div>
  );
}
