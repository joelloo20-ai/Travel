import { useMemo } from 'react';
import { extend, type ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { LandmarkKind } from '../../data/destinations';

const InkFacadeMaterial = shaderMaterial(
  {
    baseColor: new THREE.Color('#173b47'),
    glowColor: new THREE.Color('#bcecf0'),
    nightLights: 0,
    layerIndex: 0,
    seed: 0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 baseColor;
    uniform vec3 glowColor;
    uniform float nightLights;
    uniform float layerIndex;
    uniform float seed;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 0.00011) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 3; i++) {
        value += amplitude * noise(p);
        p = p * 2.03 + 13.1;
        amplitude *= 0.5;
      }
      return value;
    }
    void main() {
      vec2 uv = vUv;
      float wash = fbm(uv * vec2(4.0, 6.5) + vec2(seed * 0.0007, layerIndex * 2.4));
      float paperGrain = fbm(vWorldPosition.xy * 2.6 + seed * 0.0002);
      vec3 pigment = baseColor * (0.69 + wash * 0.52 + paperGrain * 0.12);

      float columns = 6.0 + layerIndex * 3.0;
      float floors = 18.0 + layerIndex * 8.0;
      vec2 grid = uv * vec2(columns, floors);
      vec2 cell = fract(grid);
      vec2 block = floor(grid);
      float verticalInk = 1.0 - smoothstep(0.025, 0.07, min(cell.x, 1.0 - cell.x));
      float horizontalInk = 1.0 - smoothstep(0.02, 0.055, min(cell.y, 1.0 - cell.y));
      float ink = max(verticalInk, horizontalInk);
      float litWindow = step(0.79 - nightLights * 0.36, hash(block + vec2(19.0, 71.0)));
      float paneVignette = smoothstep(0.04, 0.18, cell.x) * smoothstep(0.04, 0.18, 1.0 - cell.x);

      pigment = mix(pigment, pigment * 0.38, ink * 0.48);
      pigment += glowColor * litWindow * paneVignette * (0.045 + nightLights * 0.62);
      pigment += glowColor * smoothstep(0.9, 1.0, wash) * 0.06;

      gl_FragColor = vec4(pigment, 1.0);
    }
  `,
);

extend({ InkFacadeMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    inkFacadeMaterial: ThreeElement<typeof InkFacadeMaterial>;
  }
}

type SkylineLayer = 'far' | 'mid' | 'foreground';
type CrownProfile = 'needle' | 'sloped' | 'terraced' | 'crown' | 'wing' | 'arc';

interface SkylineSpec {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  profile: CrownProfile;
  seed: number;
}

interface CinematicSkylineProps {
  layer: SkylineLayer;
  landmark: LandmarkKind;
  deep: string;
  glow: string;
  nightLights: number;
}

interface CitySkylineCharacter {
  seed: number;
  density: number;
  height: number;
  width: number;
  clearway: number;
  profileShift: number;
  tone: string;
}

/** Each city gets its own rhythm, density and central sightline — not a recoloured copy. */
const CITY_SKYLINE: Record<LandmarkKind, CitySkylineCharacter> = {
  merlion: { seed: 71, density: 0.82, height: 0.84, width: 1.06, clearway: 3.4, profileShift: 2, tone: '#28635e' },
  'opera-house': { seed: 167, density: 0.68, height: 0.72, width: 1.02, clearway: 3.75, profileShift: 4, tone: '#3f5f67' },
  'eureka-tower': { seed: 283, density: 1.06, height: 1.16, width: 1.03, clearway: 3.05, profileShift: 1, tone: '#4c395d' },
  'canton-tower': { seed: 397, density: 1.08, height: 1.14, width: 1.0, clearway: 2.8, profileShift: 5, tone: '#663746' },
  'hk-skyline': { seed: 491, density: 1.32, height: 1.27, width: 0.94, clearway: 2.45, profileShift: 3, tone: '#354878' },
  'taipei-101': { seed: 587, density: 0.9, height: 0.92, width: 1.05, clearway: 3.65, profileShift: 0, tone: '#3d6159' },
  'tokyo-tower': { seed: 673, density: 1.2, height: 1.04, width: 1.0, clearway: 2.75, profileShift: 2, tone: '#592d39' },
  'osaka-castle': { seed: 761, density: 0.8, height: 0.76, width: 1.08, clearway: 3.7, profileShift: 5, tone: '#5e3939' },
  'seoul-tower': { seed: 853, density: 0.92, height: 0.88, width: 1.08, clearway: 3.8, profileShift: 1, tone: '#314c65' },
  'gwangan-bridge': { seed: 947, density: 0.9, height: 0.74, width: 1.1, clearway: 4.15, profileShift: 4, tone: '#245c6f' },
  'cruise-ship': { seed: 1031, density: 0.3, height: 0.42, width: 1, clearway: 5.2, profileShift: 0, tone: '#24576c' },
};

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function profileFor(index: number): CrownProfile {
  const profiles: CrownProfile[] = ['needle', 'sloped', 'terraced', 'crown', 'wing', 'arc'];
  return profiles[index % profiles.length];
}

function createSkyline(layer: SkylineLayer, landmark: LandmarkKind): SkylineSpec[] {
  const baseConfig = {
    far: { count: 34, xRange: 9.8, minWidth: 0.28, maxWidth: 0.64, minHeight: 0.72, maxHeight: 2.35, z: -0.28, seed: 291 },
    mid: { count: 28, xRange: 9.2, minWidth: 0.42, maxWidth: 0.92, minHeight: 1.15, maxHeight: 3.75, z: 0.06, seed: 719 },
    foreground: { count: 14, xRange: 9.7, minWidth: 0.62, maxWidth: 1.22, minHeight: 1.1, maxHeight: 3.65, z: 0.24, seed: 1327 },
  }[layer];
  const city = CITY_SKYLINE[landmark];
  const count = Math.max(7, Math.round(baseConfig.count * city.density));
  const xRange = baseConfig.xRange * city.width;
  const random = mulberry32(baseConfig.seed + city.seed);

  return Array.from({ length: count }, (_, index) => {
    let x = -xRange + ((index + 0.5) / count) * xRange * 2;
    if (layer === 'foreground') {
      const perSide = count / 2;
      const side = index < perSide ? -1 : 1;
      const sideIndex = index % perSide;
      const usableWidth = Math.max(1.8, xRange - city.clearway - 0.35);
      x = side * (city.clearway + 0.35 + ((sideIndex + 0.4) / perSide) * usableWidth);
    }
    x += (random() - 0.5) * 0.22;
    let height = (baseConfig.minHeight + random() * (baseConfig.maxHeight - baseConfig.minHeight)) * city.height;

    // A real visual corridor keeps the landmark from disappearing into its city.
    if (layer === 'mid' && Math.abs(x) < city.clearway) height *= 0.2;
    if (layer === 'far' && Math.abs(x) < city.clearway * 0.72) height *= 0.58;

    return {
      x,
      z: baseConfig.z + (random() - 0.5) * 0.2,
      width: baseConfig.minWidth + random() * (baseConfig.maxWidth - baseConfig.minWidth),
      height,
      depth: 0.11 + random() * 0.17,
      profile: profileFor(index + city.profileShift + Math.floor(random() * 3)),
      seed: Math.floor(random() * 100000),
    };
  });
}

function towerShape({ width, height, profile }: SkylineSpec) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);

  if (profile === 'needle') {
    shape.lineTo(-half, height * 0.82);
    shape.lineTo(-half * 0.34, height * 0.94);
    shape.lineTo(0, height);
    shape.lineTo(half * 0.34, height * 0.94);
    shape.lineTo(half, height * 0.82);
  } else if (profile === 'sloped') {
    shape.lineTo(-half, height * 0.77);
    shape.lineTo(half, height);
  } else if (profile === 'terraced') {
    shape.lineTo(-half, height * 0.72);
    shape.lineTo(-half * 0.56, height * 0.72);
    shape.lineTo(-half * 0.56, height * 0.88);
    shape.lineTo(half * 0.44, height * 0.88);
    shape.lineTo(half * 0.44, height);
    shape.lineTo(half, height);
  } else if (profile === 'crown') {
    shape.lineTo(-half, height * 0.86);
    shape.lineTo(-half * 0.56, height * 0.94);
    shape.lineTo(-half * 0.24, height * 0.88);
    shape.lineTo(0, height);
    shape.lineTo(half * 0.24, height * 0.88);
    shape.lineTo(half * 0.56, height * 0.94);
    shape.lineTo(half, height * 0.86);
  } else if (profile === 'wing') {
    shape.lineTo(-half, height * 0.68);
    shape.lineTo(-half * 0.3, height);
    shape.lineTo(half * 0.16, height * 0.9);
    shape.lineTo(half, height * 0.82);
  } else {
    shape.lineTo(-half, height * 0.72);
    shape.quadraticCurveTo(0, height * 1.05, half, height * 0.72);
  }

  shape.lineTo(half, 0);
  shape.closePath();
  return shape;
}

function Tower({ spec, color, glow, nightLights, layer }: { spec: SkylineSpec; color: THREE.Color; glow: string; nightLights: number; layer: SkylineLayer }) {
  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(towerShape(spec), { depth: spec.depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }),
    [spec],
  );
  const facadeColor = useMemo(() => color.clone().offsetHSL((spec.seed % 7) * 0.005, 0, ((spec.seed % 5) - 2) * 0.012), [color, spec.seed]);
  const glowColor = useMemo(() => new THREE.Color(glow), [glow]);
  const edgeOpacity = layer === 'far' ? 0.035 : layer === 'mid' ? 0.06 : 0.085;
  const layerIndex = layer === 'far' ? 0 : layer === 'mid' ? 1 : 2;

  return (
    <group position={[spec.x, 0, spec.z]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <inkFacadeMaterial
          key={InkFacadeMaterial.key}
          baseColor={facadeColor}
          glowColor={glowColor}
          nightLights={nightLights}
          layerIndex={layerIndex}
          seed={spec.seed}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry, 18]} />
        <lineBasicMaterial color={glow} transparent opacity={edgeOpacity} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/** Dense front-facing architectural silhouettes, purposely varied to avoid a box-grid skyline. */
export function CinematicSkyline({ layer, landmark, deep, glow, nightLights }: CinematicSkylineProps) {
  const city = CITY_SKYLINE[landmark];
  const towers = useMemo(() => createSkyline(layer, landmark), [layer, landmark]);
  const color = useMemo(() => {
    const base = new THREE.Color(deep);
    const cityTone = new THREE.Color(city.tone);
    const target = layer === 'far' ? cityTone.clone().lerp(new THREE.Color('#6f8587'), 0.26) : layer === 'mid' ? cityTone : cityTone.clone().lerp(new THREE.Color('#061216'), 0.34);
    return base.lerp(target, layer === 'far' ? 0.64 : layer === 'mid' ? 0.68 : 0.74);
  }, [city.tone, deep, layer]);

  return (
    <group>
      {towers.map((spec) => (
        <Tower key={`${layer}-${spec.seed}`} spec={spec} color={color} glow={glow} nightLights={nightLights} layer={layer} />
      ))}
    </group>
  );
}
