import { useMemo, useRef } from 'react';
import { extend, useFrame, type ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SkyMaterial = shaderMaterial(
  {
    nightColor: new THREE.Color('#050b14'),
    duskColor: new THREE.Color('#7e3141'),
    dayColor: new THREE.Color('#8fd0e0'),
    glowColor: new THREE.Color('#ffcf86'),
    dayPhase: 0,
    goldenPhase: 0,
    sunDirection: new THREE.Vector3(0, 1, 0),
    overcast: 0,
  },
  /* glsl */ `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 nightColor;
    uniform vec3 duskColor;
    uniform vec3 dayColor;
    uniform vec3 glowColor;
    uniform float dayPhase;
    uniform float goldenPhase;
    uniform vec3 sunDirection;
    uniform float overcast;
    varying vec3 vWorldPosition;

    void main() {
      float h = normalize(vWorldPosition).y;
      vec3 base = mix(nightColor, dayColor, dayPhase);

      float horizonBand = 1.0 - smoothstep(0.0, 0.55, abs(h));
      base = mix(base, duskColor, horizonBand * goldenPhase * 0.85);

      float sunDot = max(dot(normalize(vWorldPosition), normalize(sunDirection)), 0.0);
      float glow = pow(sunDot, 10.0) * (0.35 + goldenPhase * 0.65);
      base += glowColor * glow * (1.0 - overcast * 0.6);

      vec3 flatSky = mix(base, vec3(0.42, 0.44, 0.47) * mix(0.25, 1.0, dayPhase), overcast * 0.6);
      base = mix(base, flatSky, overcast * smoothstep(-0.1, 0.5, h));

      base = mix(base, base * 0.88, smoothstep(0.35, 1.0, h));

      gl_FragColor = vec4(base, 1.0);
    }
  `,
);

const StarFieldMaterial = shaderMaterial(
  { opacity: 0, pixelRatio: 1 },
  /* glsl */ `
    attribute float size;
    uniform float pixelRatio;
    varying float vAlpha;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
      vAlpha = clamp(1.0 - (-mvPosition.z) / 90.0, 0.35, 1.0);
    }
  `,
  /* glsl */ `
    uniform float opacity;
    varying float vAlpha;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      float disc = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vec3(1.0), disc * vAlpha * opacity);
    }
  `,
);

extend({ SkyMaterial, StarFieldMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    skyMaterial: ThreeElement<typeof SkyMaterial>;
    starFieldMaterial: ThreeElement<typeof StarFieldMaterial>;
  }
}

interface SkyDomeProps {
  deep: string;
  sky: string;
  glow: string;
  dayPhase: number;
  goldenPhase: number;
  sunElevation: number;
  overcast: number;
}

export function SkyDome({ deep, sky, glow, dayPhase, goldenPhase, sunElevation, overcast }: SkyDomeProps) {
  const materialRef = useRef<InstanceType<typeof SkyMaterial>>(null);
  const dayColor = useMemo(() => new THREE.Color('#8fd0e0'), []);
  const nightColor = useMemo(() => new THREE.Color(deep), [deep]);
  const duskColor = useMemo(() => new THREE.Color(sky), [sky]);
  const glowColor = useMemo(() => new THREE.Color(glow), [glow]);

  const sunDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const angle = (sunElevation * Math.PI) / 2 + Math.PI / 2;
    sunDirection.set(Math.cos(angle * 0.6), Math.sin(angle), 0.35).normalize();
    if (materialRef.current) {
      materialRef.current.sunDirection = sunDirection;
    }
  });

  return (
    <>
      <mesh scale={[60, 60, 60]}>
        <sphereGeometry args={[1, 32, 32]} />
        <skyMaterial
          ref={materialRef}
          key={SkyMaterial.key}
          side={THREE.BackSide}
          depthWrite={false}
          nightColor={nightColor}
          duskColor={duskColor}
          dayColor={dayColor}
          glowColor={glowColor}
          dayPhase={dayPhase}
          goldenPhase={goldenPhase}
          overcast={overcast}
        />
      </mesh>
      <StarField dayPhase={dayPhase} />
      <SunMoonDisc sunElevation={sunElevation} dayPhase={dayPhase} glow={glow} />
    </>
  );
}

function StarField({ dayPhase }: { dayPhase: number }) {
  const materialRef = useRef<InstanceType<typeof StarFieldMaterial>>(null);

  const [positions, sizes] = useMemo(() => {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 45 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 2;
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      size[i] = 0.6 + Math.random() * 1.6;
    }
    return [pos, size];
  }, []);

  useFrame(({ gl }) => {
    if (materialRef.current) {
      materialRef.current.opacity = 1 - dayPhase;
      materialRef.current.pixelRatio = gl.getPixelRatio();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <starFieldMaterial
        ref={materialRef}
        key={StarFieldMaterial.key}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SunMoonDisc({ sunElevation, dayPhase, glow }: { sunElevation: number; dayPhase: number; glow: string }) {
  const sunRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const sunMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const moonMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const radius = 40;

  useFrame(() => {
    const sunAngle = (sunElevation * Math.PI) / 2 + Math.PI / 2;
    const moonAngle = (-sunElevation * Math.PI) / 2 + Math.PI / 2;

    if (sunRef.current) {
      sunRef.current.position.set(Math.cos(sunAngle * 0.6) * radius, Math.sin(sunAngle) * radius, 0.35 * radius);
    }
    if (moonRef.current) {
      moonRef.current.position.set(
        -Math.cos(moonAngle * 0.6) * radius,
        Math.sin(moonAngle) * radius,
        -0.35 * radius,
      );
    }
    if (sunMaterialRef.current) sunMaterialRef.current.opacity = Math.max(0, Math.sin((sunAngle - Math.PI / 2) + Math.PI / 2)) * dayPhase;
    if (moonMaterialRef.current) moonMaterialRef.current.opacity = Math.max(0, Math.sin((moonAngle - Math.PI / 2) + Math.PI / 2)) * (1 - dayPhase);
  });

  return (
    <>
      <group ref={sunRef}>
        <mesh>
          <sphereGeometry args={[1.7, 24, 24]} />
          <meshBasicMaterial ref={sunMaterialRef} color={glow} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      </group>
      <group ref={moonRef}>
        <mesh>
          <sphereGeometry args={[1.05, 24, 24]} />
          <meshBasicMaterial ref={moonMaterialRef} color="#e4ecfb" toneMapped={false} transparent depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
