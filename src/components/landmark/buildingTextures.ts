import { useMemo } from 'react';
import * as THREE from 'three';

interface WindowTextureSet {
  colorMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

// Keep the generated facade fine-grained even on the narrow towers used by the
// diorama. Large emissive squares read as toy blocks from the hero camera.
const CELL_SIZE = 12;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildFacadeCanvas(cols: number, rows: number, rand: () => number, baseHue: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL_SIZE;
  canvas.height = rows * CELL_SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = `hsl(${baseHue}, 17%, 13%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      const lightness = 18 + rand() * 5;
      const isMullion = rand() < 0.07;
      ctx.fillStyle = isMullion ? `hsl(${baseHue}, 10%, 8%)` : `hsl(${baseHue + 8}, 18%, ${lightness}%)`;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }

  // Faint horizontal floor bands for structure.
  ctx.fillStyle = `hsla(${baseHue}, 12%, 5%, 0.5)`;
  for (let r = 0; r < rows; r += 2) {
    ctx.fillRect(0, r * CELL_SIZE, canvas.width, 1);
  }

  return canvas;
}

function buildEmissiveCanvas(cols: number, rows: number, rand: () => number, litRatio: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL_SIZE;
  canvas.height = rows * CELL_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > litRatio) continue;
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      const warmth = rand();
      const color = warmth > 0.62 ? '#f5c27d' : warmth > 0.22 ? '#e6c39b' : '#92b1ba';
      ctx.fillStyle = color;
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    }
  }

  return canvas;
}

/**
 * Generates a matched color/emissive texture pair that reads as a lit glass
 * facade: a subdued mullion grid for daylight, and a sparse warm/cool window
 * grid (via emissiveMap, faded in by night) for after dark.
 */
export function useWindowTextures(widthUnits: number, heightUnits: number, seed: number): WindowTextureSet {
  return useMemo(() => {
    const rand = mulberry32(Math.floor(seed * 100000) + 1);
    const cols = Math.max(5, Math.round(widthUnits * 15));
    const rows = Math.max(8, Math.round(heightUnits * 13));
    const baseHue = 195 + rand() * 40;
    const litRatio = 0.07 + rand() * 0.11;

    const colorCanvas = buildFacadeCanvas(cols, rows, mulberry32(Math.floor(seed * 100000) + 1), baseHue);
    const emissiveCanvas = buildEmissiveCanvas(cols, rows, mulberry32(Math.floor(seed * 100000) + 7), litRatio);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = colorMap.wrapT = THREE.ClampToEdgeWrapping;
    colorMap.anisotropy = 4;

    const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.wrapS = emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
    emissiveMap.anisotropy = 4;

    return { colorMap, emissiveMap };
  }, [widthUnits, heightUnits, seed]);
}

function buildLatticeAlphaTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'square';

  const bays = 4;
  const bay = size / bays;
  for (let i = 0; i < bays; i++) {
    const x0 = i * bay;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + bay, bay);
    ctx.moveTo(x0 + bay, 0);
    ctx.lineTo(x0, bay);
    ctx.stroke();
  }
  // Horizontal chords between bays.
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(size, 1);
  ctx.moveTo(0, size - 1);
  ctx.lineTo(size, size - 1);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 26);
  return texture;
}

// Built once at module load (not per-render): identical for every lattice
// tower in the scene, so there is nothing to memoize per-component.
let latticeAlphaTextureSingleton: THREE.CanvasTexture | undefined;

/**
 * A repeating diagonal-crosshatch cutout mask so a solid lathe/revolved
 * profile reads as an open steel lattice/truss tower (Tokyo Tower, Canton
 * Tower, N Seoul Tower) instead of a painted solid cone.
 */
export function useLatticeAlphaTexture(): THREE.CanvasTexture {
  latticeAlphaTextureSingleton ??= buildLatticeAlphaTexture();
  return latticeAlphaTextureSingleton;
}
