import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('public/assets/singapore-hdb.obj');
const destination = path.resolve('public/assets/singapore-hdb-central.obj');
const bounds = { minX: 29000, maxX: 32000, minY: 29500, maxY: 32500 };
const vertices = [null];
const kept = [false];
const faces = [];

for (const line of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
  if (line.startsWith('v ')) {
    const [, x, y, z] = line.split(/\s+/);
    const vertex = [Number(x), Number(y), Number(z)];
    vertices.push(vertex);
    kept.push(vertex[0] >= bounds.minX && vertex[0] <= bounds.maxX && vertex[1] >= bounds.minY && vertex[1] <= bounds.maxY);
    continue;
  }
  if (!line.startsWith('f ')) continue;
  const indices = line.slice(2).trim().split(/\s+/).map((value) => Number(value.split('/')[0]));
  if (indices.length >= 3 && indices.every((index) => kept[index])) faces.push(indices);
}

const used = new Set(faces.flat());
const remap = new Map();
const output = ['# Singapore HDB central district extract — see ATTRIBUTION.md'];
let next = 1;
for (let index = 1; index < vertices.length; index += 1) {
  if (!used.has(index)) continue;
  remap.set(index, next++);
  output.push(`v ${vertices[index].join(' ')}`);
}
for (const face of faces) output.push(`f ${face.map((index) => remap.get(index)).join(' ')}`);
fs.writeFileSync(destination, `${output.join('\n')}\n`);
console.log(`Wrote ${faces.length.toLocaleString()} faces and ${used.size.toLocaleString()} vertices to ${destination}`);
