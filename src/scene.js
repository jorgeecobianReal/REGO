/* =====================================================================
   Rego dos Campos · escena 3D (three.js)
   Aguacate generado por código: piel con relieve, pulpa, hueso, hojas
   y lluvia. Se abre en dos mitades según el progreso del scroll.
   Se compila a assets/js/scene.js con esbuild (ver package.json).
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
function skinTextures() {
  const W = 1024, H = 512;
  const cells = cellNoise(W, H, 110, 55, 11);
  const low = valueNoise(W, H, 6, 3, 23);
  const mid = valueNoise(W, H, 24, 12, 31);
  const map = makeCanvas(W, H), bump = makeCanvas(W, H), rough = makeCanvas(W, H);
  const mi = map.getContext('2d').createImageData(W, H);
  const bi = bump.getContext('2d').createImageData(W, H);
  const ri = rough.getContext('2d').createImageData(W, H);
  const base = [0x2c, 0x42, 0x22];
  for (let i = 0; i < W * H; i++) {
    const c = clamp01(1 - cells[i] * 1.9);       // 1 en el centro de cada grano
    const bumpV = c * 0.55 + mid[i] * 0.3 + low[i] * 0.15;
    const tone = 0.72 + low[i] * 0.45 + (c - 0.5) * 0.22 + (mid[i] - 0.5) * 0.12;
    const o = i * 4;
    mi.data[o] = base[0] * tone; mi.data[o + 1] = base[1] * tone; mi.data[o + 2] = base[2] * tone; mi.data[o + 3] = 255;
    const b = bumpV * 255;
    bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = b; bi.data[o + 3] = 255;
    const r = (0.62 - c * 0.18 + (1 - low[i]) * 0.1) * 255;
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

/* ---------- escena ---------- */
export function createAvocadoScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 6, 10);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0.1, 5.4);

  const key = new THREE.DirectionalLight(0xfff3d6, 2.6);
  key.position.set(2.5, 3.2, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9de7e, 2.2);
  rim.position.set(-3.5, 1.5, -2.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9fb8a8, 0.5);
  fill.position.set(-2, -1, 3);
  scene.add(fill);
  const front = new THREE.DirectionalLight(0xfff6dc, 1.1);
  front.position.set(0.4, 1.2, 6);
  scene.add(front);
  scene.add(new THREE.AmbientLight(0x30402a, 0.5));

  /* Materiales */
  const skin = skinTextures();
  const skinMat = new THREE.MeshPhysicalMaterial({
    map: skin.map, bumpMap: skin.bump, bumpScale: 0.9, roughnessMap: skin.rough,
    roughness: 1, metalness: 0, envMapIntensity: 0.9,
    clearcoat: 0.22, clearcoatRoughness: 0.5
  });
  const points = profilePoints();
  const cap = capGeometry(points);
  const pit = { x: 0, y: -0.34, r: 0.3 };
  const fleshOpts = { roughness: 0.42, metalness: 0, envMapIntensity: 0.6, emissive: 0x2a2e10, emissiveIntensity: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.35 };
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

  /* Sombra de contacto */
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.28;
  root.add(shadow);

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

  /* Estado */
  const state = {
    progress: 0, target: 0, px: 0, py: 0, tx: 0, ty: 0,
    aspect: 1, running: false, reduce: false, t: 0, last: 0, raf: 0, w: 1, h: 1, centered: false
  };

  function layout() {
    const portrait = state.aspect < 0.9;
    const e = state.progress;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const needH = lerp(portrait ? 3.0 : 1.78, portrait ? 2.7 : 2.3, e);
    const needW = lerp(0.82, 1.75, e);
    const dH = needH / tanH;
    const dW = needW / (tanH * state.aspect);
    camera.position.z = Math.max(dH, dW);
    camera.position.y = 0.05;
    const heroX = portrait ? 0 : Math.min(1.15, state.aspect * 0.62);
    root.position.x = lerp(heroX, 0, e);
    root.position.y = lerp(portrait ? 1.4 : 0.08, portrait ? 0.55 : -0.34, e);
    if (state.centered) { root.position.x = 0; root.position.y = lerp(0.05, 0, e); camera.position.z = Math.max(dH, dW) * 1.04; }
    camera.lookAt(0, 0, 0);
    // Niebla relativa a la cámara: el fruto queda limpio y la lluvia lejana se funde con el fondo
    scene.fog.near = camera.position.z - 0.2;
    scene.fog.far = camera.position.z + 4.5;
  }

  function resize() {
    const parent = canvas.parentElement || canvas;
    const w = parent.clientWidth || 1, h = parent.clientHeight || 1;
    state.w = w; state.h = h; state.aspect = w / h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = state.aspect;
    camera.updateProjectionMatrix();
    layout();
    renderFrame(0);
  }

  function renderFrame(dt) {
    state.t += dt;
    state.progress = lerp(state.progress, state.target, Math.min(1, dt * 7));
    const e = smooth(state.progress);
    const open = smooth(clamp01((e - 0.02) / 0.9));

    // Mitades
    halfA.position.x = -0.92 * open;
    halfB.position.x = 0.92 * open;
    halfA.rotation.y = (Math.PI / 2) * open;
    halfB.rotation.y = -(Math.PI / 2) * open;
    halfA.rotation.z = 0.16 * open;
    halfB.rotation.z = -0.16 * open;
    halfA.position.y = Math.sin(open * Math.PI) * 0.1;
    halfB.position.y = Math.sin(open * Math.PI) * 0.1;
    const pop = 0.82 + 0.18 * smoothstep(0.55, 0.85, open);
    pitMesh.scale.set(0.96 * pop, 1.08 * pop, 0.96 * pop);

    // Luz que respira: nubes pasando
    key.intensity = 2.6 + Math.sin(state.t * 0.45) * 0.35;
    rim.position.x = -3.5 + Math.sin(state.t * 0.3) * 0.8;

    // Movimiento: giro lento y flotación en el hero, quietud al abrir
    state.px = lerp(state.px, state.tx, Math.min(1, dt * 4));
    state.py = lerp(state.py, state.ty, Math.min(1, dt * 4));
    const idle = 1 - e;
    spin.rotation.y = state.poseY !== undefined ? state.poseY * idle : Math.sin(state.t * 0.35) * 0.55 * idle - 0.35 * idle;
    spin.rotation.z = -0.12 * idle;
    spin.position.y = Math.sin(state.t * 0.9) * 0.06 * idle;
    rig.rotation.y = state.px * 0.45;
    rig.rotation.x = -state.py * 0.25 + 0.08 * open;
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
    renderer.render(scene, camera);
  }

  let slowFrames = 0, quality = 1;
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75) * quality);
      renderer.setSize(state.w, state.h, false);
    }
    if (state.running) state.raf = requestAnimationFrame(loop);
  }

  const api = {
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
