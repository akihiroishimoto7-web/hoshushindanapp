import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { script } from './script';
import { CHEESES, type CheeseInfo } from './cheeses';
import { useChapterStart } from '../../game/useChapter';
import { useBus } from '../../game/bus';
import { dialog } from '../../game/dialog';
import { say } from '../../game/say';
import { useProgress } from '../../game/progress';
import { agedLook, agingMaxDays, DEFAULT_CHEESE, formatDays, MARK_COLOR, TYPE_NAME } from '../../game/cheese';
import { setShot } from '../../three/CameraRig';
import { BlobShadow, Tappable } from '../../three/common';
import { fx } from '../../three/fx';
import { useTarget } from '../../three/targets';
import { MilkCat } from '../../three/characters/MilkCat';
import { CheeseBlock, CheeseWheel, Mozzarella } from '../../three/props/Cheese';
import { plasterTex, stripeTex, textTex, woodTex } from '../../three/tex';
import { playSfx } from '../../audio/sfx';
import { ui } from '../../ui/tunnel';
import { parseRuby } from '../../game/ruby';
import { RubyText } from '../../ui/RubyText';

const SLOT_X = [-3.0, -1.8, -0.6, 0.6, 1.8, 3.0];
const SHELF_Z = -1.0;
const SHELF_Y = 0.98;
const OVERVIEW: [THREE.Vector3Tuple, THREE.Vector3Tuple] = [
  [0, 3.1, 7.8],
  [0, 1.2, -0.8],
];
// 図鑑の ならび（まんなかは きみの チーズ）
const ORDER = ['mozzarella', 'camembert', 'mine', 'cheddar', 'emmental', 'blue'];

export default function ShopScene() {
  useChapterStart(script);
  const cheese = useProgress((s) => s.cheese) ?? DEFAULT_CHEESE;
  const [placed, setPlaced] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [cut, setCut] = useState(false);
  const [zoom, setZoom] = useState(1);
  const seen = useRef(new Set<string>());
  const rot = useRef({ x: 0.25, y: 0.5, vx: 0, vy: 0 });
  const basketRef = useTarget('basket');
  const shelfRef = useTarget('shelf');
  const { gl } = useThree();

  useLayoutEffect(() => {
    setShot([0.6, 3.0, 8.4], OVERVIEW[1], { immediate: true, fit: 0.85 });
    setTimeout(() => setShot(OVERVIEW[0], OVERVIEW[1], { fit: 1, speed: 1.2 }), 100);
  }, []);
  useBus('cam:all', () => {
    setSel(null);
    setShot(OVERVIEW[0], OVERVIEW[1], { fit: 1 });
  });

  // 図鑑モード: カメラを チーズの まえへ
  const slotOf = (id: string) => SLOT_X[ORDER.indexOf(id)] ?? 0;
  useEffect(() => {
    if (!sel) return;
    const x = slotOf(sel);
    const d = 2.4 / zoom;
    setShot([x, SHELF_Y + 0.5 + 0.6 / zoom, SHELF_Z + d], [x, SHELF_Y + 0.35, SHELF_Z], { fit: 0.55, speed: 3, sway: 0.2 });
  }, [sel, zoom]);

  // ゆびで まわす（図鑑モードのときだけ）
  useEffect(() => {
    if (!sel) return;
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const pts = new Map<number, { x: number; y: number }>();
    let pinch0 = 0;
    let zoom0 = 1;
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      last = { x: e.clientX, y: e.clientY };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
        zoom0 = zoom;
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch0 > 0) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        setZoom(THREE.MathUtils.clamp((zoom0 * d) / pinch0, 0.7, 2.2));
        return;
      }
      if (!last) return;
      rot.current.vy = (e.clientX - last.x) * 0.012;
      rot.current.vx = (e.clientY - last.y) * 0.008;
      rot.current.y += rot.current.vy;
      rot.current.x = THREE.MathUtils.clamp(rot.current.x + rot.current.vx, -0.6, 1.2);
      last = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = 0;
      last = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => THREE.MathUtils.clamp(z * (e.deltaY > 0 ? 0.9 : 1.1), 0.7, 2.2));
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [sel, gl, zoom]);

  const open = (id: string) => {
    if (id === 'mine' && !placed) return;
    if (dialog.isTask('place')) return;
    if (sel === id) return;
    playSfx('pop');
    rot.current = { x: 0.25, y: 0.5, vx: 0, vy: 0 };
    setCut(false);
    setZoom(1);
    setSel(id);
  };
  const close = () => {
    if (sel && sel !== 'mine') seen.current.add(sel);
    setSel(null);
    setCut(false);
    setShot(OVERVIEW[0], OVERVIEW[1], { fit: 1 });
    if (dialog.isTask('inspect')) {
      const left = 3 - seen.current.size;
      dialog.setProgress(left > 0 ? `あと ${left}` : undefined);
      if (left <= 0) setTimeout(() => dialog.completeTask('inspect'), 400);
    }
  };

  const place = () => {
    if (!dialog.isTask('place') || placed) {
      if (!placed) dialog.side(say('かごの なかに、 きみの チーズが まってるよ。'));
      return;
    }
    setPlaced(true);
    playSfx('stamp');
    fx.burst([slotOf('mine'), SHELF_Y + 0.6, SHELF_Z], { star: true, count: 30, color: ['#ffd34d', '#ffffff', '#ff8fa3', MARK_COLOR[cheese.mark]], speed: 2.6, gravity: 0.7, life: 1.4, size: 0.4 });
    setTimeout(() => dialog.completeTask('place'), 900);
  };

  const aged = Math.min(1, cheese.agedDays / agingMaxDays(cheese.type));
  const al = agedLook(cheese.type, aged);
  const mold = cheese.type === 'soft' && cheese.agedDays > 3 ? 1 : 0;

  const model = (id: string, isCut: boolean): ReactNode => {
    switch (id) {
      case 'mozzarella':
        return (
          <group>
            <mesh position-y={0.03}>
              <cylinderGeometry args={[0.42, 0.36, 0.06, 28]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <Mozzarella r={0.24} position={[0, 0.27, 0]} cut={isCut} />
          </group>
        );
      case 'camembert':
        return <CheeseWheel radius={0.42} height={0.3} rind="#f8f3e6" paste="#f6dd96" inside="creamy" mold={isCut ? 0 : 1} position={[0, 0.15, 0]} cut={isCut} />;
      case 'cheddar':
        return <CheeseBlock size={[0.8, 0.45, 0.55]} color="#f2952c" position={[0, 0.23, 0]} cut={isCut} />;
      case 'emmental':
        return <CheeseWheel radius={0.55} height={0.4} rind="#e6b44a" paste="#f7dc8c" inside="holes" position={[0, 0.2, 0]} cut={isCut} />;
      case 'blue':
        return <CheeseWheel radius={0.45} height={0.36} rind="#d8c39a" paste="#f6efd9" inside="veins" position={[0, 0.18, 0]} cut={isCut} />;
      case 'mine':
        return (
          <CheeseWheel
            radius={al.radius * al.shrink}
            height={al.height * al.shrink * al.sag}
            rind={al.rind}
            paste={al.paste}
            inside={cheese.type === 'soft' && aged > 0.5 ? 'creamy' : 'plain'}
            mold={isCut ? 0 : mold}
            mark={cheese.mark}
            markColor={MARK_COLOR[cheese.mark]}
            rough={al.rough}
            position={[0, (al.height * al.shrink * al.sag) / 2, 0]}
            cut={isCut}
          />
        );
    }
    return null;
  };

  const info: CheeseInfo | null = sel && sel !== 'mine' ? CHEESES.find((c) => c.id === sel) ?? null : null;

  return (
    <>
      <ShopRoom />
      {/* チーズの たな */}
      <group position={[0, 0, SHELF_Z]} ref={shelfRef}>
        <DisplayTable />
      </group>
      {ORDER.map((id) => {
        if (id === 'mine' && !placed) return null;
        const x = slotOf(id);
        const isSel = sel === id;
        return (
          <Spinner key={id} name={'cheese-' + id} active={isSel} rot={rot} position={[x, SHELF_Y, SHELF_Z]}>
            <Tappable onTap={() => open(id)} bounce={0.08}>
              {model(id, isSel && cut)}
            </Tappable>
            {id === 'mine' && !isSel && <Crown />}
          </Spinner>
        );
      })}
      {/* かご */}
      {!placed && (
        <group position={[1.6, 0, 2.2]} ref={basketRef}>
          <Tappable onTap={place}>
            <Basket>{model('mine', false)}</Basket>
          </Tappable>
        </group>
      )}

      <MilkCat
        position={[-2.0, 0, 1.6]}
        rotationY={0.5}
        onTap={() => {
          playSfx('meow');
          dialog.side(say('きみの チーズ、 おきゃくさんに だいにんき だニャ！', 'excited'));
        }}
      />
      <Customer variant="gray" scarf="#7cc8f5" start={[3.4, 0, 2.4]} line="この チーズ、 パンに のせて たべたいニャ〜。" seed={1} />
      <Customer variant="white" scarf="#ff8fa3" start={[-3.4, 0, 2.8]} line="あなの あいた チーズ、 おもしろい かたち！" seed={2} />

      {sel && (
        <ui.In>
          <InfoCard
            info={info}
            mine={sel === 'mine' ? cheese : null}
            cut={cut}
            onCut={() => {
              setCut((c) => !c);
              playSfx('cut');
            }}
            onZoom={(k) => setZoom((z) => THREE.MathUtils.clamp(z * k, 0.7, 2.2))}
            onClose={close}
          />
        </ui.In>
      )}
    </>
  );
}

/** 図鑑モードで えらばれた チーズを まわす */
function Spinner({ children, active, rot, position, name }: { children: ReactNode; name: string; active: boolean; rot: React.RefObject<{ x: number; y: number; vx: number; vy: number }>; position: THREE.Vector3Tuple }) {
  const g = useRef<THREE.Group>(null);
  const reg = useTarget(name);
  useFrame((st, dt) => {
    if (!g.current) return;
    if (active) {
      const r = rot.current;
      g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, r.y, 0.3);
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, r.x, 0.3);
      g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, position[1] + 0.25, 1 - Math.exp(-6 * dt));
    } else {
      g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, Math.sin(st.clock.elapsedTime * 0.4 + position[0]) * 0.3, 0.05);
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, 0, 0.1);
      g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, position[1], 1 - Math.exp(-6 * dt));
    }
  });
  return (
    <group
      ref={(o) => {
        g.current = o;
        reg(o);
      }}
      position={position}
    >
      {children}
    </group>
  );
}

function Crown() {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) {
      g.current.rotation.y = st.clock.elapsedTime;
      g.current.position.y = 1.0 + Math.sin(st.clock.elapsedTime * 2) * 0.06;
    }
  });
  return (
    <group ref={g}>
      <mesh>
        <cylinderGeometry args={[0.16, 0.13, 0.12, 6, 1, true]} />
        <meshStandardMaterial color="#ffd34d" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos((i / 6) * Math.PI * 2) * 0.15, 0.1, Math.sin((i / 6) * Math.PI * 2) * 0.15]}>
          <coneGeometry args={[0.035, 0.1, 6]} />
          <meshStandardMaterial color="#ffd34d" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Basket({ children }: { children: ReactNode }) {
  return (
    <group>
      <BlobShadow size={1.3} />
      <mesh position-y={0.22}>
        <cylinderGeometry args={[0.6, 0.48, 0.44, 20, 1, true]} />
        <meshStandardMaterial color="#d9a066" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position-y={0.03}>
        <cylinderGeometry args={[0.48, 0.48, 0.04, 20]} />
        <meshStandardMaterial color="#c58b52" />
      </mesh>
      <mesh position-y={0.46} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.6, 0.035, 8, 28]} />
        <meshStandardMaterial color="#b97a45" />
      </mesh>
      <mesh position-y={0.5} rotation-z={Math.PI / 2} scale={[1, 1, 1]}>
        <torusGeometry args={[0.6, 0.03, 8, 28, Math.PI]} />
        <meshStandardMaterial color="#b97a45" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1, 0.02, 0.8]} />
        <meshStandardMaterial color="#ff8fa3" />
      </mesh>
      <group position-y={0.32}>{children}</group>
    </group>
  );
}

function Customer({ variant, scarf, start, line, seed }: { variant: 'gray' | 'white'; scarf: string; start: THREE.Vector3Tuple; line: string; seed: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime * 0.25 + seed * 2;
    g.current.position.set(start[0] + Math.sin(t) * 0.7, 0, start[2] + Math.cos(t * 1.3) * 0.3);
    g.current.rotation.y = Math.PI + Math.cos(t) * 0.6 + (start[0] > 0 ? -0.5 : 0.5);
  });
  return (
    <MilkCat
      groupRef={g}
      variant={variant}
      hat={false}
      apron={false}
      scarf={scarf}
      controlled={false}
      face="happy"
      faceCamera={false}
      scale={0.9}
      seed={seed}
      onTap={() => {
        playSfx('meow');
        dialog.side([{ t: 'say', who: 'narrator', text: `おきゃくさん「${line}」` }]);
      }}
    />
  );
}

function DisplayTable() {
  const wood = woodTex('#c58b52', '#8c5b32', 'disp', 4);
  return (
    <group>
      <BlobShadow size={8.5} opacity={0.2} />
      <mesh position={[0, SHELF_Y / 2, 0]}>
        <boxGeometry args={[7.4, SHELF_Y - 0.04, 1.2]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      <mesh position={[0, SHELF_Y - 0.01, 0]}>
        <boxGeometry args={[7.6, 0.06, 1.35]} />
        <meshStandardMaterial color="#fff6e6" roughness={0.9} />
      </mesh>
      {SLOT_X.map((x, i) => (
        <mesh key={x} position={[x, SHELF_Y + 0.02, 0.45]}>
          <boxGeometry args={[0.5, 0.06, 0.05]} />
          <meshStandardMaterial color={['#ff8fa3', '#7cc8f5', '#ffd34d', '#7cc576', '#b38cff', '#ff9f43'][i]} />
        </mesh>
      ))}
    </group>
  );
}

function ShopRoom() {
  const floor = useMemo(() => {
    const t = woodTex('#e0b07a', '#b07a45', 'shopfloor', 8).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const wall = plasterTex('#fff0f3', 'shopwall');
  const awning = stripeTex('#ff8fa3', '#ffffff', 'awning', 12);
  const sign = textTex('ねこの チーズショップ', { w: 768, h: 160, bg: '#fff8e1', color: '#8c4a2a', size: 72, border: '#f2a91f', key: 'shopsign' });
  return (
    <group>
      <color attach="background" args={['#fff3e6']} />
      <hemisphereLight args={['#fff8ec', '#d9a066', 1.25]} />
      <directionalLight position={[3, 8, 6]} intensity={1.8} color="#fff4e0" />
      <pointLight position={[0, 3.6, 1]} intensity={10} distance={10} color="#ffe2b0" />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial map={floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3, -3.5]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, 3, 0]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}>
          <planeGeometry args={[12, 6]} />
          <meshStandardMaterial map={wall} roughness={0.95} />
        </mesh>
      ))}
      {/* 看板と ひさし */}
      <mesh position={[0, 4.1, -3.4]}>
        <planeGeometry args={[4.8, 1.0]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      <mesh position={[0, 3.35, -2.9]} rotation-x={0.5}>
        <planeGeometry args={[7.5, 1.2]} />
        <meshStandardMaterial map={awning} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      {/* うしろの たな */}
      {[-4.6, 4.6].map((x) => (
        <group key={x} position={[x, 0, -2.9]}>
          {[0.6, 1.5, 2.4].map((y) => (
            <mesh key={y} position-y={y}>
              <boxGeometry args={[2.2, 0.08, 0.7]} />
              <meshStandardMaterial color="#c58b52" />
            </mesh>
          ))}
          {[0.6, 1.5, 2.4].map((y, j) =>
            [-0.6, 0.1, 0.7].map((dx, k) => (
              <mesh key={`${y}${k}`} position={[dx, y + 0.17, 0]}>
                <cylinderGeometry args={[0.28, 0.28, 0.26, 18]} />
                <meshStandardMaterial color={['#e9b949', '#f8f3e6', '#f2952c', '#d8c39a', '#f2d27a'][(j * 3 + k) % 5]} roughness={0.7} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {/* ガーランド */}
      <Bunting />
      {/* 鉢植え */}
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, -2.4]}>
          <mesh position-y={0.3}>
            <cylinderGeometry args={[0.35, 0.28, 0.6, 14]} />
            <meshStandardMaterial color="#d9734f" />
          </mesh>
          <mesh position-y={0.95}>
            <icosahedronGeometry args={[0.6, 1]} />
            <meshStandardMaterial color="#6cc070" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Bunting() {
  const colors = ['#ff8fa3', '#ffd34d', '#7cc8f5', '#7cc576', '#b38cff'];
  return (
    <group position={[0, 4.9, -2.2]}>
      {Array.from({ length: 15 }, (_, i) => {
        const x = -6.3 + i * 0.9;
        const y = -Math.sin((i / 14) * Math.PI) * 0.5;
        return (
          <mesh key={i} position={[x, y, 0]} rotation-z={Math.PI}>
            <coneGeometry args={[0.25, 0.5, 3]} />
            <meshStandardMaterial color={colors[i % colors.length]} />
          </mesh>
        );
      })}
    </group>
  );
}

function InfoCard({
  info,
  mine,
  cut,
  onCut,
  onZoom,
  onClose,
}: {
  info: CheeseInfo | null;
  mine: ReturnType<typeof useProgress.getState>['cheese'];
  cut: boolean;
  onCut: () => void;
  onZoom: (k: number) => void;
  onClose: () => void;
}) {
  const tools = (
    <div className="tools">
      <button className="btn" onClick={onCut} data-testid="cut">
        {cut ? '🧀 もとに もどす' : '🔪 きって なかを みる'}
      </button>
      <button className="btn sub" onClick={() => onZoom(1.25)} aria-label="おおきく">
        ＋
      </button>
      <button className="btn sub" onClick={() => onZoom(0.8)} aria-label="ちいさく">
        －
      </button>
      <button className="btn pink" onClick={onClose} data-testid="close">
        とじる
      </button>
    </div>
  );
  if (mine) {
    const steps = [
      `カードを ${mine.curdSize === 'big' ? 'おおきめ' : mine.curdSize === 'small' ? 'こまかく' : 'ふつうの おおきさ'}に きった（${mine.cuts}かい）`,
      'かきまぜて、 ホエイを ぬいた',
      mine.pressed ? 'かたに つめて ぎゅっと おした' : 'かたに つめて、 おさずに ひっくりかえした',
      `しおを ${mine.salt}かい ふった`,
      mine.agedDays > 0 ? `${formatDays(mine.agedDays)} じゅくせい させた` : 'まだ じゅくせい していない',
    ];
    return (
      <div className="info-card" data-testid="info">
        <h3>👑 きみの チーズ</h3>
        <div className="tags">
          <span>{TYPE_NAME[mine.type]}</span>
          <span>ぎゅうにゅう</span>
          <span>{mine.pressed ? 'おした' : 'おさない'}</span>
        </div>
        <ol>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <div className="fact">ゆびで まわしたり、 ふたゆびで おおきく したり できるよ。</div>
        {tools}
      </div>
    );
  }
  if (!info) return null;
  return (
    <div className="info-card" data-testid="info">
      <h3>{info.name}</h3>
      <div className="tags">
        <span>🥛 {info.milk}</span>
        <span>⏳ {info.aging}</span>
        <span>✋ {info.texture}</span>
      </div>
      <ol>
        {info.steps.map((s) => (
          <li key={s}>
            <RubyText segs={parseRuby(s)} />
          </li>
        ))}
      </ol>
      <div className="fact">💡 {info.fact}</div>
      {tools}
    </div>
  );
}
