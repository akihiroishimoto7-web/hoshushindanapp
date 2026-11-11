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

/**
 * ふちほど 不透明で 明るく、まんなかほど すける（フレネル）。
 * 顕微鏡で 見た つぶや、液体の ふちの 見え方を まねる。
 */
export function withFresnelAlpha<T extends THREE.MeshStandardMaterial>(m: T, inner = 0.25, edge = 0.95, power = 2.2, edgeGlow = 0.25, glowColor: THREE.ColorRepresentation = '#ffffff'): T {
  const gc = new THREE.Color(glowColor);
  m.transparent = true;
  m.depthWrite = false;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.fInner = { value: inner };
    sh.uniforms.fEdge = { value: edge };
    sh.uniforms.fPow = { value: power };
    sh.uniforms.fGlow = { value: edgeGlow };
    sh.uniforms.fGlowC = { value: gc };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float fInner;\nuniform float fEdge;\nuniform float fPow;\nuniform float fGlow;\nuniform vec3 fGlowC;')
      .replace(
        '#include <opaque_fragment>',
        `float fr = pow(1.0 - saturate(abs(dot(normal, normalize(vViewPosition)))), fPow);
         outgoingLight += fGlowC * fr * fGlow;
         diffuseColor.a *= mix(fInner, fEdge, fr);
         #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => `fa:${inner}:${edge}:${power}:${edgeGlow}:${gc.getHexString()}`;
  return m;
}
