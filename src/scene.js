/* =====================================================================
   Rego dos Campos · escena 3D (three.js)
   Aguacate generado por código: piel con relieve, pulpa, hueso, hojas
   y lluvia. Se abre en dos mitades según el progreso del scroll.
   Se compila a assets/js/scene.js con esbuild (ver package.json).
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const BG = 0x0d120c;

/* ---------- utilidades ---------- */
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => smooth(clamp01((v - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

/* Ruido de valor periódico en X (para que la piel no tenga costura) */
function valueNoise(w, h, cellsX, cellsY, seed) {
  const rand = mulberry(seed);
  const grid = new Float32Array(cellsX * cellsY);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = (y / h) * cellsY;
    const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, cellsY - 1), ty = smooth(gy - y0);
    for (let x = 0; x < w; x++) {
      const gx = (x / w) * cellsX;
      const x0 = Math.floor(gx) % cellsX, x1 = (x0 + 1) % cellsX, tx = smooth(gx - x0);
      const a = grid[y0 * cellsX + x0], b = grid[y0 * cellsX + x1];
      const c = grid[y1 * cellsX + x0], d = grid[y1 * cellsX + x1];
      out[y * w + x] = lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    }
  }
  return out;
}

/* Ruido celular periódico en X: la piel rugosa del Hass */
function cellNoise(w, h, cellsX, cellsY, seed) {
  const rand = mulberry(seed);
  const px = new Float32Array(cellsX * cellsY), py = new Float32Array(cellsX * cellsY);
  for (let i = 0; i < px.length; i++) { px[i] = rand(); py[i] = rand(); }
  const out = new Float32Array(w * h);
  const sx = cellsX / w, sy = cellsY / h;
  for (let y = 0; y < h; y++) {
    const gy = y * sy, cy = Math.floor(gy);
    for (let x = 0; x < w; x++) {
      const gx = x * sx, cx = Math.floor(gx);
      let best = 9;
      for (let j = -1; j <= 1; j++) {
        const yy = cy + j; if (yy < 0 || yy >= cellsY) continue;
        for (let i = -1; i <= 1; i++) {
          const xx = ((cx + i) % cellsX + cellsX) % cellsX;
          const k = yy * cellsX + xx;
          const dx = (cx + i + px[k]) - gx, dy = (yy + py[k]) - gy;
          const d = dx * dx + dy * dy;
          if (d < best) best = d;
        }
      }
      out[y * w + x] = Math.sqrt(best);
    }
  }
  return out;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ---------- texturas ---------- */
const SKINS = {
  // Hass: piel gruesa, granulada y oscura
  hass: { base: [0x2c, 0x42, 0x22], grain: 0.55, grainTone: 0.22, rough: 0.62, speckle: 0 },
  // Bacon: piel fina, lisa, verde vivo con lenticelas claras
  bacon: { base: [0x4a, 0x76, 0x2c], grain: 0.1, grainTone: 0.05, rough: 0.42, speckle: 0.006 }
};

function skinTextures(kind) {
  const P = SKINS[kind] || SKINS.hass;
  const W = 1024, H = 512;
  const cells = cellNoise(W, H, 110, 55, 11);
  const low = valueNoise(W, H, 6, 3, 23);
  const mid = valueNoise(W, H, 24, 12, 31);
  const rand = mulberry(77);
  const map = makeCanvas(W, H), bump = makeCanvas(W, H), rough = makeCanvas(W, H);
  const mi = map.getContext('2d').createImageData(W, H);
  const bi = bump.getContext('2d').createImageData(W, H);
  const ri = rough.getContext('2d').createImageData(W, H);
  const base = P.base;
  for (let i = 0; i < W * H; i++) {
    const c = clamp01(1 - cells[i] * 1.9);       // 1 en el centro de cada grano
    const bumpV = c * P.grain + mid[i] * 0.3 + low[i] * 0.15;
    let tone = 0.72 + low[i] * 0.45 + (c - 0.5) * P.grainTone + (mid[i] - 0.5) * 0.12;
    const o = i * 4;
    let r0 = base[0] * tone, g0 = base[1] * tone, b0 = base[2] * tone;
    if (P.speckle && rand() < P.speckle) { r0 = 0xc8; g0 = 0xcf; b0 = 0x8a; }
    mi.data[o] = r0; mi.data[o + 1] = g0; mi.data[o + 2] = b0; mi.data[o + 3] = 255;
    const b = bumpV * 255;
    bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = b; bi.data[o + 3] = 255;
    const r = (P.rough - c * 0.18 * (P.grain / 0.55) + (1 - low[i]) * 0.1) * 255;
    ri.data[o] = ri.data[o + 1] = ri.data[o + 2] = r; ri.data[o + 3] = 255;
  }
  map.getContext('2d').putImageData(mi, 0, 0);
  bump.getContext('2d').putImageData(bi, 0, 0);
  rough.getContext('2d').putImageData(ri, 0, 0);
  const tMap = new THREE.CanvasTexture(map);
  tMap.colorSpace = THREE.SRGBColorSpace;
  const tBump = new THREE.CanvasTexture(bump);
  const tRough = new THREE.CanvasTexture(rough);
  [tMap, tBump, tRough].forEach((t) => { t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; });
  return { map: tMap, bump: tBump, rough: tRough };
}

// Máscara radial para el charco de luz del suelo: opaco bajo el fruto, nada en los bordes
function poolAlphaTexture() {
  const S = 256;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // Charco pequeño y con caída rápida: el tercio exterior del plano queda del todo transparente,
  // así su borde nunca se ve como una línea de horizonte aunque la cámara mire casi de canto
  g.addColorStop(0, 'rgb(255,255,255)');
  g.addColorStop(0.22, 'rgb(150,150,150)');
  g.addColorStop(0.45, 'rgb(34,34,34)');
  g.addColorStop(0.62, 'rgb(0,0,0)');
  g.addColorStop(1, 'rgb(0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

function fleshBumpTexture() {
  const W = 512, H = 512;
  const fine = valueNoise(W, H, 64, 64, 61);
  const grain = valueNoise(W, H, 160, 160, 67);
  const c = makeCanvas(W, H);
  const im = c.getContext('2d').createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = (fine[i] * 0.6 + grain[i] * 0.4) * 255;
    const o = i * 4;
    im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255;
  }
  c.getContext('2d').putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

function pitTextures() {
  const W = 512, H = 256;
  const low = valueNoise(W, H, 8, 4, 41);
  const fine = valueNoise(W, H, 90, 45, 43);
  const map = makeCanvas(W, H), bump = makeCanvas(W, H);
  const mi = map.getContext('2d').createImageData(W, H);
  const bi = bump.getContext('2d').createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const t = 0.72 + low[i] * 0.5 + (fine[i] - 0.5) * 0.18;
    mi.data[o] = 0x8f * t; mi.data[o + 1] = 0x5a * t; mi.data[o + 2] = 0x37 * t; mi.data[o + 3] = 255;
    const b = (low[i] * 0.6 + fine[i] * 0.4) * 255;
    bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = b; bi.data[o + 3] = 255;
  }
  map.getContext('2d').putImageData(mi, 0, 0);
  bump.getContext('2d').putImageData(bi, 0, 0);
  const tMap = new THREE.CanvasTexture(map); tMap.colorSpace = THREE.SRGBColorSpace;
  const tBump = new THREE.CanvasTexture(bump);
  [tMap, tBump].forEach((t) => { t.wrapS = THREE.RepeatWrapping; });
  return { map: tMap, bump: tBump };
}

/* Pulpa: contornos concéntricos del amarillo del centro al verde del borde */
function fleshTexture(outline, box, pit, withPit) {
  const S = 1024;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const sx = S / (box.maxX - box.minX), sy = S / (box.maxY - box.minY);
  const toPx = (x, y) => [(x - box.minX) * sx, S - (y - box.minY) * sy];
  const path = (scale, cx, cy) => {
    ctx.beginPath();
    outline.forEach((p, i) => {
      const [x, y] = toPx(cx + (p.x - cx) * scale, cy + (p.y - cy) * scale);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  ctx.fillStyle = '#1e2c14';
  ctx.fillRect(0, 0, S, S);
  const stops = [
    [0.00, [0x3f, 0x6d, 0x2a]], [0.07, [0x7c, 0xa5, 0x3b]], [0.2, [0xb7, 0xcf, 0x5f]],
    [0.45, [0xdd, 0xe0, 0x82]], [0.75, [0xef, 0xea, 0xa2]], [1.0, [0xf6, 0xf0, 0xb4]]
  ];
  const colorAt = (t) => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        const k = (t - a[0]) / (b[0] - a[0]);
        return 'rgb(' + a[1].map((v, j) => Math.round(lerp(v, b[1][j], k))).join(',') + ')';
      }
    }
    return 'rgb(' + stops[stops.length - 1][1].join(',') + ')';
  };
  const centerY = pit.y + 0.18;
  const steps = 56;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.fillStyle = colorAt(t);
    path(1 - t * 0.86, 0, centerY);
    ctx.fill();
  }
  // Veteado sutil
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#6f8a2f';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    path(0.98 - i * 0.045, 0, centerY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Hueco o sombra del hueso
  const [px, py] = toPx(pit.x, pit.y);
  const rx = pit.r * sx, ry = pit.r * 1.08 * sy;
  if (withPit) {
    const g = ctx.createRadialGradient(px, py, rx * 0.9, px, py, rx * 1.5);
    g.addColorStop(0, 'rgba(70, 60, 20, .55)');
    g.addColorStop(1, 'rgba(70, 60, 20, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(px, py, rx * 1.5, ry * 1.5, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const g = ctx.createRadialGradient(px - rx * 0.25, py - ry * 0.3, rx * 0.1, px, py, rx);
    g.addColorStop(0, '#d9d27a');
    g.addColorStop(0.55, '#bcc462');
    g.addColorStop(0.9, '#7f9a3e');
    g.addColorStop(1, '#55702c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    const rim = ctx.createRadialGradient(px, py, rx * 0.92, px, py, rx * 1.12);
    rim.addColorStop(0, 'rgba(50, 70, 20, .35)');
    rim.addColorStop(1, 'rgba(50, 70, 20, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.ellipse(px, py, rx * 1.12, ry * 1.12, 0, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function leafTextures() {
  const W = 512, H = 256;
  const alpha = makeCanvas(W, H), map = makeCanvas(W, H);
  const a = alpha.getContext('2d'), m = map.getContext('2d');
  const leaf = (ctx) => {
    ctx.beginPath();
    ctx.moveTo(18, H / 2);
    ctx.bezierCurveTo(90, 10, 340, 4, W - 14, H / 2);
    ctx.bezierCurveTo(340, H - 4, 90, H - 10, 18, H / 2);
    ctx.closePath();
  };
  a.fillStyle = '#000'; a.fillRect(0, 0, W, H);
  a.fillStyle = '#fff'; leaf(a); a.fill();
  const g = m.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2d4a22'); g.addColorStop(0.5, '#4f7a30'); g.addColorStop(1, '#6f9a3c');
  m.fillStyle = g; m.fillRect(0, 0, W, H);
  m.strokeStyle = 'rgba(230, 236, 190, .55)'; m.lineWidth = 3;
  m.beginPath(); m.moveTo(24, H / 2); m.quadraticCurveTo(W / 2, H / 2 - 6, W - 20, H / 2); m.stroke();
  m.strokeStyle = 'rgba(230, 236, 190, .22)'; m.lineWidth = 1.5;
  for (let i = 1; i < 9; i++) {
    const x = 50 + i * 48;
    m.beginPath(); m.moveTo(x, H / 2); m.quadraticCurveTo(x + 40, H / 2 - 40, x + 70, 30); m.stroke();
    m.beginPath(); m.moveTo(x, H / 2); m.quadraticCurveTo(x + 40, H / 2 + 40, x + 70, H - 30); m.stroke();
  }
  const tA = new THREE.CanvasTexture(alpha);
  const tM = new THREE.CanvasTexture(map); tM.colorSpace = THREE.SRGBColorSpace;
  return { alpha: tA, map: tM };
}

function shadowTexture() {
  const S = 256;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(0.5, 'rgba(0,0,0,.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

/* ---------- geometría ---------- */
function profilePoints() {
  const ctrl = [
    [0.0, 1.06], [0.045, 1.03], [0.15, 0.95], [0.25, 0.8], [0.31, 0.6], [0.37, 0.4],
    [0.47, 0.18], [0.57, -0.06], [0.62, -0.3], [0.6, -0.52], [0.51, -0.72],
    [0.36, -0.88], [0.17, -0.98], [0.0, -1.0]
  ].map((p) => new THREE.Vector3(p[0], p[1], 0));
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
  // De abajo arriba: así las caras de la revolución quedan hacia fuera
  return curve.getPoints(90).reverse().map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}

function capGeometry(points) {
  const outline = [];
  for (let i = 0; i < points.length; i++) outline.push(new THREE.Vector2(points[i].x, points[i].y));
  for (let i = points.length - 2; i > 0; i--) outline.push(new THREE.Vector2(-points[i].x, points[i].y));
  const shape = new THREE.Shape(outline);
  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const box = { minX: bb.min.x, maxX: bb.max.x, minY: bb.min.y, maxY: bb.max.y };
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - box.minX) / (box.maxX - box.minX), (pos.getY(i) - box.minY) / (box.maxY - box.minY));
  }
  uv.needsUpdate = true;
  return { geo, outline, box };
}

/* ---------- modelo real (GLB) ---------- */
// Vértices del fruto en espacio del modelo
function modelVertices(mesh) {
  mesh.updateWorldMatrix(true, false);
  const pos = mesh.geometry.attributes.position;
  const out = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  return out;
}

// Sección del fruto por el plano x = 0: contorno ordenado en (z, y)
function crossSection(verts, index) {
  const pts = [];
  const tri = index ? index.count : verts.length / 3;
  const get = (i) => (index ? index.getX(i) : i);
  for (let t = 0; t < tri; t += 3) {
    const ids = [get(t), get(t + 1), get(t + 2)];
    for (let e = 0; e < 3; e++) {
      const a = ids[e] * 3, b = ids[(e + 1) % 3] * 3;
      const xa = verts[a], xb = verts[b];
      if ((xa < 0) === (xb < 0)) continue;
      const k = xa / (xa - xb);
      pts.push(verts[a + 2] + (verts[b + 2] - verts[a + 2]) * k, verts[a + 1] + (verts[b + 1] - verts[a + 1]) * k);
    }
  }
  let cz = 0, cy = 0;
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) { cz += pts[i * 2]; cy += pts[i * 2 + 1]; }
  cz /= n; cy /= n;
  // Radio máximo por sector angular alrededor del centro
  const BINS = 256;
  const rad = new Float32Array(BINS).fill(-1);
  for (let i = 0; i < n; i++) {
    const dz = pts[i * 2] - cz, dy = pts[i * 2 + 1] - cy;
    const b = Math.floor(((Math.atan2(dy, dz) + Math.PI) / (Math.PI * 2)) * BINS) % BINS;
    rad[b] = Math.max(rad[b], Math.hypot(dz, dy));
  }
  for (let b = 0; b < BINS; b++) {
    if (rad[b] >= 0) continue;
    let l = b, r = b;
    while (rad[(l + BINS) % BINS] < 0) l--;
    while (rad[r % BINS] < 0) r++;
    const k = (b - l) / (r - l);
    rad[b] = rad[(l + BINS) % BINS] * (1 - k) + rad[r % BINS] * k;
  }
  const outline = [];
  for (let b = 0; b < BINS; b++) {
    const r = (rad[(b - 1 + BINS) % BINS] + rad[b] * 2 + rad[(b + 1) % BINS]) / 4;
    const a = ((b + 0.5) / BINS) * Math.PI * 2 - Math.PI;
    outline.push(new THREE.Vector2(cz + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return outline;
}

function capFromOutline(outline) {
  const geo = new THREE.ShapeGeometry(new THREE.Shape(outline), 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const box = { minX: bb.min.x, maxX: bb.max.x, minY: bb.min.y, maxY: bb.max.y };
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - box.minX) / (box.maxX - box.minX), (pos.getY(i) - box.minY) / (box.maxY - box.minY));
  }
  uv.needsUpdate = true;
  return { geo, box };
}

/* ---------- escena ---------- */
export function createAvocadoScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }
  // Nivel de calidad decidido antes del primer render (los shaders no se recompilan sobre la marcha)
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const conn = navigator.connection || {};
  const tier = (conn.saveData || mem <= 2) ? 'low' : (coarse || mem <= 4 || cores <= 4) ? 'mid' : 'high';
  const TIER = { low: { shadow: 0, clearcoat: false, pr: 1.25 }, mid: { shadow: 512, clearcoat: false, pr: 1.5 }, high: { shadow: 1024, clearcoat: true, pr: 2 } }[tier];

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = TIER.shadow > 0;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 6, 10);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.2).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0.1, 5.4);

  const key = new THREE.DirectionalLight(0xffe6bf, 3.0);
  key.position.set(2.6, 3.4, 3.0);
  key.castShadow = TIER.shadow > 0;
  key.shadow.mapSize.set(TIER.shadow || 512, TIER.shadow || 512);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = -2.4; key.shadow.camera.right = 2.4;
  key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.2;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 3;
  scene.add(key);
  scene.add(key.target);
  // Luz principal: alta y algo frontal en el hero; rasante desde la derecha al abrir, para que las caras cortadas tengan terminador
  const KEY_HERO = new THREE.Vector3(2.6, 3.4, 3.0);
  const KEY_OPEN = new THREE.Vector3(3.8, 3.0, 1.9);
  // Charco de luz en el suelo: da base al fruto y deja que la sombra se lea sobre el fondo oscuro
  const pool = new THREE.SpotLight(0xfff0d0, 6, 14, 0.62, 1, 1.4);
  pool.position.set(1.2, 4.6, 2.2);
  pool.target.position.set(0, -1.1, 0);
  scene.add(pool);
  scene.add(pool.target);
  const rim = new THREE.DirectionalLight(0xc4dcff, 2.6);        // contraluz frío: luz de día lluvioso
  rim.position.set(-3.2, 2.4, -3.0);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xc4dcff, 0);         // segundo contraluz, solo con el fruto abierto
  rim2.position.set(3.4, 2.0, -2.8);
  scene.add(rim2);
  const fill = new THREE.DirectionalLight(0x9fb8a8, 0.35);
  fill.position.set(-3, 0.4, 2.5);
  scene.add(fill);
  const FILL_HERO = new THREE.Vector3(-3, 0.4, 2.5);
  const FILL_OPEN = new THREE.Vector3(-3.4, 1.2, 2.0);
  const front = new THREE.DirectionalLight(0xfff6dc, 0.25);     // solo para la piel del hero; se apaga al cortar
  front.position.set(0.4, 1.2, 6);
  scene.add(front);
  const ambient = new THREE.AmbientLight(0x30402a, 0.3);
  scene.add(ambient);
  const lightMix = { key: 1, rim: 1, fill: 1, front: 1, ambient: 1, env: 1 };

  /* Materiales */
  const skins = { hass: skinTextures('hass') };
  const skin = skins.hass;
  const skinMat = new THREE.MeshPhysicalMaterial({
    map: skin.map, bumpMap: skin.bump, bumpScale: 0.9, roughnessMap: skin.rough,
    roughness: 1, metalness: 0, envMapIntensity: 0.9,
    clearcoat: 0.22, clearcoatRoughness: 0.5
  });
  const points = profilePoints();
  const cap = capGeometry(points);
  const pit = { x: 0, y: -0.34, r: 0.3 };
  const fleshOpts = { roughness: 0.55, metalness: 0, envMapIntensity: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.45 };
  const fleshA = new THREE.MeshPhysicalMaterial(Object.assign({ map: fleshTexture(cap.outline, cap.box, pit, true) }, fleshOpts));
  const fleshB = new THREE.MeshPhysicalMaterial(Object.assign({ map: fleshTexture(cap.outline, cap.box, pit, false) }, fleshOpts));
  const pitTex = pitTextures();
  const pitMat = new THREE.MeshStandardMaterial({ map: pitTex.map, bumpMap: pitTex.bump, bumpScale: 0.5, roughness: 0.48, metalness: 0, envMapIntensity: 0.8 });

  /* Mitades */
  const root = new THREE.Group();
  const rig = new THREE.Group();         // inclinación con el ratón
  const spin = new THREE.Group();        // giro lento
  root.add(rig); rig.add(spin);
  scene.add(root);

  const halfGeoA = new THREE.LatheGeometry(points, 128, 0, Math.PI);
  const halfGeoB = new THREE.LatheGeometry(points, 128, Math.PI, Math.PI);
  const halfA = new THREE.Group();
  const halfB = new THREE.Group();
  const shellA = new THREE.Mesh(halfGeoA, skinMat);
  const shellB = new THREE.Mesh(halfGeoB, skinMat);
  halfA.add(shellA); halfB.add(shellB);

  const capA = new THREE.Mesh(cap.geo, fleshA);
  capA.rotation.y = -Math.PI / 2;      // la cara cortada mira a -x (hacia la otra mitad)
  capA.position.x = 0.001;
  halfA.add(capA);
  const capB = new THREE.Mesh(cap.geo, fleshB);
  capB.rotation.y = Math.PI / 2;
  capB.position.x = -0.001;
  halfB.add(capB);

  const pitMesh = new THREE.Mesh(new THREE.SphereGeometry(pit.r, 48, 32), pitMat);
  pitMesh.scale.set(0.96, 1.08, 0.96);
  pitMesh.position.set(-0.02, pit.y, 0);
  pitMesh.rotation.z = 0.2;
  halfA.add(pitMesh);

  /* Tallo y hojas (van con la mitad A) */
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 0.85 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 16), stemMat);
  stem.position.set(0, 1.1, 0);
  stem.rotation.z = -0.15;
  halfA.add(stem);
  const leafTex = leafTextures();
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex.map, alphaMap: leafTex.alpha, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, envMapIntensity: 0.4 });
  const makeLeaf = (len, wid, bend) => {
    const g = new THREE.PlaneGeometry(len, wid, 36, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const t = (x + len / 2) / len;
      p.setZ(i, Math.sin(t * Math.PI) * bend - (y / wid) * (y / wid) * 0.08);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, leafMat);
    return m;
  };
  const leaf1 = makeLeaf(0.78, 0.3, 0.12);
  leaf1.position.set(0.36, 1.2, 0.05);
  leaf1.rotation.set(0.3, -0.2, 0.42);
  halfA.add(leaf1);
  const leaf2 = makeLeaf(0.5, 0.2, 0.08);
  leaf2.position.set(-0.2, 1.17, -0.08);
  leaf2.rotation.set(-0.4, 0.5, 2.6);
  halfA.add(leaf2);

  spin.add(halfA, halfB);
  const procedural = [shellA, capA, pitMesh, stem, leaf1, leaf2, shellB, capB];
  let pitObj = pitMesh;
  const model = { ready: false, parts: [], planes: [], peelMats: [] };

  /* Sombra de contacto (modelo procedural) y suelo que recibe la sombra real */
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.28;
  root.add(shadow);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ color: 0x141e13, roughness: 0.74, metalness: 0, transparent: true, alphaMap: poolAlphaTexture(), depthWrite: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.08;
  ground.receiveShadow = true;
  ground.renderOrder = -1;
  root.add(ground);

  /* Lluvia */
  const N = 420;
  const rainPos = new Float32Array(N * 6);
  const rainVel = new Float32Array(N);
  const rand = mulberry(99);
  const resetDrop = (i, initial) => {
    const x = (rand() - 0.5) * 7, z = -2.5 + rand() * 4.2;
    const y = initial ? (rand() - 0.5) * 7 : 3.6 + rand() * 2;
    const len = 0.12 + rand() * 0.22;
    const o = i * 6;
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z;
    rainPos[o + 3] = x - 0.05; rainPos[o + 4] = y - len; rainPos[o + 5] = z;
    rainVel[i] = 2.6 + rand() * 2.2;
  };
  for (let i = 0; i < N; i++) resetDrop(i, true);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xd8dccb, transparent: true, opacity: 0.22, depthWrite: false }));
  scene.add(rain);

  let slowFrames = 0, quality = 1;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    api.stop();
    document.documentElement.classList.add('no-webgl');
    window.dispatchEvent(new CustomEvent('rego:scene-failed'));
  });

  /* Estado */
  const state = {
    progress: 0, target: 0, px: 0, py: 0, tx: 0, ty: 0,
    aspect: 1, running: false, reduce: false, t: 0, last: 0, raf: 0, w: 1, h: 1, centered: false
  };

  function layout() {
    const portrait = state.aspect < 0.9;
    const e = state.progress;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const needH = lerp(portrait ? 3.3 : 2.02, portrait ? 3.1 : 2.62, e);
    const needW = lerp(0.82, 1.75, e);
    const dH = needH / tanH;
    const dW = needW / (tanH * state.aspect);
    const cam = smoothstep(0.3, 0.8, e);
    camera.position.z = Math.max(dH, dW) * (1 - 0.05 * cam);
    camera.position.y = lerp(0.05, 1.15, cam);                   // picado de unos 10°: las caras cortadas se ven desde arriba
    const heroX = portrait ? 0 : Math.min(1.15, state.aspect * 0.62);
    root.position.x = lerp(heroX, 0, e);
    root.position.y = lerp(portrait ? 1.05 : -0.2, portrait ? 0.12 : -0.58, e);
    if (state.centered) { root.position.x = 0; root.position.y = lerp(0.05, 0, e); camera.position.z = Math.max(dH, dW) * 1.04; }
    camera.lookAt(0, lerp(0, -0.28, cam), 0);
    // Niebla relativa a la cámara: el fruto queda limpio y la lluvia lejana se funde con el fondo
    scene.fog.near = camera.position.z - 0.2;
    scene.fog.far = camera.position.z + 4.5;
  }

  function resize() {
    const parent = canvas.parentElement || canvas;
    const w = parent.clientWidth || 1, h = parent.clientHeight || 1;
    state.w = w; state.h = h; state.aspect = w / h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIER.pr) * quality);
    renderer.setSize(w, h, false);
    camera.aspect = state.aspect;
    camera.updateProjectionMatrix();
    layout();
    renderFrame(0);
  }

  function renderFrame(dt) {
    state.t += dt;
    state.progress = lerp(state.progress, state.target, 1 - Math.exp(-9 * dt));
    // "open" avanza linealmente con el scroll; cada tiempo de la apertura tiene su propia curva
    const open = clamp01(state.progress);
    const e = open;
    const openP = smooth(open);            // versión suavizada para el corte calculado
    const still = smoothstep(0.0, 0.16, open);   // el fruto deja de balancearse

    // Corte calculado (planos de recorte) mientras no han llegado las mitades reales
    if (!halves.ready) {
      halfA.position.x = -0.92 * openP;
      halfB.position.x = 0.92 * openP;
      halfA.rotation.y = (Math.PI / 2) * openP;
      halfB.rotation.y = -(Math.PI / 2) * openP;
      halfA.rotation.z = 0.16 * openP;
      halfB.rotation.z = -0.16 * openP;
      halfA.position.y = Math.sin(openP * Math.PI) * 0.1;
      halfB.position.y = Math.sin(openP * Math.PI) * 0.1;
      if (model.leafPivot) model.leafPivot.rotation.y = -halfA.rotation.y;
      const pop = 0.82 + 0.18 * smoothstep(0.55, 0.85, openP);
      pitObj.scale.set(0.96 * pop, 1.08 * pop, 0.96 * pop);
    }

    // Mitades reales: cuchillo → apertura de libro → asentamiento
    if (halves.ready) {
      const H = halves;
      const k = smoothstep(0.02, 0.26, open);                    // el cuchillo rodea el fruto
      const sRaw = clamp01((open - 0.27) / 0.46);                // 0.27..0.73: la tapa se abre
      const s = Math.pow(sRaw, 2.6) / (Math.pow(sRaw, 2.6) + Math.pow(1 - sRaw, 1.7));  // arranque lento (rompe la pulpa), medio rápido, llegada suave
      const t = smoothstep(0.7, 1.0, open);                       // composición final

      // Hero: piel sin recorte; en cuanto hay corte, piel partida en tapa y fondo
      const cut = open > 0.02;
      H.heroSkin.visible = !cut;
      H.skinFrontMesh.visible = cut;
      H.skinBackMesh.visible = cut;

      // Cuchillo: la línea de corte y el borde de piel avanzan alrededor del fruto desde el tallo
      H.knife.visible = k > 0.001 && sRaw < 0.02;
      H.knifeMat.uCut.value = k < 0.999 ? k : 2;

      // Bisagra: ángulo objetivo según el scroll, seguido por un muelle (vida real al arrancar y al llegar)
      const target = Math.PI * (1 - s) - 0.07 * t;
      if (dt > 0) {
        const kS = 110, cS = 2 * Math.sqrt(kS) * 0.78;
        const acc = (target - H.theta) * kS - H.thetaV * cS;
        H.thetaV += acc * dt;
        H.theta += H.thetaV * dt;
      } else { H.theta = target; H.thetaV = 0; }
      const th = H.theta;
      const sh = clamp01(1 - th / Math.PI);                        // apertura mostrada 0..1
      const pry = Math.sin(Math.PI * sh);                          // la palanca acompaña al giro
      const life = smoothstep(0.72, 0.9, open);
      const liftY = 0.06 * pry - 0.03 * t + Math.sin(state.t * 0.8 + 1.2) * 0.02 * life;
      H.hinge.rotation.y = th + 0.012 * Math.sin(state.t * 0.25) * life;
      H.hinge.rotation.x = -0.12 * pry;
      H.hinge.position.y = liftY / H.scH;
      H.hingeW.rotation.copy(H.hinge.rotation);
      H.hingeW.position.y = liftY;
      // El conjunto se recentra conforme se abre
      H.hv.position.x = -H.recenter * sh;
      // Mitad del hueso: ligera inclinación final y vida propia
      H.Lnode.rotation.z = 0.035 * t;
      H.Lnode.rotation.y = 0.008 * Math.sin(state.t * 0.31 + 0.7) * life;
      H.Lnode.position.y = (Math.sin(state.t * 0.8) * 0.02 * life) / H.scH;
      H.hv.rotation.z = -0.02 * t;
      // El interior de las mitades solo existe una vez empezado el corte
      H.Lnode.visible = cut;
      H.Rnode.visible = cut;
    }
    // Charco de luz en el suelo: aparece con la subida de la cámara (en el hero la fruta flota bajo la lluvia)
    const groundOn = smoothstep(0.3, 0.8, open) * (state.ground === false ? 0 : 1);
    ground.visible = groundOn > 0.005;
    ground.material.opacity = groundOn;

    // Luz: respira en el hero; al abrir la principal se vuelve rasante y entra un segundo contraluz
    const lk = smoothstep(0.25, 0.8, open);
    key.position.lerpVectors(KEY_HERO, KEY_OPEN, lk);
    key.intensity = (3.0 + Math.sin(state.t * 0.45) * 0.35 * (1 - still) + 0.1 * lk) * lightMix.key;
    rim.position.x = -3.2 + Math.sin(state.t * 0.3) * 0.6;
    rim.intensity = 2.6 * lightMix.rim;
    rim2.intensity = 1.2 * smoothstep(0.45, 0.8, open) * lightMix.rim;
    fill.position.lerpVectors(FILL_HERO, FILL_OPEN, lk);
    fill.intensity = (0.35 + 0.25 * lk) * lightMix.fill;
    front.intensity = 0.25 * (1 - smoothstep(0.05, 0.2, open)) * lightMix.front;
    ambient.intensity = 0.3 * lightMix.ambient;
    scene.environmentIntensity = (0.35 + 0.1 * lk) * lightMix.env;
    pool.intensity = 6 * lightMix.key;
    rain.material.opacity = 0.22 * (1 - 0.55 * lk);

    // Movimiento: balanceo y flotación en el hero, quietud al cortar
    state.px = lerp(state.px, state.tx, Math.min(1, dt * 4));
    state.py = lerp(state.py, state.ty, Math.min(1, dt * 4));
    const idle = 1 - still;
    // El modelo real se balancea solo por su cara buena (la textura trasera tiene costura)
    const sway = model.ready ? -0.72 + Math.sin(state.t * 0.35) * 0.18 : Math.sin(state.t * 0.35) * 0.55 - 0.35;
    const rest = model.ready ? -0.6 : 0;
    const base = state.poseY !== undefined ? state.poseY : sway;
    spin.rotation.y = halves.ready ? lerp(base, rest, still) : base * idle;
    spin.rotation.z = -0.12 * idle;
    spin.position.y = Math.sin(state.t * 0.9) * 0.06 * idle;
    rig.rotation.y = state.px * (model.ready ? 0.18 : 0.45);
    rig.rotation.x = -state.py * 0.25 - 0.08 * smoothstep(0.3, 0.8, open);   // el par se inclina hacia la cámara
    shadow.visible = !model.ready;
    shadow.scale.setScalar(1 + open * 0.55);
    shadow.material.opacity = 0.9 - open * 0.3;
    shadow.position.y = -1.28 + spin.position.y * 0.3;

    // Lluvia
    if (!state.reduce) {
      for (let i = 0; i < N; i++) {
        const o = i * 6, dy = rainVel[i] * dt;
        rainPos[o + 1] -= dy; rainPos[o + 4] -= dy;
        rainPos[o] -= dy * 0.12; rainPos[o + 3] -= dy * 0.12;
        if (rainPos[o + 4] < -4) resetDrop(i, false);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    layout();
    if (model.ready) {
      scene.updateMatrixWorld();
      for (const c of model.planes) c.plane.copy(c.local).applyMatrix4(c.half.matrixWorld);
      if (halves.ready) {
        halves.knifeA.copy(halves.knifeALocal).applyMatrix4(halves.hv.matrixWorld);
        halves.knifeB.copy(halves.knifeBLocal).applyMatrix4(halves.hv.matrixWorld);
        halves.planeFront.copy(halves.frontLocal).applyMatrix4(halves.hingeW.matrixWorld);
        halves.planeBack.copy(halves.backLocal).applyMatrix4(halves.hv.matrixWorld);
        const c = new THREE.Vector3(0, 0, 0).applyMatrix4(halves.hv.matrixWorld);
        halves.knifeMat.uCenter.value.set(c.x, c.y);
      }
    }
    renderer.render(scene, camera);
  }

  function loop(now) {
    const raw = (now - state.last) / 1000;
    const dt = Math.min(raw, 0.05);
    state.last = now;
    renderFrame(dt);
    // Calidad adaptativa: si el dispositivo no llega, baja la resolución
    if (raw > 0.045) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 24 && quality > 0.6) {
      quality -= 0.2;
      slowFrames = 0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIER.pr) * quality);
      renderer.setSize(state.w, state.h, false);
    }
    if (state.running) state.raf = requestAnimationFrame(loop);
  }

  /* Modelo real: sustituye al aguacate procedural cuando termina de cargar */
  function installModel(gltf) {
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const fruitSrc = src.getObjectByName('Fruto');
    if (!fruitSrc || !fruitSrc.isMesh) throw new Error('El modelo no tiene el nodo Fruto');
    const ramaSrc = src.getObjectByName('Rama');
    const hojaSrc = src.getObjectByName('Hoja');

    // Escala: misma altura de fruto que el aguacate procedural (2,06) y base en y = -1
    const verts = modelVertices(fruitSrc);
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 1; i < verts.length; i += 3) { if (verts[i] < yMin) yMin = verts[i]; if (verts[i] > yMax) yMax = verts[i]; }
    const sc = 2.06 / (yMax - yMin);
    const ty = -1 - yMin * sc;
    const norm = (p) => new THREE.Vector2(p.x * sc, p.y * sc + ty);
    const outline = crossSection(verts, fruitSrc.geometry.index).map(norm);

    // Hueso: centrado donde el fruto es más ancho, en la mitad inferior
    let best = { w: 0, y: -0.3, z: 0 };
    for (let y = -0.85; y < 0.2; y += 0.01) {
      let zMin = Infinity, zMax = -Infinity;
      for (const p of outline) if (Math.abs(p.y - y) < 0.02) { if (p.x < zMin) zMin = p.x; if (p.x > zMax) zMax = p.x; }
      if (zMax - zMin > best.w) best = { w: zMax - zMin, y, z: (zMin + zMax) / 2 };
    }
    const pitR = best.w * 0.25;

    // Piel con capa de cera
    const peel = new THREE.MeshPhysicalMaterial({
      map: fruitSrc.material.map, normalMap: fruitSrc.material.normalMap,
      normalScale: new THREE.Vector2(1.15, 1.15), roughnessMap: fruitSrc.material.roughnessMap,
      roughness: 0.92, metalness: 0, envMapIntensity: 1.1,
      clearcoat: 0.3, clearcoatRoughness: 0.42, side: THREE.DoubleSide
    });
    model.peel = peel;

    const placeLike = (obj, ref) => {
      obj.matrix.copy(ref.matrixWorld);
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
    };
    const fleshOptsM = { roughness: 0.55, metalness: 0, envMapIntensity: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.45 };

    const build = (half, side, extra) => {
      const group = new THREE.Group();
      const wrap = new THREE.Group();
      wrap.scale.setScalar(sc);
      wrap.position.y = ty;
      group.add(wrap);

      const plane = new THREE.Plane();
      const mat = peel.clone();
      mat.clippingPlanes = [plane];
      model.peelMats.push(mat);
      const fruit = new THREE.Mesh(fruitSrc.geometry, mat);
      placeLike(fruit, fruitSrc);
      fruit.castShadow = true;
      wrap.add(fruit);
      model.planes.push({ half, plane, local: new THREE.Plane(new THREE.Vector3(side, 0, 0), 0) });

      if (extra && extra.length) {
        const pivot = new THREE.Group();
        const wrapL = new THREE.Group();
        wrapL.scale.setScalar(sc);
        wrapL.position.y = ty;
        pivot.add(wrapL);
        extra.forEach((src) => {
          if (!src) return;
          const e = src.clone(true);
          placeLike(e, src);
          e.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.metalness = 0; o.castShadow = true; } });
          wrapL.add(e);
        });
        group.add(pivot);
        model.leafPivot = pivot;
      }

      // Cara cortada: pulpa con la forma real de la sección
      const shapePts = side > 0 ? outline : outline.map((p) => new THREE.Vector2(-p.x, p.y));
      const capData = capFromOutline(shapePts);
      const pitShape = { x: side > 0 ? best.z : -best.z, y: best.y, r: pitR };
      const capMat = new THREE.MeshPhysicalMaterial(Object.assign({ map: fleshTexture(shapePts, capData.box, pitShape, side > 0) }, fleshOptsM));
      const capMesh = new THREE.Mesh(capData.geo, capMat);
      capMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      capMesh.position.x = side * 0.003;
      group.add(capMesh);

      if (side > 0) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(pitR, 48, 32), pitMat);
        p.position.set(-0.012, best.y, best.z);
        p.rotation.z = 0.2;
        group.add(p);
        pitObj = p;
      }
      half.add(group);
      model.parts.push(group);
    };

    build(halfA, 1, [ramaSrc, hojaSrc]);
    build(halfB, -1, null);
    procedural.forEach((o) => { o.visible = false; });
    model.whole = { fruitSrc, ramaSrc, hojaSrc, sc, ty, placeLike };
    model.ready = true;
    model.mode = 'clip';
    renderFrame(0);
  }

  /* Mitades reales: cortar y abrir como un libro */
  const halves = { ready: false };

  // Material físico a partir del material del GLB
  function physical(src, extra) {
    const m = new THREE.MeshPhysicalMaterial(Object.assign({
      map: src.map || null,
      normalMap: src.normalMap || null,
      roughnessMap: src.roughnessMap || null,
      roughness: src.roughnessMap ? 1 : src.roughness,
      metalness: 0,
      color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
      vertexColors: !!src.vertexColors,
      side: THREE.DoubleSide
    }, extra));
    if (src.normalMap) m.normalScale.copy(src.normalScale || new THREE.Vector2(1, 1));
    m.name = src.name;
    return m;
  }

  function installHalves(gltf) {
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const huesoSrc = src.getObjectByName('MitadHueso');
    const huecoSrc = src.getObjectByName('MitadHueco');
    if (!huesoSrc || !huecoSrc || !model.whole) throw new Error('Faltan las mitades');
    const W = model.whole;
    const peelOf = (g) => {
      let found = null;
      g.traverse((o) => { if (!found && o.isMesh && /peel/i.test(o.material.name)) found = o; });
      return found;
    };
    const boxL = new THREE.Box3().setFromObject(peelOf(huesoSrc));
    const boxR = new THREE.Box3().setFromObject(peelOf(huecoSrc));
    const scH = 2.06 / (boxL.max.y - boxL.min.y);
    const tyH = -1 - boxL.min.y * scH;
    const zc = Math.max(boxL.max.z, boxR.max.z);              // plano de corte (caras cortadas miran a +z)
    const xh = boxL.max.x;                                    // bisagra: eje vertical en el borde de la mitad del hueso
    const gapR = boxR.min.x - boxL.max.x;                     // hueco del modelo entre mitades: la tapa se acerca hasta tocar
    const cxL = (boxL.min.x + boxL.max.x) / 2;

    // Silueta del fruto cerrado igual a la del modelo entero
    const wholeBox = new THREE.Box3().setFromObject(W.fruitSrc);
    const wholeW = (wholeBox.max.x - wholeBox.min.x) * W.sc;
    const wholeD = (wholeBox.max.z - wholeBox.min.z) * W.sc;
    const closedW = (boxL.max.x - boxL.min.x) * scH;
    const closedD = (zc - Math.min(boxL.min.z, boxR.min.z)) * 2 * scH;
    // Una sola escala en x/z: una escala distinta por eje sobre la bisagra cizalla la tapa al girar
    const sxz = Math.sqrt(THREE.MathUtils.clamp(wholeW / closedW, 0.9, 1.25) * THREE.MathUtils.clamp(wholeD / closedD, 0.9, 1.25));
    const sx = sxz, sz = sxz;

    // Jerarquía: spin > book > hv > hvScale > { Lnode, hinge > Rnode }
    const book = new THREE.Group();
    book.rotation.y = 0.6;                                     // compensa el giro de reposo del fruto (-0.6)
    const hv = new THREE.Group();
    const hvScale = new THREE.Group();
    hvScale.scale.set(scH * sx, scH, scH * sz);
    hvScale.position.set(-cxL * scH * sx, tyH, -zc * scH * sz);
    book.add(hv); hv.add(hvScale); spin.add(book);

    // Los mapas de normales de pulpa, hueso y hueco del GLB son planos: se sustituyen por relieve procedural
    const fleshBump = fleshBumpTexture();
    const cc = TIER.clearcoat;
    const tune = (root, isLid) => {
      root.traverse((o) => {
        if (!o.isMesh) return;
        const n = o.material.name || '';
        if (/peel/i.test(n)) {
          // La piel la pone el modelo entero (fotorrealista); la del partido se oculta y se liberan sus texturas
          o.visible = false;
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach((k) => { if (o.material[k]) o.material[k].dispose(); });
          return;
        }
        if (isLid && /stem|remnant|tallo/i.test(o.name + ' ' + n)) { o.visible = false; return; }  // el tallo va solo en la mitad del hueso
        if (/flesh/i.test(n)) {
          o.material = physical(o.material, { normalMap: null, bumpMap: fleshBump, bumpScale: 0.008, roughness: 0.6, roughnessMap: null, envMapIntensity: 0.7, clearcoat: cc ? 0.15 : 0, clearcoatRoughness: 0.45 });
          o.receiveShadow = true;
        } else if (/cavity|socket/i.test(n)) {
          o.material = physical(o.material, { normalMap: null, roughness: 0.8, roughnessMap: null, envMapIntensity: 0.5 });
          o.receiveShadow = true;
        } else if (/pit/i.test(n)) {
          o.material = physical(o.material, { normalMap: null, bumpMap: pitTex.bump, bumpScale: 0.25, roughness: 1, envMapIntensity: 0.5, clearcoat: cc ? 0.12 : 0, clearcoatRoughness: 0.6 });
          o.receiveShadow = true;
        } else {
          o.material = o.material.clone();        // borde de piel y tallo: conservan sus colores por vértice
          o.material.metalness = 0;
          o.material.roughness = 0.7;
          o.material.envMapIntensity = 0.6;
          o.receiveShadow = true;
        }
        o.castShadow = true;
      });
    };

    const Lnode = huesoSrc.clone(true);
    W.placeLike(Lnode, huesoSrc);
    tune(Lnode, false);
    hvScale.add(Lnode);

    const hinge = new THREE.Group();
    hinge.position.set(xh, 0, zc);
    const Rnode = huecoSrc.clone(true);
    W.placeLike(Rnode, huecoSrc);
    Rnode.position.x -= xh + gapR; Rnode.position.z -= zc;
    tune(Rnode, true);
    hinge.add(Rnode);
    hvScale.add(hinge);

    // Cuchillo: una franja fina de la propia piel del entero (±0,012 alrededor del plano de corte),
    // oscura, que se revela en ángulo alrededor del fruto empezando por el tallo
    const knifeA = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.009);
    const knifeB = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.009);
    const knifeMat = new THREE.MeshStandardMaterial({ color: 0x1b2210, roughness: 1, metalness: 0, clippingPlanes: [knifeA, knifeB], polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });
    knifeMat.uCut = { value: 0 };
    knifeMat.uCenter = { value: new THREE.Vector2(0, 0) };
    const angularReveal = (mat) => (shader) => {
      shader.uniforms.uCut = knifeMat.uCut;
      shader.uniforms.uCenter = knifeMat.uCenter;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vKnifeXY;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvKnifeXY = (modelMatrix * vec4(transformed, 1.0)).xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCut; uniform vec2 uCenter; varying vec2 vKnifeXY;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n{ vec2 d = vKnifeXY - uCenter; float ang = atan(-d.x, d.y); float u = (ang + 3.14159265) / 6.2831853; if (u > uCut) discard; }');
    };
    knifeMat.onBeforeCompile = angularReveal(knifeMat);
    [Lnode, Rnode].forEach((g) => g.traverse((o) => {
      if (o.isMesh && /borde|lip/i.test(o.material.name || '')) { o.material.onBeforeCompile = angularReveal(o.material); o.material.customProgramCacheKey = () => 'lip-reveal'; }
    }));
    const knife = new THREE.Group();
    knife.visible = false;
    hv.add(knife);
    // Rama y hojas del aguacate entero, fijas a la mitad del hueso, con la orientación del hero
    const branch = new THREE.Group();
    branch.rotation.y = -0.6;
    const wrapL = new THREE.Group();
    wrapL.scale.setScalar(W.sc);
    wrapL.position.y = W.ty;
    branch.add(wrapL);
    [W.ramaSrc, W.hojaSrc].forEach((s0) => {
      if (!s0) return;
      const e = s0.clone(true);
      W.placeLike(e, s0);
      e.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.metalness = 0; o.castShadow = true; } });
      wrapL.add(e);
    });
    hv.add(branch);

    // Piel del fruto entero partida por el plano de corte: la parte trasera queda con la mitad del hueso
    // y la delantera gira con la bisagra. Así la piel es siempre la fotorrealista del modelo entero.
    const recenter = (xh - cxL) * scH * sx;
    const hingeW = new THREE.Group();            // bisagra en unidades de escena (sin la escala no uniforme)
    hingeW.position.set(recenter, 0, 0);
    hingeW.rotation.y = Math.PI;
    hv.add(hingeW);

    const wholeRef = new THREE.Group();          // dónde está el fruto entero en el espacio de spin
    wholeRef.scale.setScalar(W.sc);
    wholeRef.position.y = W.ty;
    spin.add(wholeRef);
    scene.updateMatrixWorld(true);

    const planeFront = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const planeBack = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const skinFront = model.peel.clone();
    skinFront.clippingPlanes = [planeFront];
    skinFront.clipShadows = true;
    const skinBack = model.peel.clone();
    skinBack.clippingPlanes = [planeBack];
    skinBack.clipShadows = true;
    model.peelMats.push(skinFront, skinBack);

    const holderFor = (parent) => {
      const holder = new THREE.Group();
      holder.matrixAutoUpdate = false;
      holder.matrix.copy(parent.matrixWorld).invert().multiply(wholeRef.matrixWorld);
      const m = new THREE.Mesh(W.fruitSrc.geometry, parent === hingeW ? skinFront : skinBack);
      W.placeLike(m, W.fruitSrc);
      m.castShadow = true;
      m.receiveShadow = true;
      holder.add(m);
      parent.add(holder);
      return m;
    };
    const skinFrontMesh = holderFor(hingeW);
    const skinBackMesh = holderFor(hv);
    // Piel entera sin planos de recorte para el hero: una sola pasada mientras el fruto está cerrado
    const heroHolder = new THREE.Group();
    heroHolder.matrixAutoUpdate = false;
    heroHolder.matrix.copy(hv.matrixWorld).invert().multiply(wholeRef.matrixWorld);
    const heroSkin = new THREE.Mesh(W.fruitSrc.geometry, model.peel);
    W.placeLike(heroSkin, W.fruitSrc);
    heroSkin.castShadow = true;
    heroHolder.add(heroSkin);
    hv.add(heroHolder);
    const knifeMesh = new THREE.Mesh(W.fruitSrc.geometry, knifeMat);
    W.placeLike(knifeMesh, W.fruitSrc);
    const knifeHolder = new THREE.Group();
    knifeHolder.matrixAutoUpdate = false;
    knifeHolder.matrix.copy(heroHolder.matrix);
    knifeHolder.add(knifeMesh);
    knife.add(knifeHolder);
    spin.remove(wholeRef);

    Object.assign(halves, {
      hv, hvScale, Lnode, Rnode, hinge, hingeW, scH, recenter,
      knife, knifeMat, knifeA, knifeB,
      knifeALocal: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.009),
      knifeBLocal: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.009),
      planeFront, planeBack,
      frontLocal: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
      backLocal: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.002),
      skinFrontMesh, skinBackMesh, heroSkin, branch,
      theta: Math.PI, thetaV: 0
    });
    hinge.rotation.y = Math.PI;

    halfA.visible = false;
    halfB.visible = false;
    book.visible = false;
    const activate = () => {
      book.visible = true;
      halves.ready = true;
      model.mode = 'halves';
      renderFrame(0);
    };
    if (typeof renderer.compileAsync === 'function') {
      return renderer.compileAsync(scene, camera).then(activate, activate);
    }
    activate();
  }

  let resolveReady, halvesReadyResolve;
  const ready = new Promise((r) => { resolveReady = r; });
  const halvesReady = new Promise((r) => { halvesReadyResolve = r; });
  const modelUrl = canvas.getAttribute('data-model');
  if (modelUrl) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(modelUrl, (gltf) => {
      try { installModel(gltf); } catch (err) { console.warn('Aguacate 3D: se usa el modelo procedural.', err); }
      resolveReady(model.ready);
      const halvesUrl = canvas.getAttribute('data-model-halves');
      if (model.ready && halvesUrl) {
        loader.load(halvesUrl, (g2) => {
          let p;
          try { p = installHalves(g2); } catch (err) { console.warn('Aguacate 3D: se mantiene el corte calculado.', err); }
          Promise.resolve(p).then(() => halvesReadyResolve(halves.ready));
        }, undefined, () => halvesReadyResolve(false));
      } else {
        halvesReadyResolve(false);
      }
    }, undefined, (err) => {
      console.warn('Aguacate 3D: no se pudo cargar el modelo, se usa el procedural.', err);
      resolveReady(false);
      halvesReadyResolve(false);
    });
  } else {
    resolveReady(false);
    halvesReadyResolve(false);
  }

  const api = {
    ready,
    halvesReady,
    start() {
      if (state.running) return;
      state.running = true;
      state.last = performance.now();
      state.raf = requestAnimationFrame(loop);
    },
    stop() { state.running = false; cancelAnimationFrame(state.raf); },
    setProgress(p) { state.target = clamp01(p); if (state.reduce) { state.progress = state.target; renderFrame(0); } },
    setPointer(x, y) { state.tx = x; state.ty = y; },
    setReduced(v) { state.reduce = !!v; if (v) { api.stop(); renderFrame(0); } },
    setCentered(v) { state.centered = !!v; layout(); },
    setRain(v) { rain.visible = !!v; },
    setPose(y) { spin.rotation.y = y; state.poseY = y; },
    setVariety(kind) {
      if (!SKINS[kind]) return;
      if (!skins[kind]) skins[kind] = skinTextures(kind);
      const t = skins[kind];
      if (model.ready) {
        const bacon = kind === 'bacon';
        model.peelMats.forEach((m) => {
          m.map = bacon ? t.map : model.peel.map;
          m.roughnessMap = bacon ? null : model.peel.roughnessMap;
          m.roughness = bacon ? 0.5 : model.peel.roughness;
          m.normalScale.setScalar(bacon ? 0.3 : model.peel.normalScale.x);
          m.clearcoat = bacon ? 0.5 : model.peel.clearcoat;
          m.needsUpdate = true;
        });
      }
      skinMat.map = t.map; skinMat.bumpMap = t.bump; skinMat.roughnessMap = t.rough;
      skinMat.bumpScale = kind === 'bacon' ? 0.3 : 0.9;
      skinMat.clearcoat = kind === 'bacon' ? 0.45 : 0.22;
      skinMat.needsUpdate = true;
      renderFrame(0);
    },
    setLightMix(mix) { Object.assign(lightMix, mix || {}); renderFrame(0); },
    setGround(v) { state.ground = !!v; renderFrame(0); },
    // Diagnóstico y renders de producto: oculta o muestra piezas de las mitades por nombre de material/objeto
    setPartVisible(pattern, visible) {
      if (!halves.ready) return;
      const re = new RegExp(pattern, 'i');
      const hit = (o) => re.test(o.name || '') || (o.material && re.test(o.material.name || ''));
      [halves.Lnode, halves.Rnode, halves.knife, halves.branch].forEach((g) => g.traverse((o) => { if (o.isMesh && hit(o)) o.visible = !!visible; }));
      if (re.test('skinFront')) halves.skinFrontMesh.visible = !!visible;
      if (re.test('skinBack')) halves.skinBackMesh.visible = !!visible;
      renderFrame(0);
    },
    useModel(on) {
      if (!model.ready) return;
      model.parts.forEach((g) => { g.visible = !!on; });
      procedural.forEach((o) => { o.visible = !on; });
      pitObj.visible = true;
      renderFrame(0);
    },
    resize,
    render() { state.progress = state.target; renderFrame(0); },
    dispose() { api.stop(); renderer.dispose(); }
  };

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas.parentElement || canvas);
  else window.addEventListener('resize', resize);
  resize();
  return api;
}

/* Arranque automático: el script se carga al final del body */
(function boot() {
  const canvas = document.querySelector('[data-avocado-scene]');
  if (!canvas) return;
  const api = createAvocadoScene(canvas);
  if (!api) {
    document.documentElement.classList.add('no-webgl');
    window.dispatchEvent(new CustomEvent('rego:scene-failed'));
    return;
  }
  window.REGO_SCENE = api;
  document.documentElement.classList.add('has-webgl');
  window.dispatchEvent(new CustomEvent('rego:scene', { detail: api }));
})();
