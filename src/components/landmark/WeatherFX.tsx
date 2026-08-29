import { useMemo, useRef } from 'react';
import { extend, useFrame, type ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { WeatherCondition } from '../../hooks/useLiveWeather';

const AREA_SIZE = 14;

const RainMaterial = shaderMaterial(
  { time: 0, speed: 9, height: 10, wind: new THREE.Vector2(0, 0), dayPhase: 0, opacity: 0.5 },
  /* glsl */ `
    attribute vec3 aSeed;
    uniform float time;
    uniform float speed;
    uniform float height;
    uniform vec2 wind;
    varying float vAlpha;
    void main() {
      float fallY = mod(aSeed.z * height - time * speed, height) - height * 0.5;
      vec3 base = vec3(aSeed.x * ${AREA_SIZE.toFixed(1)}, fallY, aSeed.y * ${AREA_SIZE.toFixed(1)});
      base.xz += wind * (height * 0.5 - fallY) * 0.015;
      vec3 finalPos = base + position;
      vAlpha = smoothstep(-height * 0.5, -height * 0.5 + 1.2, fallY) * smoothstep(height * 0.5, height * 0.5 - 1.5, fallY);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
    }
  `,
  /* glsl */ `
    uniform float dayPhase;
    uniform float opacity;
    varying float vAlpha;
    void main() {
      vec3 dayColor = vec3(0.32, 0.4, 0.46);
      vec3 nightColor = vec3(0.82, 0.9, 0.96);
      vec3 color = mix(nightColor, dayColor, dayPhase);
      gl_FragColor = vec4(color, vAlpha * opacity);
    }
  `,
);

const SnowMaterial = shaderMaterial(
  {
    time: 0,
    speed: 0.9,
    height: 10,
    wind: new THREE.Vector2(0, 0),
    pixelRatio: 1,
    opacity: 0.85,
  },
  /* glsl */ `
    attribute vec3 aSeed;
    attribute float aSize;
    uniform float time;
    uniform float speed;
    uniform float height;
    uniform vec2 wind;
    uniform float pixelRatio;
    varying float vAlpha;
    void main() {
      float fallY = mod(aSeed.z * height - time * speed, height) - height * 0.5;
      float sway = sin(time * 0.6 + aSeed.x * 20.0) * 0.5;
      vec3 base = vec3(aSeed.x * ${AREA_SIZE.toFixed(1)} + sway, fallY, aSeed.y * ${AREA_SIZE.toFixed(1)});
      base.xz += wind * (height * 0.5 - fallY) * 0.02;
      vAlpha = smoothstep(-height * 0.5, -height * 0.5 + 1.0, fallY) * smoothstep(height * 0.5, height * 0.5 - 1.5, fallY);
      vec4 mvPosition = modelViewMatrix * vec4(base, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = min(aSize * pixelRatio * (14.0 / -mvPosition.z), 18.0);
    }
  `,
  /* glsl */ `
    uniform float opacity;
    varying float vAlpha;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      float disc = smoothstep(0.5, 0.05, d);
      gl_FragColor = vec4(vec3(1.0), disc * vAlpha * opacity);
    }
  `,
);

extend({ RainMaterial, SnowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    rainMaterial: ThreeElement<typeof RainMaterial>;
    snowMaterial: ThreeElement<typeof SnowMaterial>;
  }
}

function useDropAttributes(count: number, streakLength: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 2 * 3);
    const seeds = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i++) {
      const topIndex = i * 2 * 3;
      const bottomIndex = topIndex + 3;
      positions[topIndex] = 0;
      positions[topIndex + 1] = 0;
      positions[topIndex + 2] = 0;
      positions[bottomIndex] = 0;
      positions[bottomIndex + 1] = -streakLength;
      positions[bottomIndex + 2] = 0;

      const seed = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()];
      seeds[topIndex] = seed[0];
      seeds[topIndex + 1] = seed[1];
      seeds[topIndex + 2] = seed[2];
      seeds[bottomIndex] = seed[0];
      seeds[bottomIndex + 1] = seed[1];
      seeds[bottomIndex + 2] = seed[2];
    }
    return { positions, seeds };
  }, [count, streakLength]);
}

interface RainProps {
  intensity: number;
  windX: number;
  windZ: number;
  dayPhase: number;
}

export function Rain({ intensity, windX, windZ, dayPhase }: RainProps) {
  const count = Math.round(400 + intensity * 900);
  const { positions, seeds } = useDropAttributes(count, 0.35);
  const materialRef = useRef<InstanceType<typeof RainMaterial>>(null);
  const wind = useMemo(() => new THREE.Vector2(), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.elapsedTime;
      wind.set(windX, windZ);
      materialRef.current.wind = wind;
    }
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
      </bufferGeometry>
      <rainMaterial
        ref={materialRef}
        key={RainMaterial.key}
        transparent
        depthWrite={false}
        opacity={0.35 + intensity * 0.35}
        speed={7 + intensity * 6}
        dayPhase={dayPhase}
      />
    </lineSegments>
  );
}

interface SnowProps {
  intensity: number;
  windX: number;
  windZ: number;
}

export function Snow({ intensity, windX, windZ }: SnowProps) {
  const count = Math.round(250 + intensity * 500);
  const { positions, seeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seedArr = new Float32Array(count * 3);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      seedArr[i * 3] = Math.random() * 2 - 1;
      seedArr[i * 3 + 1] = Math.random() * 2 - 1;
      seedArr[i * 3 + 2] = Math.random();
      size[i] = 1.4 + Math.random() * 2.4;
    }
    return { positions: pos, seeds: seedArr, sizes: size };
  }, [count]);

  const materialRef = useRef<InstanceType<typeof SnowMaterial>>(null);
  const wind = useMemo(() => new THREE.Vector2(), []);

  useFrame(({ clock, gl }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.elapsedTime;
      materialRef.current.pixelRatio = gl.getPixelRatio();
      wind.set(windX, windZ);
      materialRef.current.wind = wind;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <snowMaterial
        ref={materialRef}
        key={SnowMaterial.key}
        transparent
        depthWrite={false}
        opacity={0.55 + intensity * 0.35}
        speed={0.6 + intensity * 0.5}
      />
    </points>
  );
}

interface CloudPuffsProps {
  coverage: number;
  windX: number;
  windZ: number;
  tint: string;
}

/** A handful of soft, low-poly cloud clusters drifting slowly overhead. */
export function CloudPuffs({ coverage, windX, windZ, tint }: CloudPuffsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: (Math.random() * 2 - 1) * 16,
        z: (Math.random() * 2 - 1) * 16,
        y: 6 + Math.random() * 4,
        scale: 1.4 + Math.random() * 1.8,
        seed: i,
      })),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x += windX * delta * 0.05;
    groupRef.current.position.z += windZ * delta * 0.05;
    if (Math.abs(groupRef.current.position.x) > 20) groupRef.current.position.x *= -0.98;
    if (Math.abs(groupRef.current.position.z) > 20) groupRef.current.position.z *= -0.98;
  });

  if (coverage < 0.08) return null;

  return (
    <group ref={groupRef}>
      {puffs.map((puff) => (
        <group key={puff.seed} position={[puff.x, puff.y, puff.z]} scale={puff.scale}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.6 - 0.6, Math.sin(i) * 0.15, 0]}>
              <sphereGeometry args={[0.7, 10, 10]} />
              <meshBasicMaterial color={tint} transparent opacity={coverage * 0.32} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

interface WeatherEffectsProps {
  condition: WeatherCondition;
  precipitationMm: number;
  cloudCoverPct: number;
  windKph: number;
  windDirectionDeg: number;
  cloudTint: string;
  dayPhase: number;
}

export function WeatherEffects({
  condition,
  precipitationMm,
  cloudCoverPct,
  windKph,
  windDirectionDeg,
  cloudTint,
  dayPhase,
}: WeatherEffectsProps) {
  const rad = (windDirectionDeg * Math.PI) / 180;
  const windStrength = Math.min(windKph / 40, 1.4);
  const windX = Math.sin(rad) * windStrength;
  const windZ = Math.cos(rad) * windStrength;
  const coverage = cloudCoverPct / 100;

  const showRain = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm';
  const showSnow = condition === 'snow';
  const rainIntensity =
    condition === 'thunderstorm' ? 1 : condition === 'drizzle' ? 0.3 : Math.min(0.4 + precipitationMm / 8, 1);
  const snowIntensity = Math.min(0.4 + precipitationMm / 4, 1);

  return (
    <>
      {showRain && <Rain intensity={rainIntensity} windX={windX} windZ={windZ} dayPhase={dayPhase} />}
      {showSnow && <Snow intensity={snowIntensity} windX={windX} windZ={windZ} />}
      {(condition === 'cloudy' || condition === 'fog' || showRain || showSnow) && (
        <CloudPuffs coverage={Math.max(coverage, showRain || showSnow ? 0.7 : 0)} windX={windX} windZ={windZ} tint={cloudTint} />
      )}
    </>
  );
}
