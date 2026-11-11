import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { script, catChatter } from './script';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog, useDialog } from '../../game/dialog';
import { followShot, setShot } from '../../three/CameraRig';
import { Motes, SkyDome, Tappable } from '../../three/common';
import { Clover, Mouse, SecretSpot } from '../../three/props/Secrets';
import { fx } from '../../three/fx';
import { targetWorldPos, useTarget } from '../../three/targets';
import { DistantHills, Barn, Birds, Butterflies, CatHouse, CheeseHouse, Clouds, FarmLights, Fence, Flowers, Grass, Ground, Trees, Windmill } from '../../three/env/Farm';
import { MilkCat } from '../../three/characters/MilkCat';
import { Girl } from '../../three/characters/Girl';
import { Cow } from '../../three/characters/Cow';
import { glassMat, MilkCan, milkMat, Table } from '../../three/props/Kitchen';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';
import { say } from '../../game/say';
import { parseRuby } from '../../game/ruby';
import { RubyText } from '../../ui/RubyText';

// ---- 配置 ----
const COW1: THREE.Vector3Tuple = [-3.6, 0, -2.4];
const CALF: THREE.Vector3Tuple = [-5.9, 0, -0.4];
const COW2: THREE.Vector3Tuple = [3.2, 0, -5.4];
const TABLE: THREE.Vector3Tuple = [-1.6, 0, 3.0];
const CAN: THREE.Vector3Tuple = [-2.9, 0, 3.4];
const HOUSE: THREE.Vector3Tuple = [9.5, 0, -2.5];
const HOUSE_ROT = -0.95;
const DOOR = new THREE.Vector3(HOUSE[0] + 3.7 * Math.sin(HOUSE_ROT), 0, HOUSE[2] + 3.7 * Math.cos(HOUSE_ROT));
const START = new THREE.Vector3(0.5, 0, 7.5);

const PATH: [number, number][] = [
  [0.5, 9],
  [0.8, 5],
  [3, 2],
  [DOOR.x, DOOR.z],
  [HOUSE[0] + 2.5 * Math.sin(HOUSE_ROT), HOUSE[2] + 2.5 * Math.cos(HOUSE_ROT)],
];
const AVOID: [number, number, number][] = [
  [COW1[0], COW1[2], 1.8],
  [COW2[0], COW2[2], 1.8],
  [-11, -5, 4.5],
  [HOUSE[0], HOUSE[2], 4.2],
  [TABLE[0], TABLE[2], 1.2],
];
const OBSTACLES: [number, number, number][] = [
  [COW1[0], COW1[2], 1.3],
  [CALF[0], CALF[2], 0.8],
  [COW2[0], COW2[2], 1.3],
  [-11, -5, 3.8],
  [HOUSE[0], HOUSE[2], 3.4],
  [TABLE[0], TABLE[2], 0.9],
  [-14, -18, 2],
];
const TREES: [number, number, number][] = [
  [-8, 6, 1],
  [8, 7, 1.15],
  [-12, 3, 1.25],
  [14, 4, 1],
  [-6, -12, 1.2],
  [6, -13, 1.1],
  [15, -8, 1.3],
  [-16, -6, 1.1],
  [0, -16, 1.3],
  [11, 11, 1],
  [-11, 11, 1.1],
];
const FENCE: [number, number][] = [
  [-9, 1.5],
  [-9, -8.5],
  [7, -8.5],
  [7, -2.5],
];
const LIMIT = 13.5;

export default function FarmScene() {
  useChapterStart(script);
  const girl = useRef<THREE.Group>(null);
  const cat = useRef<THREE.Group>(null);
  const target = useRef(START.clone());
  const cam = useRef<'follow' | 'fixed'>('fixed');
  const [carry, setCarry] = useState(false);
  const [legend, setLegend] = useState(false);
  const [poured, setPoured] = useState(false);
  const [doorOpen, setDoorOpen] = useState(0);
  const mooCow1 = useRef(0);
  const mooCow2 = useRef(0);
  const mooCalf = useRef(0);
  const chatter = useRef(0);
  const clock = useRef(0);
  const delivered = useRef(false);

  const cow1Ref = useTarget('cow1');
  const glassRef = useTarget('glass');
  const canRef = useTarget('can');
  const doorRef = useTarget('door');
  const calfRef = useTarget('calf');

  // はじめの カメラ
  useLayoutEffect(() => {
    setShot([START.x + 1.6, 2.2, START.z + 4.2], [START.x + 0.9, 1.1, START.z - 0.4], { immediate: true, fit: 0.7 });
  }, []);

  useBus('cam:follow', () => (cam.current = 'follow'));
  useBus('cam:cow', () => {
    cam.current = 'fixed';
    setShot([COW1[0] + 2.5, 2.8, COW1[2] + 5.5], [COW1[0], 1.1, COW1[2]], { fit: 0.8 });
  });
  useBus('cam:calf', () => {
    cam.current = 'fixed';
    setShot([CALF[0] + 3.4, 2.2, CALF[2] + 3.6], [CALF[0] + 0.6, 0.8, CALF[2] - 0.6], { fit: 0.7 });
    mooCalf.current = clock.current;
    playSfx('mooSmall');
  });
  useBus('cam:door', () => {
    cam.current = 'fixed';
    setDoorOpen(1);
    playSfx('door');
    setShot([DOOR.x - 5.5, 3.2, DOOR.z + 6.5], [DOOR.x + 0.6, 1.6, DOOR.z - 1.2], { fit: 0.6 });
  });
  useBus('showLegend', () => setLegend(true));
  useBus('hideLegend', () => setLegend(false));
  useBus('task', (id) => {
    if (id === 'tapGlass' || id === 'pickCan' || id === 'touchCow' || id === 'deliver') cam.current = 'follow';
  });

  const walkTo = (p: THREE.Vector3) => {
    const v = new THREE.Vector3(p.x, 0, p.z);
    if (v.length() > LIMIT) v.setLength(LIMIT);
    target.current.copy(v);
  };

  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 14) return;
    if (useDialog.getState().line) return;
    walkTo(e.point);
    fx.burst([e.point.x, e.point.y + 0.05, e.point.z], { count: 6, color: '#ffffff', speed: 1, size: 0.25, life: 0.5, gravity: 1 });
  };

  /** 近くに よってから 動く */
  const approach = (p: THREE.Vector3Tuple, dist = 1.9) => {
    if (!girl.current) return;
    const g = girl.current.position;
    const d = new THREE.Vector3(g.x - p[0], 0, g.z - p[2]);
    if (d.length() > dist + 0.3) {
      d.setLength(dist);
      walkTo(new THREE.Vector3(p[0] + d.x, 0, p[2] + d.z));
    }
  };

  const tapCow1 = () => {
    mooCow1.current = clock.current;
    playSfx('moo');
    approach(COW1, 2.4);
    if (dialog.isTask('touchCow')) {
      dialog.completeTask('touchCow');
    } else dialog.side(say('モ〜！ ホルスタインさん、 きょうも ごきげんだニャ。'));
  };
  const tapCow2 = () => {
    mooCow2.current = clock.current;
    playSfx('moo');
    approach(COW2, 2.4);
    dialog.side([
      {
        t: 'say',
        text: 'この ちゃいろい うしさんは ジャージー。 あぶらが おおめの、 こい ぎゅうにゅうを だすんだニャ。',
        face: 'happy',
      },
    ]);
  };
  const tapCalf = () => {
    mooCalf.current = clock.current;
    playSfx('mooSmall');
    dialog.side(say('こうしは おかあさんの おちちを のんで、 すくすく おおきく なるんだよ。', 'gentle'));
  };
  const tapCat = () => {
    playSfx('meow');
    const line = catChatter[chatter.current++ % catChatter.length];
    dialog.side(say(line, 'wink'));
  };
  const tapGlass = () => {
    approach(TABLE, 1.7);
    if (dialog.isTask('tapGlass')) {
      setPoured(true);
      playSfx('sparkle');
      fx.burst([TABLE[0], 1.4, TABLE[2]], { star: true, count: 18, color: ['#ffffff', '#ffd34d', '#7cc8f5'], speed: 2, life: 1.2, gravity: 0.5, size: 0.35 });
      setShot([TABLE[0] + 0.3, 2.5, TABLE[2] + 2.3], [TABLE[0], 1.05, TABLE[2]], { fit: 0.75 });
      cam.current = 'fixed';
      dialog.completeTask('tapGlass');
    } else if (!poured) {
      dialog.side(say('しぼりたての ぎゅうにゅう。 あとで いっしょに しらべようニャ。'));
    }
  };
  const tapCan = () => {
    if (dialog.isTask('pickCan')) {
      approach(CAN, 1.2);
      setCarry(true);
      playSfx('pop');
      dialog.completeTask('pickCan');
    } else if (!carry) {
      dialog.side(say('ぎゅうにゅうが たっぷり はいった ミルクかん。 おもたいぞ〜。'));
    }
  };

  // 女の子の歩き・ねこの追従・カメラ
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), c: new THREE.Vector3(), l: new THREE.Vector3() }), []);
  useFrame((st, dt0) => {
    const dt = Math.min(dt0, 0.05);
    clock.current = st.clock.elapsedTime;
    const g = girl.current;
    const c = cat.current;
    if (!g || !c) return;
    // 歩く
    const to = tmp.v.copy(target.current).sub(g.position);
    to.y = 0;
    const dist = to.length();
    if (dist > 0.05) {
      const step = Math.min(dist, 3.2 * dt);
      to.setLength(step);
      g.position.add(to);
      const yaw = Math.atan2(to.x, to.z);
      g.rotation.y = lerpAngle(g.rotation.y, yaw, 1 - Math.exp(-10 * dt));
    }
    // ぶつからないように
    for (const [ox, oz, r] of OBSTACLES) {
      const dx = g.position.x - ox;
      const dz = g.position.z - oz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        g.position.x = ox + (dx / (d || 1)) * r;
        g.position.z = oz + (dz / (d || 1)) * r;
        if (target.current.distanceTo(g.position) < 3) target.current.copy(g.position);
      }
    }
    // ねこは 女の子の となりへ
    const side = tmp.c.set(1.1, 0, 0.5).applyAxisAngle(THREE.Object3D.DEFAULT_UP, 0).add(g.position);
    const cd = side.distanceTo(c.position);
    if (cd > 0.3) {
      const sp = Math.min(cd, (cd > 3 ? 4.2 : 3) * dt);
      const dir = side.sub(c.position).setLength(sp);
      c.position.add(dir);
      c.rotation.y = lerpAngle(c.rotation.y, Math.atan2(dir.x, dir.z), 1 - Math.exp(-8 * dt));
    } else {
      c.rotation.y = lerpAngle(c.rotation.y, 0, 1 - Math.exp(-3 * dt));
    }
    // とびらに とうちゃく
    if (carry && !delivered.current && dialog.isTask('deliver') && Math.hypot(g.position.x - DOOR.x, g.position.z - DOOR.z) < 2.2) {
      delivered.current = true;
      setCarry(false);
      dialog.completeTask('deliver');
    }
    if (cam.current === 'follow') {
      tmp.l.copy(g.position).add(new THREE.Vector3(0, 1.0, -0.6));
      // いまの もくひょうが 画面に入るように、すこし そちらへ 向ける
      const tg = useDialog.getState().task?.target;
      const tp = tg ? targetWorldPos(tg) : null;
      if (tp) {
        const bias = tmp.v.set(tp.x - g.position.x, 0, tp.z - g.position.z);
        const len = bias.length();
        if (len > 1) tmp.l.add(bias.multiplyScalar(Math.min(0.5, 2.6 / len)));
      }
      tmp.c.copy(tmp.l).add(new THREE.Vector3(0, 2.4, 6.0));
      followShot(tmp.c, tmp.l, 2.5);
    }
  });

  return (
    <>
      <FarmLights follow={girl} />
      <SkyDome />
      <Clouds />
      <DistantHills />
      <Motes count={70} area={[26, 4, 22]} center={[0, 2.2, 1]} color="#fff8c8" size={0.1} />
      <Mouse id="mouse1" position={[-0.55, 0, 3.75]} rotationY={0.5} scale={1.2} />
      <SecretSpot id="clover" position={[2.3, 0, 4.4]} hit={0.45}>
        <Clover />
      </SecretSpot>
      <Ground path={PATH} onTap={onGround} />
      <Grass avoid={AVOID} count={700} path={PATH} />
      <Flowers
        count={130}
        avoid={AVOID}
        onTap={(p) => {
          playSfx('sparkle');
          fx.burst([p.x, p.y + 0.2, p.z], { star: true, count: 10, color: ['#ffd34d', '#ff8fa3', '#ffffff'], speed: 1.6, life: 0.9, gravity: 0.3, size: 0.3 });
        }}
      />
      <Trees spots={TREES} />
      <Fence points={FENCE} />
      <Windmill
        position={[-14, 0, -18]}
        onTap={() => {
          playSfx('whoosh');
          dialog.side(say('ふうしゃは、 かぜの ちからで くるくる まわるよ。 タッチしたら はやく なったニャ！', 'surprised'));
        }}
      />
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 14) return;
          dialog.side(say('ここは なや。 うしさんの おうちで、 ほしくさも しまってあるんだ。'));
        }}
      >
        <Barn position={[-11, 0, -5]} rotationY={0.55} />
      </group>
      <CheeseHouse position={HOUSE} rotationY={HOUSE_ROT} doorOpen={doorOpen} />
      <group ref={doorRef} position={[DOOR.x, 0, DOOR.z]} />
      <CatHouse position={[14, -22]} rotationY={-0.4} />
      <CatHouse position={[22, -12]} wall="#e0f1ff" roof="#6cb8f0" rotationY={-1.1} />
      <CatHouse position={[-20, -18]} wall="#fff3c4" roof="#f29b30" rotationY={0.7} />
      <CatHouse position={[-24, 6]} wall="#e6ffe0" roof="#6cc070" rotationY={1.4} />
      <Birds onTap={() => playSfx('chirp')} />
      <Butterflies center={[-1, 1]} />

      <group ref={cow1Ref} position={COW1}>
        <Cow position={[0, 0, 0]} rotationY={0.8} seed={1} mooAt={mooCow1} onTap={tapCow1} />
      </group>
      <group ref={calfRef} position={CALF}>
        <Cow position={[0, 0, 0]} rotationY={1.4} scale={0.58} seed={2} mooAt={mooCalf} graze={false} onTap={tapCalf} />
      </group>
      <Cow kind="jersey" position={COW2} rotationY={-0.5} seed={3} mooAt={mooCow2} onTap={tapCow2} />

      {/* テーブルと コップ */}
      <group position={TABLE}>
        <Table w={1.3} d={0.9} h={0.75} />
        <group ref={glassRef} position={[0, 0.79, 0]}>
          <Tappable onTap={tapGlass}>
            <MilkGlass poured={poured} />
          </Tappable>
        </group>
      </group>

      {/* ミルクかん */}
      {!carry && !delivered.current && (
        <group ref={canRef} position={CAN}>
          <Tappable onTap={tapCan}>
            <MilkCan />
          </Tappable>
        </group>
      )}

      <Girl groupRef={girl} position={[START.x, 0, START.z]} carry={carry} holding={<MilkCan scale={0.5} shadow={false} />} />
      <MilkCat groupRef={cat} position={[START.x + 1.1, 0, START.z + 0.5]} onTap={tapCat} />

      {legend && (
        <ui.In>
          <MilkLegend />
        </ui.In>
      )}
    </>
  );
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ---- ぎゅうにゅうの なかみ（100こ の つぶ） ----
const PARTS = [
  { name: 'みず', n: 87, color: '#6cb8f0' },
  { name: '[乳糖:にゅうとう]（あまい）', n: 5, color: '#ffffff' },
  { name: 'あぶら', n: 4, color: '#ffd34d' },
  { name: '[タンパク質:たんぱくしつ]', n: 3, color: '#ff9f43' },
  { name: 'カルシウム など', n: 1, color: '#b38cff' },
];

function MilkGlass({ poured }: { poured: boolean }) {
  const balls = useRef<THREE.InstancedMesh>(null);
  const milk = useRef<THREE.Mesh>(null);
  const show = useRef(0);
  const data = useMemo(() => {
    const out: { p: THREE.Vector3; c: THREE.Color; ph: number }[] = [];
    let k = 0;
    PARTS.forEach((part) => {
      for (let i = 0; i < part.n; i++) {
        // 下から つみかさねる（らせん状）
        const layer = Math.floor(k / 10);
        const a = (k % 10) * 0.628 + layer * 0.3;
        const r = 0.08 + ((k * 7) % 3) * 0.05;
        out.push({
          p: new THREE.Vector3(Math.cos(a) * r, 0.06 + layer * 0.058, Math.sin(a) * r),
          c: new THREE.Color(part.color),
          ph: k * 0.37,
        });
        k++;
      }
    });
    // 色を まぜて 本物っぽく（どこにでも散らばっている）
    for (let i = out.length - 1; i > 0; i--) {
      const j = (i * 31) % (i + 1);
      const tmp = out[i].p;
      out[i].p = out[j].p;
      out[j].p = tmp;
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = balls.current;
    if (!m) return;
    data.forEach((d, i) => m.setColorAt(i, d.c));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((st, dt) => {
    show.current = THREE.MathUtils.lerp(show.current, poured ? 1 : 0, 1 - Math.exp(-3 * dt));
    const t = st.clock.elapsedTime;
    const m = balls.current;
    if (m) {
      m.visible = show.current > 0.02;
      data.forEach((d, i) => {
        const pop = THREE.MathUtils.clamp(show.current * 1.6 - (i / data.length) * 0.6, 0, 1);
        o.position.set(d.p.x + Math.sin(t * 1.4 + d.ph) * 0.01, d.p.y + Math.sin(t * 2 + d.ph) * 0.008, d.p.z);
        o.scale.setScalar(pop);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
    if (milk.current) {
      milk.current.scale.y = Math.max(0.001, 1 - show.current);
      milk.current.visible = show.current < 0.98;
    }
  });
  return (
    <group>
      <mesh ref={milk} material={milkMat} position-y={0.31}>
        <cylinderGeometry args={[0.235, 0.215, 0.6, 24]} />
      </mesh>
      <instancedMesh ref={balls} args={[undefined, undefined, data.length]} frustumCulled={false}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial roughness={0.35} />
      </instancedMesh>
      <mesh material={glassMat} position-y={0.36}>
        <cylinderGeometry args={[0.26, 0.23, 0.72, 24, 1, true]} />
      </mesh>
      <mesh material={glassMat} position-y={0.005}>
        <cylinderGeometry args={[0.23, 0.23, 0.01, 24]} />
      </mesh>
    </group>
  );
}

function MilkLegend() {
  return (
    <div className="panel top" style={{ top: 'calc(74px + var(--safe-t))' }}>
      <div className="legend" data-testid="legend">
        <h3>ぎゅうにゅう 100こ の つぶ だと……</h3>
        {PARTS.map((p) => (
          <div className="row" key={p.name}>
            <span className="dot" style={{ background: p.color, border: p.color === '#ffffff' ? '2px solid #ccc' : undefined }} />
            <RubyLine text={p.name} />
            <span className="num">{p.n}こ</span>
          </div>
        ))}
        <div className="note">※ だいたいの かず。 うしや きせつで かわるよ</div>
      </div>
    </div>
  );
}

function RubyLine({ text }: { text: string }) {
  return (
    <span>
      <RubyText segs={parseRuby(text)} />
    </span>
  );
}
