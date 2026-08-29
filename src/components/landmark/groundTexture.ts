import { useMemo } from 'react';
import * as THREE from 'three';

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

/**
 * A lifted, lightly speckled paving-slab texture derived from a destination's
 * (very dark, night-sky-tuned) accent color — used instead of the raw hex so
 * the ground actually has enough albedo to read as lit pavement, not a void.
 */
export function useGroundTexture(baseHex: string): { map: THREE.CanvasTexture; liftedColor: THREE.Color } {
  return useMemo(() => {
    const lifted = new THREE.Color(baseHex).lerp(new THREE.Color('#9a9d98'), 0.42);
    const rand = mulberry32(1337);

    const size = 512;
    const tile = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const baseCss = `#${lifted.getHexString()}`;
    ctx.fillStyle = baseCss;
    ctx.fillRect(0, 0, size, size);

    // Subtle per-slab tonal variation.
    for (let y = 0; y < size; y += tile) {
      for (let x = 0; x < size; x += tile) {
        const shade = (rand() - 0.5) * 10;
        const c = lifted.clone().offsetHSL(0, 0, shade / 255);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(x, y, tile, tile);
      }
    }

    // Expansion-joint grid lines.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= size; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Fine speckle noise for texture.
    for (let i = 0; i < 2200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const a = rand() * 0.08;
      ctx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(7, 7);
    map.anisotropy = 4;

    return { map, liftedColor: lifted };
  }, [baseHex]);
}
