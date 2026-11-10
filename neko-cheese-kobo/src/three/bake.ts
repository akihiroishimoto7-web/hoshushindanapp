import * as THREE from 'three';

/**
 * たくさんの小さなパーツを 1つのジオメトリに まとめる（頂点カラーつき）。
 * キャラクターや建物の ドローコールを へらして、スマホでも軽くする。
 */
export interface Part {
  geo: THREE.BufferGeometry;
  color?: THREE.ColorRepresentation;
  pos?: THREE.Vector3Tuple;
  rot?: THREE.Vector3Tuple;
  scale?: number | THREE.Vector3Tuple;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _n = new THREE.Matrix3();
const _v = new THREE.Vector3();
const _c = new THREE.Color();

export function bake(parts: Part[]): THREE.BufferGeometry {
  const geos = parts.map((p) => (p.geo.index ? p.geo.toNonIndexed() : p.geo));
  let n = 0;
  geos.forEach((g) => (n += g.attributes.position.count));
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  let o = 0;
  geos.forEach((g, i) => {
    const part = parts[i];
    _p.set(...(part.pos ?? [0, 0, 0]));
    _e.set(...(part.rot ?? [0, 0, 0]));
    _q.setFromEuler(_e);
    if (typeof part.scale === 'number') _s.setScalar(part.scale);
    else _s.set(...(part.scale ?? [1, 1, 1]));
    _m.compose(_p, _q, _s);
    _n.getNormalMatrix(_m);
    _c.set(part.color ?? '#ffffff');
    const P = g.attributes.position;
    const N = g.attributes.normal;
    const U = g.attributes.uv;
    for (let k = 0; k < P.count; k++) {
      _v.fromBufferAttribute(P, k).applyMatrix4(_m);
      pos.set([_v.x, _v.y, _v.z], (o + k) * 3);
      _v.fromBufferAttribute(N, k).applyMatrix3(_n).normalize();
      nor.set([_v.x, _v.y, _v.z], (o + k) * 3);
      col.set([_c.r, _c.g, _c.b], (o + k) * 3);
      if (U) uv.set([U.getX(k), U.getY(k)], (o + k) * 2);
    }
    o += P.count;
    if (g !== part.geo) g.dispose();
    part.geo.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

/** よく使う形の みじかい書き方 */
export const G = {
  sphere: (r: number, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z),
  cyl: (rt: number, rb: number, h: number, seg = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  cone: (r: number, h: number, seg = 10) => new THREE.ConeGeometry(r, h, seg),
  capsule: (r: number, len: number, seg = 8) => new THREE.CapsuleGeometry(r, len, 4, seg),
  torus: (r: number, tube: number, rs = 8, ts = 16, arc = Math.PI * 2) => new THREE.TorusGeometry(r, tube, rs, ts, arc),
  circle: (r: number, seg = 16) => new THREE.CircleGeometry(r, seg),
  plane: (w: number, h: number) => new THREE.PlaneGeometry(w, h),
  ico: (r: number, d = 1) => new THREE.IcosahedronGeometry(r, d),
};
