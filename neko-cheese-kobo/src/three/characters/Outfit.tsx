import { useMemo } from 'react';
import * as THREE from 'three';
import { bake, G } from '../bake';
import { bakedMat } from '../look';

/**
 * ミルクの きせかえ アクセサリー（頭の グループの 中に おく）。
 * hat=true のときは コック帽の うえ・まわりに あわせる。
 */
function starShape(r: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 ? r * 0.45 : r;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2 });
}

const starMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.2, roughness: 0.3, emissive: '#ffbb22', emissiveIntensity: 0.55 });
const shiny = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.75, roughness: 0.25 });

export function HeadOutfit({ id, hat }: { id: string; hat: boolean }) {
  const geo = useMemo(() => {
    switch (id) {
      case 'ribbon':
        return bake([
          { geo: G.sphere(0.075, 14, 10), color: '#ff7da0', pos: [-0.07, 0, 0], rot: [0, 0, 0.5], scale: [1.3, 0.75, 0.45] },
          { geo: G.sphere(0.075, 14, 10), color: '#ff7da0', pos: [0.07, 0, 0], rot: [0, 0, -0.5], scale: [1.3, 0.75, 0.45] },
          { geo: G.sphere(0.035, 10, 8), color: '#ff5c86', pos: [0, 0, 0.012] },
          { geo: G.cone(0.03, 0.09, 6), color: '#ff7da0', pos: [-0.03, -0.07, 0], rot: [0, 0, 0.35] },
          { geo: G.cone(0.03, 0.09, 6), color: '#ff7da0', pos: [0.03, -0.07, 0], rot: [0, 0, -0.35] },
        ]);
      case 'flowers': {
        const cols = ['#ffd34d', '#ff9fb4', '#ffffff', '#b38cff', '#ff9f43', '#7cc8f5', '#ff7da0', '#fff3a8'];
        const parts = [] as Parameters<typeof bake>[0];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const x = Math.cos(a) * 0.3;
          const z = Math.sin(a) * 0.3;
          for (let k = 0; k < 5; k++) {
            const b = (k / 5) * Math.PI * 2;
            parts.push({ geo: G.sphere(0.032, 8, 6), color: cols[i], pos: [x + Math.cos(b) * 0.034, 0, z + Math.sin(b) * 0.034], scale: [1, 0.45, 1] });
          }
          parts.push({ geo: G.sphere(0.022, 8, 6), color: '#ffb000', pos: [x, 0.012, z] });
          parts.push({ geo: G.sphere(0.03, 6, 5), color: '#5fae4e', pos: [Math.cos(a + 0.4) * 0.31, -0.01, Math.sin(a + 0.4) * 0.31], scale: [1.4, 0.35, 0.7] });
        }
        return bake(parts);
      }
      case 'glasses':
        return bake([
          { geo: G.torus(0.088, 0.012, 8, 24), color: '#c9922a', pos: [0.152, 0, 0] },
          { geo: G.torus(0.088, 0.012, 8, 24), color: '#c9922a', pos: [-0.152, 0, 0] },
          { geo: G.cyl(0.008, 0.008, 0.07, 6), color: '#c9922a', pos: [0, 0.02, 0], rot: [0, 0, Math.PI / 2] },
          { geo: G.cyl(0.007, 0.007, 0.26, 6), color: '#c9922a', pos: [0.245, 0.01, -0.13], rot: [Math.PI / 2, 0, 0] },
          { geo: G.cyl(0.007, 0.007, 0.26, 6), color: '#c9922a', pos: [-0.245, 0.01, -0.13], rot: [Math.PI / 2, 0, 0] },
        ]);
      case 'star':
        return bake([{ geo: starShape(0.085), color: '#ffd24a' }]);
      case 'crown': {
        const parts = [{ geo: G.cyl(0.14, 0.13, 0.08, 20, true), color: '#ffcc33' }] as Parameters<typeof bake>[0];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          parts.push({ geo: G.cone(0.035, 0.1, 6), color: '#ffcc33', pos: [Math.cos(a) * 0.13, 0.08, Math.sin(a) * 0.13] });
          parts.push({ geo: G.sphere(0.02, 8, 6), color: i % 2 ? '#ff5c86' : '#5ab0ff', pos: [Math.cos(a) * 0.135, 0.0, Math.sin(a) * 0.135] });
          parts.push({ geo: G.sphere(0.016, 6, 5), color: '#fff6c8', pos: [Math.cos(a) * 0.13, 0.135, Math.sin(a) * 0.13] });
        }
        return bake(parts);
      }
    }
    return null;
  }, [id]);
  if (!geo) return null;
  const metal = id === 'glasses' || id === 'crown';
  const mat = id === 'star' ? starMat : metal ? shiny : bakedMat(0.6, 0.35);
  switch (id) {
    case 'ribbon':
      return <mesh geometry={geo} material={mat} position={[0.3, 0.6, 0.2]} rotation={[0, 0.35, -0.35]} scale={1.9} />;
    case 'flowers':
      return <mesh geometry={geo} material={mat} position={[0, 0.5, 0.02]} rotation={[-0.32, 0, 0.06]} scale={[1.28, 1.6, 1.28]} />;
    case 'glasses':
      return <mesh geometry={geo} material={mat} position={[0, 0.27, 0.43]} rotation={[-0.06, 0, 0]} scale={1.18} />;
    case 'star':
      return <mesh geometry={geo} material={mat} position={[-0.3, 0.56, 0.24]} rotation={[0, -0.35, 0.25]} scale={1.9} />;
    case 'crown':
      return <mesh geometry={geo} material={mat} position={hat ? [0.03, 0.97, -0.08] : [0, 0.6, -0.02]} rotation={[-0.14, 0, 0.1]} scale={1.7} />;
  }
  return null;
}

/** せなかの マント（胴の グループの 中に おく） */
export function BodyOutfit({ id }: { id: string }) {
  const geo = useMemo(
    () =>
      id === 'cape'
        ? bake([
            { geo: new THREE.CylinderGeometry(0.33, 0.5, 0.6, 24, 4, true, Math.PI - 1.55, 3.1), color: '#e8404f', pos: [0, 0.4, -0.02] },
            { geo: G.torus(0.19, 0.022, 6, 18), color: '#ffcc33', pos: [0, 0.7, 0], rot: [Math.PI / 2, 0, 0] },
            { geo: G.sphere(0.035, 8, 6), color: '#ffcc33', pos: [0, 0.69, 0.2] },
          ])
        : null,
    [id],
  );
  const mat = useMemo(() => {
    const m = bakedMat(0.7, 0.35).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  if (!geo) return null;
  return <mesh geometry={geo} material={mat} />;
}
