import * as THREE from 'three';

/**
 * 劇場アニメ風の「ふちの光（リムライト）」を マテリアルに足す。
 * ポストプロセスを使わず シェーダーに数行足すだけなので、スマホでも軽い。
 */
export function withRim<T extends THREE.MeshStandardMaterial>(m: T, color: THREE.ColorRepresentation = '#fff1d8', strength = 0.4, power = 2.6): T {
  const c = new THREE.Color(color);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: c };
    shader.uniforms.rimStrength = { value: strength };
    shader.uniforms.rimPower = { value: power };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;\nuniform float rimPower;')
      .replace(
        '#include <opaque_fragment>',
        `float rimF = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), rimPower);
         rimF *= 0.55 + 0.45 * normal.y;
         outgoingLight += rimColor * rimF * rimStrength;
         #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => `rim:${c.getHexString()}:${strength}:${power}`;
  return m;
}

const baked = new Map<string, THREE.MeshStandardMaterial>();
/** 頂点カラーで ぬる 共通マテリアル（bake() で まとめた メッシュ用） */
export function bakedMat(roughness = 0.8, rim = 0.3, metalness = 0): THREE.MeshStandardMaterial {
  const key = `${roughness}:${rim}:${metalness}`;
  let m = baked.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness });
    if (rim > 0) withRim(m, '#fff1d8', rim);
    baked.set(key, m);
  }
  return m;
}

let unlit: THREE.MeshBasicMaterial | null = null;
/** 目のハイライトなど、光に左右されない 頂点カラー */
export function unlitMat() {
  if (!unlit) unlit = new THREE.MeshBasicMaterial({ vertexColors: true });
  return unlit;
}
