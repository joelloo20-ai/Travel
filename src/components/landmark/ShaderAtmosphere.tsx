import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Destination } from '../../data/destinations';
import type { LiveWeather } from '../../hooks/useLiveWeather';
import type { LocalTimeState } from '../../hooks/useLocalTime';

export interface ScenePointer {
  x: number;
  y: number;
}

interface ShaderAtmosphereProps {
  destination: Destination;
  weather: LiveWeather | null;
  localTime: LocalTimeState;
  pointerRef: MutableRefObject<ScenePointer>;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// This is deliberately a single full-screen pass: animated atmosphere without
// a texture download, a post-processing chain, or an invented 3D landmark.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uDaylight;
  uniform float uCloudCover;
  uniform float uRain;
  uniform vec2 uPointer;
  uniform vec3 uDeep;
  uniform vec3 uSky;
  uniform vec3 uGlow;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.02 + vec2(17.3, 9.2);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x += uPointer.x * mix(0.012, 0.046, uv.y);
    p.y += uPointer.y * mix(0.008, 0.024, uv.y);

    float daylight = clamp(uDaylight, 0.0, 1.0);
    vec3 dayTop = mix(uSky, vec3(0.43, 0.79, 0.9), 0.24);
    vec3 nightTop = mix(uDeep, vec3(0.08, 0.18, 0.31), 0.45);
    vec3 top = mix(nightTop, dayTop, daylight);
    vec3 horizon = mix(mix(uDeep, uGlow, 0.3), vec3(0.97, 0.75, 0.48), daylight * 0.48);
    float vertical = smoothstep(-0.5, 0.62, p.y + 0.22);
    vec3 color = mix(horizon, top, vertical);

    vec2 cloudPoint = p * vec2(2.35, 5.2) + vec2(uTime * 0.007, -uTime * 0.002);
    float cloudNoise = fbm(cloudPoint + fbm(cloudPoint * 0.58));
    float cloudBand = smoothstep(0.38, 0.76, cloudNoise) * smoothstep(-0.35, 0.28, p.y) * (1.0 - smoothstep(0.28, 0.72, p.y));
    vec3 cloudTint = mix(vec3(0.92, 0.96, 0.91), vec3(0.35, 0.44, 0.52), 1.0 - daylight);
    float cloudAmount = mix(0.2, 0.88, uCloudCover) + uRain * 0.18;
    color = mix(color, cloudTint, cloudBand * cloudAmount * 0.62);

    vec2 celestial = vec2(0.73 + uPointer.x * 0.026, 0.18 - uPointer.y * 0.018);
    float d = length(uv - celestial);
    float halo = 1.0 - smoothstep(0.035, 0.21, d);
    float disc = 1.0 - smoothstep(0.052, 0.061, d);
    vec3 light = mix(vec3(0.74, 0.84, 0.98), uGlow, daylight);
    color += light * halo * mix(0.34, 0.58, daylight);
    color += light * disc * 0.5;

    float haze = (1.0 - smoothstep(0.02, 0.46, abs(p.y + 0.12))) * (0.08 + uCloudCover * 0.17 + uRain * 0.09);
    color = mix(color, mix(uSky, uGlow, 0.38), haze);

    float grain = hash(gl_FragCoord.xy + fract(uTime) * 19.0) - 0.5;
    color += grain * 0.025;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function AtmospherePass({ destination, weather, localTime, pointerRef }: ShaderAtmosphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDaylight: { value: 0.65 },
      uCloudCover: { value: 0.2 },
      uRain: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uDeep: { value: new THREE.Color(destination.deep) },
      uSky: { value: new THREE.Color(destination.sky) },
      uGlow: { value: new THREE.Color(destination.glow) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  }), [destination.deep, destination.glow, destination.sky]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const activeMaterial = materialRef.current;
    if (!activeMaterial) return;

    activeMaterial.uniforms.uTime.value = clock.getElapsedTime();
    activeMaterial.uniforms.uDaylight.value = localTime.dayPhase;
    activeMaterial.uniforms.uCloudCover.value = (weather?.cloudCoverPct ?? 20) / 100;
    activeMaterial.uniforms.uRain.value = Math.min(1, (weather?.precipitationMm ?? 0) / 3);
    (activeMaterial.uniforms.uPointer.value as THREE.Vector2).lerp(pointerRef.current, 0.065);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <primitive ref={materialRef} attach="material" object={material} />
    </mesh>
  );
}

/** A pointer-responsive Three.js film atmosphere; the landmark remains an accurate SVG illustration above it. */
export function ShaderAtmosphere(props: ShaderAtmosphereProps) {
  return (
    <div className="shader-atmosphere" aria-hidden="true">
      <Canvas
        className="shader-atmosphere__canvas"
        orthographic
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      >
        <AtmospherePass {...props} />
      </Canvas>
    </div>
  );
}
