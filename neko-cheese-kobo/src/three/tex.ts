import * as THREE from 'three';

/**
 * 画像ファイルを使わず、Canvas で その場に テクスチャを描く。
 * 同じものは キャッシュして 使いまわす（どの章でも共通の小さな画像）。
 */
const cache = new Map<string, THREE.Texture>();

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(
  key: string,
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { repeat?: [number, number]; srgb?: boolean } = {},
) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...opts.repeat);
  }
  t.anisotropy = 4;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/**
 * 茶トラ（ミルクの毛）。
 * 球の UV に あわせて、かおの 正面（u=0.25）は あかるく なめらかに、
 * おでこに 「M」の しま、うしろと よこに しま、ぜんたいに こまかい 毛の ながれ を描く。
 */
export function tabbyTex(base = '#f4a85c', stripe = '#d27a2c', key = 'tabby') {
  return make(key, 512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = rng(7);
    const fx = w * 0.25;
    // うしろ・よこの しま（かおの 正面は さける）
    g.strokeStyle = stripe;
    g.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const x = w * 0.5 + (i / 11) * w * 0.5 + r() * 10;
      g.lineWidth = 14 + r() * 12;
      g.globalAlpha = 0.85;
      g.beginPath();
      g.moveTo(x, h * 0.06);
      for (let y = h * 0.06; y <= h * 0.7; y += 24) g.lineTo(x + Math.sin(y * 0.03 + i) * 10, y);
      g.stroke();
    }
    // おでこの しま
    g.globalAlpha = 0.9;
    [-0.055, 0, 0.055].forEach((dx, i) => {
      g.lineWidth = i === 1 ? 15 : 12;
      g.beginPath();
      g.moveTo(fx + dx * w, h * 0.05);
      g.quadraticCurveTo(fx + dx * w * 1.2, h * 0.14, fx + dx * w * 0.9, h * (i === 1 ? 0.27 : 0.24));
      g.stroke();
    });
    // ほっぺの しま
    [-1, 1].forEach((sx) => {
      [0.47, 0.54].forEach((yy, k) => {
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(fx + sx * w * 0.2, h * yy);
        g.quadraticCurveTo(fx + sx * w * 0.16, h * (yy + 0.01), fx + sx * w * (0.12 + k * 0.01), h * (yy + 0.03));
        g.stroke();
      });
    });
    g.globalAlpha = 1;
    // かお・むねは あかるい クリームいろに
    const grd = g.createRadialGradient(fx, h * 0.62, 10, fx, h * 0.62, w * 0.2);
    grd.addColorStop(0, 'rgba(255,240,214,0.85)');
    grd.addColorStop(1, 'rgba(255,240,214,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    // こまかい 毛の ながれ
    for (let i = 0; i < 5200; i++) {
      g.strokeStyle = r() > 0.5 ? 'rgba(255,244,224,0.16)' : 'rgba(130,64,18,0.10)';
      g.lineWidth = 1 + r();
      const x = r() * w;
      const y = r() * h;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 5, y + 5 + r() * 9);
      g.stroke();
    }
  });
}

/** ホルスタイン（白黒） */
export function holsteinTex() {
  return make('holstein', 512, 256, (g, w, h) => {
    g.fillStyle = '#fbfaf6';
    g.fillRect(0, 0, w, h);
    const r = rng(42);
    g.fillStyle = '#2a2622';
    for (let i = 0; i < 9; i++) {
      const cx = r() * w;
      const cy = 30 + r() * (h - 60);
      const s = 26 + r() * 34;
      for (let k = 0; k < 7; k++) {
        g.beginPath();
        g.ellipse(cx + (r() - 0.5) * s, cy + (r() - 0.5) * s * 0.8, s * (0.4 + r() * 0.4), s * (0.3 + r() * 0.35), r() * 3, 0, Math.PI * 2);
        g.fill();
        // つなぎ目が見えないように左右にもコピー
        if (cx < s * 1.5) {
          g.beginPath();
          g.ellipse(cx + w + (r() - 0.5) * s, cy, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  });
}

/** 木の板 */
export function woodTex(base = '#c58b52', dark = '#9c6534', key = 'wood', planks = 6) {
  return make(
    key,
    256,
    256,
    (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      const r = rng(3);
      const ph = h / planks;
      for (let p = 0; p < planks; p++) {
        const y0 = p * ph;
        g.fillStyle = p % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
        g.fillRect(0, y0, w, ph);
        g.strokeStyle = 'rgba(80,40,10,0.18)';
        g.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          const yy = y0 + r() * ph;
          g.beginPath();
          g.moveTo(0, yy);
          for (let x = 0; x <= w; x += 16) g.lineTo(x, yy + Math.sin(x * 0.03 + k) * 2);
          g.stroke();
        }
        g.fillStyle = dark;
        g.fillRect(0, y0 + ph - 2, w, 2);
        const off = r() * w;
        g.fillRect(off, y0, 2, ph);
      }
    },
    { repeat: [1, 1] },
  );
}

/** 石の壁 */
export function stoneTex() {
  return make(
    'stone',
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#8f8070';
      g.fillRect(0, 0, w, h);
      const r = rng(11);
      const rows = 6;
      const bh = h / rows;
      for (let y = 0; y < rows; y++) {
        let x = y % 2 ? -20 : 0;
        while (x < w) {
          const bw = 40 + r() * 30;
          const c = 150 + Math.floor(r() * 40);
          g.fillStyle = `rgb(${c},${c - 14},${c - 30})`;
          g.beginPath();
          g.roundRect(x + 3, y * bh + 3, bw - 6, bh - 6, 8);
          g.fill();
          x += bw;
        }
      }
      for (let i = 0; i < 900; i++) {
        g.fillStyle = `rgba(0,0,0,${r() * 0.08})`;
        g.fillRect(r() * w, r() * h, 2, 2);
      }
    },
    { repeat: [3, 2] },
  );
}

/** しっくいの壁 */
export function plasterTex(base = '#fbf1de', key = 'plaster') {
  return make(
    key,
    128,
    128,
    (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      const r = rng(5);
      for (let i = 0; i < 700; i++) {
        g.fillStyle = `rgba(150,110,60,${r() * 0.06})`;
        g.beginPath();
        g.arc(r() * w, r() * h, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
    },
    { repeat: [4, 2] },
  );
}

/** チーズの表面（つぶつぶ） */
export function speckleTex(base: string, spot: string, key: string, amount = 500) {
  return make(key, 128, 128, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = rng(key.length * 13);
    for (let i = 0; i < amount; i++) {
      g.fillStyle = spot;
      g.globalAlpha = 0.15 + r() * 0.35;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.6 + r() * 1.8, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  });
}

/** エメンタールの断面（あな） */
export function holesTex() {
  return make('holes', 256, 256, (g, w, h) => {
    g.fillStyle = '#f7dc8c';
    g.fillRect(0, 0, w, h);
    const r = rng(99);
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 10 + r() * 20;
      const grd = g.createRadialGradient(x - s * 0.3, y - s * 0.3, s * 0.1, x, y, s);
      grd.addColorStop(0, '#c79a3e');
      grd.addColorStop(0.8, '#e2b85c');
      grd.addColorStop(1, '#f7dc8c');
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(x, y, s, s * 0.85, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** ブルーチーズの断面（あおカビ） */
export function veinsTex() {
  return make('veins', 256, 256, (g, w, h) => {
    g.fillStyle = '#f6efd9';
    g.fillRect(0, 0, w, h);
    const r = rng(23);
    for (let i = 0; i < 26; i++) {
      let x = r() * w;
      let y = r() * h;
      g.strokeStyle = `rgba(${40 + r() * 30},${90 + r() * 40},${100 + r() * 40},${0.5 + r() * 0.4})`;
      g.lineWidth = 2 + r() * 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (r() - 0.5) * 40;
        y += (r() - 0.5) * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(60,110,120,${r() * 0.6})`;
      g.beginPath();
      g.arc(r() * w, r() * h, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** モッツァレラの断面（すじ） */
export function fiberTex() {
  return make('fiber', 256, 256, (g, w, h) => {
    g.fillStyle = '#fffdf6';
    g.fillRect(0, 0, w, h);
    const r = rng(31);
    g.strokeStyle = 'rgba(220,210,185,0.55)';
    for (let i = 0; i < 40; i++) {
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      const y = r() * h;
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 40, w * 0.6, y + (r() - 0.5) * 40, w, y + (r() - 0.5) * 20);
      g.stroke();
    }
  });
}

/** しろカビの ふわふわ */
export function moldTex() {
  return make('mold', 256, 256, (g, w, h) => {
    g.fillStyle = '#f4efe2';
    g.fillRect(0, 0, w, h);
    const r = rng(17);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.6 + r() * 2.4, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 120; i++) {
      g.fillStyle = `rgba(200,180,140,${r() * 0.25})`;
      g.beginPath();
      g.arc(r() * w, r() * h, r() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** ぼかした丸（かげ・パーティクル） */
export function radialTex() {
  return make(
    'radial',
    128,
    128,
    (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    },
    { srgb: false },
  );
}

/** キラキラの星 */
export function sparkTex() {
  return make(
    'spark',
    128,
    128,
    (g, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.2, 'rgba(255,255,255,0.6)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 ? 8 : 60;
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
    },
    { srgb: false },
  );
}

/** パーティクル用: まる・ほし・ハート・わ を 2x2 に ならべた 1まい */
export function fxAtlasTex() {
  return make(
    'fx-atlas',
    256,
    256,
    (g) => {
      const S = 128;
      // 0: ぼかした まる
      let grd = g.createRadialGradient(64, 64, 0, 64, 64, 62);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.5, 'rgba(160,160,160,0.55)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, S, S);
      // 1: ほし
      const cx = S + 64;
      const cy = 64;
      grd = g.createRadialGradient(cx, cy, 0, cx, cy, 62);
      grd.addColorStop(0, 'rgba(255,255,255,0.9)');
      grd.addColorStop(0.25, 'rgba(200,200,200,0.45)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(S, 0, S, S);
      g.fillStyle = 'rgba(255,255,255,0.97)';
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 ? 9 : 58;
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
      // 2: ハート
      const hx = 64;
      const hy = S + 60;
      const s = 96;
      g.fillStyle = 'rgba(90,90,90,1)';
      g.beginPath();
      const top = hy - s * 0.15;
      g.moveTo(hx, hy + s * 0.42);
      g.bezierCurveTo(hx - s * 0.62, hy, hx - s * 0.42, top - s * 0.38, hx, top);
      g.bezierCurveTo(hx + s * 0.42, top - s * 0.38, hx + s * 0.62, hy, hx, hy + s * 0.42);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath();
      g.ellipse(hx - 17, hy - 20, 9, 6, -0.6, 0, Math.PI * 2);
      g.fill();
      // 3: わ
      g.strokeStyle = 'rgba(200,200,200,1)';
      g.lineWidth = 9;
      g.beginPath();
      g.arc(S + 64, S + 64, 52, 0, Math.PI * 2);
      g.stroke();
    },
    { srgb: false },
  );
}

/** しましま（ひさし） */
export function stripeTex(a: string, b: string, key: string, n = 8) {
  return make(key, 256, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? b : a;
      g.fillRect((i * w) / n, 0, w / n + 1, h);
    }
  });
}

export function drawMark(g: CanvasRenderingContext2D, mark: string, cx: number, cy: number, s: number, color: string) {
  g.fillStyle = color;
  g.strokeStyle = color;
  if (mark === 'paw') {
    g.beginPath();
    g.ellipse(cx, cy + s * 0.18, s * 0.32, s * 0.26, 0, 0, Math.PI * 2);
    g.fill();
    const toes: [number, number][] = [
      [-0.32, -0.14],
      [-0.11, -0.32],
      [0.11, -0.32],
      [0.32, -0.14],
    ];
    toes.forEach(([x, y]) => {
      g.beginPath();
      g.ellipse(cx + x * s, cy + y * s, s * 0.11, s * 0.14, x * 0.6, 0, Math.PI * 2);
      g.fill();
    });
  } else if (mark === 'star') {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rr = i % 2 ? s * 0.2 : s * 0.48;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  } else {
    g.beginPath();
    const top = cy - s * 0.15;
    g.moveTo(cx, cy + s * 0.4);
    g.bezierCurveTo(cx - s * 0.6, cy, cx - s * 0.4, top - s * 0.35, cx, top);
    g.bezierCurveTo(cx + s * 0.4, top - s * 0.35, cx + s * 0.6, cy, cx, cy + s * 0.4);
    g.fill();
  }
}

/** チーズの うえの 「きみの マーク」 */
export function cheeseTopTex(base: string, mark: string | null, markColor: string, key: string) {
  return make(key, 256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = rng(key.length * 7);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(160,110,30,${r() * 0.12})`;
      g.beginPath();
      g.arc(r() * w, r() * h, r() * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    if (mark) {
      g.globalAlpha = 0.85;
      drawMark(g, mark, w / 2, h / 2, w * 0.5, markColor);
      g.globalAlpha = 1;
    }
  });
}

/** 看板などの文字 */
export function textTex(text: string, opts: { w?: number; h?: number; bg?: string; color?: string; size?: number; key?: string; border?: string } = {}) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 128;
  const key = opts.key ?? `text:${text}:${w}:${h}:${opts.bg}:${opts.color}`;
  return make(key, w, h, (g) => {
    if (opts.bg) {
      g.fillStyle = opts.bg;
      g.beginPath();
      g.roundRect(4, 4, w - 8, h - 8, 24);
      g.fill();
      if (opts.border) {
        g.lineWidth = 8;
        g.strokeStyle = opts.border;
        g.stroke();
      }
    }
    g.fillStyle = opts.color ?? '#5a3a1a';
    g.font = `900 ${opts.size ?? 64}px "Hiragino Maru Gothic ProN", "Zen Maru Gothic", "Rounded Mplus 1c", "Yu Gothic", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

/** 空のグラデーション用の色 */
export const SKY = {
  top: new THREE.Color('#6cbcf2'),
  mid: new THREE.Color('#bfe5ff'),
  bottom: new THREE.Color('#fff1d6'),
};
