import { useMemo } from 'react';
import * as THREE from 'three';
import { rng } from './tex';

/**
 * ほんものの毛のような ふわふわ（シェル法）。
 * 同じ形を 少しずつ ふくらませて 何枚も かさね、こまかい 点の 模様で くりぬくと、
 * 1本1本の 毛が 生えているように 見える。根もとは 暗く、毛先は 明るい。
 */
let noiseTex: THREE.Texture | null = null;
function furNoise() {
  if (noiseTex) return noiseTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const img = g.createImageData(128, 128);
  const r = rng(404);
  for (let i = 0; i < 128 * 128; i++) {
    const v = Math.floor(r() * 256);
    img.data.set([v, v, v, 255], i * 4);
  }
  g.putImageData(img, 0, 0);
  noiseTex = new THREE.CanvasTexture(c);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
  noiseTex.generateMipmaps = false;
  noiseTex.minFilter = THREE.NearestFilter;
  noiseTex.magFilter = THREE.NearestFilter;
  return noiseTex;
}

function shellMaterial(base: THREE.MeshStandardMaterial, layer: number, length: number, density: number, faceMask: boolean) {
  const m = new THREE.MeshStandardMaterial({ map: base.map, color: base.color, vertexColors: base.vertexColors, roughness: 1 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLayer = { value: layer };
    sh.uniforms.uLen = { value: length };
    sh.uniforms.uDensity = { value: density };
    sh.uniforms.uNoise = { value: furNoise() };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uLayer;\nuniform float uLen;\nvarying vec2 vFurUv;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec3 fn = normalize(objectNormal);
         float fl = uLen;
         ${faceMask ? 'fl *= 1.0 - 0.92 * smoothstep(0.15, 0.6, fn.z) * smoothstep(-0.75, -0.35, -abs(fn.y - 0.05));' : ''}
         transformed += fn * fl * uLayer;
         // 毛先は 重さで すこし たれる
         transformed.y -= uLayer * uLayer * fl * 0.45;
         vFurUv = uv;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLayer;\nuniform float uDensity;\nuniform sampler2D uNoise;\nvarying vec2 vFurUv;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float fnz = texture2D(uNoise, vFurUv * vec2(uDensity * 2.0, uDensity)).r;
         if (fnz < uLayer * uLayer * 0.9 + 0.08) discard;
         diffuseColor.rgb *= mix(0.72, 1.1, uLayer);`,
      );
  };
  m.customProgramCacheKey = () => `fur:${faceMask}`;
  return m;
}

const matCache = new Map<string, THREE.MeshStandardMaterial[]>();

export function FurShells({
  geometry,
  base,
  layers = 10,
  length = 0.045,
  density = 70,
  faceMask = false,
  id,
}: {
  geometry: THREE.BufferGeometry;
  base: THREE.MeshStandardMaterial;
  layers?: number;
  length?: number;
  density?: number;
  faceMask?: boolean;
  /** マテリアルを 使いまわす ための 名前 */
  id: string;
}) {
  const mats = useMemo(() => {
    const key = `${id}:${layers}:${length}:${density}:${faceMask}`;
    let m = matCache.get(key);
    if (!m) {
      m = Array.from({ length: layers }, (_, i) => shellMaterial(base, (i + 1) / layers, length, density, faceMask));
      matCache.set(key, m);
    }
    return m;
  }, [id, base, layers, length, density, faceMask]);
  return (
    <>
      {mats.map((m, i) => (
        // 影の計算には 入れない（rz: 質感の 自動処理を スキップ）
        <mesh key={i} geometry={geometry} material={m} userData={{ rz: true }} dispose={null} />
      ))}
    </>
  );
}
