import { useMemo, useRef } from 'react';
import { extend, useFrame, type ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const WaterMaterial = shaderMaterial(
  {
    time: 0,
    deepColor: new THREE.Color('#04181a'),
    surfaceColor: new THREE.Color('#1c5c63'),
    sunColor: new THREE.Color('#ffcf86'),
    dayPhase: 0,
    choppiness: 0.2,
    opacity: 0.92,
  },
  /* glsl */ `
    uniform float time;
    uniform float choppiness;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float w = sin(pos.x * 0.9 + time * 0.5) * 0.05 + sin(pos.y * 1.3 - time * 0.7) * 0.035;
      w *= (0.4 + choppiness);
      pos.z += w;
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 deepColor;
    uniform vec3 surfaceColor;
    uniform vec3 sunColor;
    uniform float dayPhase;
    uniform float opacity;
    uniform float time;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      float d = distance(vUv, vec2(0.5));
      vec3 base = mix(surfaceColor, deepColor, smoothstep(0.0, 0.75, d));

      // Two independently-drifting, non-axis-aligned noise cells avoid the
      // grid/moire look of a pure sine product while staying cheap.
      vec2 driftA = vWorldPos.xz * 11.0 + vec2(time * 0.22, -time * 0.11);
      vec2 driftB = (vWorldPos.xz * 19.0 + vec2(-time * 0.17, time * 0.26)) * mat2(0.8, 0.6, -0.6, 0.8);
      float cellA = hash21(floor(driftA));
      float cellB = hash21(floor(driftB) + 19.7);
      float twinkle = step(0.975, cellA) * step(0.6, fract(cellB + time * 0.4));
      float sparkle = twinkle * (0.6 + 0.4 * sin(time * 6.0 + cellA * 40.0));
      base += sunColor * sparkle * (0.4 + dayPhase * 0.6);

      gl_FragColor = vec4(base, opacity);
    }
  `,
);

extend({ WaterMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    waterMaterial: ThreeElement<typeof WaterMaterial>;
  }
}

interface WaterProps {
  deep: string;
  sky: string;
  glow: string;
  dayPhase: number;
  choppiness: number;
  size?: number;
}

export function Water({ deep, sky, glow, dayPhase, choppiness, size = 40 }: WaterProps) {
  const materialRef = useRef<InstanceType<typeof WaterMaterial>>(null);
  const deepColor = useMemo(() => new THREE.Color(deep), [deep]);
  // City water is a reflector, not a second bright sky plane. Keeping it close
  // to the deep tone lets the sparse moving highlights carry the atmosphere.
  const surfaceColor = useMemo(() => new THREE.Color(sky).lerp(new THREE.Color(deep), 0.42), [deep, sky]);
  const sunColor = useMemo(() => new THREE.Color(glow), [glow]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[size, size, 64, 64]} />
      <waterMaterial
        ref={materialRef}
        key={WaterMaterial.key}
        transparent
        depthWrite={false}
        deepColor={deepColor}
        surfaceColor={surfaceColor}
        sunColor={sunColor}
        dayPhase={dayPhase}
        choppiness={choppiness}
      />
    </mesh>
  );
}
