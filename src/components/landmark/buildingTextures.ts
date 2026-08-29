import { useMemo } from 'react';
import * as THREE from 'three';

interface WindowTextureSet {
  colorMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

const CELL_SIZE = 18;

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

  ctx.fillStyle = `hsl(${baseHue}, 14%, 15%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      const lightness = 20 + rand() * 12;
      const isMullion = rand() < 0.06;
      ctx.fillStyle = isMullion ? `hsl(${baseHue}, 8%, 10%)` : `hsl(${baseHue + 8}, 16%, ${lightness}%)`;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }

  // Faint horizontal floor bands for structure.
  ctx.fillStyle = `hsla(${baseHue}, 10%, 6%, 0.35)`;
  for (let r = 0; r < rows; r += 3) {
    ctx.fillRect(0, r * CELL_SIZE, canvas.width, 1.5);
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
      const color = warmth > 0.72 ? '#ffe3b0' : warmth > 0.4 ? '#fff3d6' : '#cfe6ff';
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
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
    const cols = Math.max(3, Math.round(widthUnits * 9));
    const rows = Math.max(4, Math.round(heightUnits * 7));
    const baseHue = 195 + rand() * 40;
    const litRatio = 0.22 + rand() * 0.28;

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
