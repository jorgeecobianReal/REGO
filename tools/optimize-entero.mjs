// Optimiza el aguacate GLB para la web:
// agrupa rama y hojas por mitad, materiales sin metal, malla simplificada,
// normales suaves sin costuras, texturas WebP y geometría meshopt.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, join, prune, dedup, textureCompress, reorder, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [input, output, ratioArg] = process.argv.slice(2);
const RATIO = Number(ratioArg || 0.25);

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const world = root.listNodes().find((n) => n.getName() === 'world');

// 1. Grupos: Fruto, Rama (tallo + hoja 2) y Hoja (hoja 1)
const fruitNode = root.listNodes().find((n) => n.getName() === 'Avocado fruit');
fruitNode.setName('Fruto');
const rama = doc.createNode('Rama');
const hoja = doc.createNode('Hoja');
world.addChild(rama);
world.addChild(hoja);
for (const n of root.listNodes()) {
  const name = n.getName();
  if (/^Leaf 1 /.test(name)) hoja.addChild(n);
  else if (/^Leaf 2 /.test(name) || /stem|Stem/.test(name)) rama.addChild(n);
}

// 2. Materiales para tallo y nervios (vienen sin material: por defecto serían metálicos)
const stemMat = doc.createMaterial('Tallo').setMetallicFactor(0).setRoughnessFactor(0.85).setBaseColorFactor([0.5, 0.38, 0.26, 1]);
const veinMat = doc.createMaterial('Nervios').setMetallicFactor(0).setRoughnessFactor(0.6);
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const isStem = /stem|Stem/.test(node.getName());
  for (const prim of mesh.listPrimitives()) if (!prim.getMaterial()) prim.setMaterial(isStem ? stemMat : veinMat);
}
for (const mat of root.listMaterials()) mat.setMetallicFactor(0);
fruitNode.getMesh().listPrimitives()[0].getMaterial().setName('Piel de Hass');

// 3. Malla: soldar, simplificar el fruto
await doc.transform(weld());
const fruitMesh = fruitNode.getMesh();
const before = fruitMesh.listPrimitives()[0].getIndices().getCount() / 3;
await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.0006, lockBorder: false }));
const after = fruitMesh.listPrimitives()[0].getIndices().getCount() / 3;
console.log('fruit triangles', before, '->', after);

// 4. Normales suaves agrupando por posición (evita líneas en las costuras de UV)
function smoothNormals(prim) {
  const pos = prim.getAttribute('POSITION');
  const idx = prim.getIndices();
  const n = pos.getCount();
  const key = new Array(n);
  const map = new Map();
  const p = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    pos.getElement(i, p);
    const k = Math.round(p[0] * 1e4) + ',' + Math.round(p[1] * 1e4) + ',' + Math.round(p[2] * 1e4);
    let id = map.get(k);
    if (id === undefined) { id = map.size; map.set(k, id); }
    key[i] = id;
  }
  const acc = new Float32Array(map.size * 3);
  const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
  const tri = idx ? idx.getCount() : n;
  for (let t = 0; t < tri; t += 3) {
    const i0 = idx ? idx.getScalar(t) : t, i1 = idx ? idx.getScalar(t + 1) : t + 1, i2 = idx ? idx.getScalar(t + 2) : t + 2;
    pos.getElement(i0, a); pos.getElement(i1, b); pos.getElement(i2, c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; // ponderado por área
    for (const i of [i0, i1, i2]) { const o = key[i] * 3; acc[o] += nx; acc[o + 1] += ny; acc[o + 2] += nz; }
  }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const o = key[i] * 3;
    const l = Math.hypot(acc[o], acc[o + 1], acc[o + 2]) || 1;
    out[i * 3] = acc[o] / l; out[i * 3 + 1] = acc[o + 1] / l; out[i * 3 + 2] = acc[o + 2] / l;
  }
  const buffer = root.listBuffers()[0];
  prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(out).setBuffer(buffer));
}
for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) smoothNormals(prim);

// 5. Juntar piezas hermanas (menos llamadas de dibujo)
await doc.transform(join({ keepNamed: false }));

// 6. Texturas WebP
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 86, slots: /^(baseColor|normal)/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 80, resize: [512, 1024], slots: /metallicRoughness/ })
);

// 7. Limpieza, cuantización y compresión de geometría
await doc.transform(
  prune(),
  dedup(),
  reorder({ encoder: MeshoptEncoder }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' })
);

await io.write(output, doc);
for (const n of root.listNodes()) {
  const m = n.getMesh();
  if (m) console.log('node', n.getName(), 'parent', (n.getParentNode() || { getName: () => '-' }).getName(), 'prims', m.listPrimitives().map((p) => (p.getMaterial() ? p.getMaterial().getName() : 'none') + ':' + p.getAttribute('POSITION').getCount()).join(', '));
}
for (const t of root.listTextures()) console.log('texture', t.getMimeType(), t.getSize(), t.getImage().byteLength);
