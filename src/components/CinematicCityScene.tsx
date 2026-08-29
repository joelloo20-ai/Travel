import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, BufferAttribute } from 'three';
import type { Destination } from '../data/destinations';
import type { WeatherAtmosphere } from '../hooks/useCurrentWeather';

type LandmarkKind = 'marina-bay' | 'opera-house' | 'melbourne-spire' | 'canton-tower' | 'harbour-skyline' | 'taipei-101' | 'skytree' | 'osaka-castle' | 'namsan' | 'gwangan-bridge' | 'cruise' | 'metropolis';
type TerrainKind = 'mountain-basin' | 'harbour-ridge' | 'lowland';

interface SceneProfile {
  label: string;
  kind: LandmarkKind;
  terrain: TerrainKind;
  water: boolean;
  rain: boolean;
}

const profiles: Record<string, SceneProfile> = {
  singapore: { label: 'Marina Bay Sands', kind: 'marina-bay', terrain: 'harbour-ridge', water: true, rain: true },
  sydney: { label: 'Sydney Opera House', kind: 'opera-house', terrain: 'harbour-ridge', water: true, rain: false },
  melbourne: { label: 'Melbourne Arts Centre Spire', kind: 'melbourne-spire', terrain: 'lowland', water: true, rain: true },
  guangzhou: { label: 'Canton Tower', kind: 'canton-tower', terrain: 'lowland', water: true, rain: true },
  'hong-kong': { label: 'Victoria Harbour skyline', kind: 'harbour-skyline', terrain: 'harbour-ridge', water: true, rain: false },
  taipei: { label: 'Taipei 101', kind: 'taipei-101', terrain: 'mountain-basin', water: false, rain: true },
  tokyo: { label: 'Tokyo Skytree', kind: 'skytree', terrain: 'lowland', water: false, rain: false },
  osaka: { label: 'Osaka Castle', kind: 'osaka-castle', terrain: 'harbour-ridge', water: true, rain: false },
  seoul: { label: 'N Seoul Tower', kind: 'namsan', terrain: 'mountain-basin', water: false, rain: false },
  busan: { label: 'Gwangan Bridge', kind: 'gwangan-bridge', terrain: 'harbour-ridge', water: true, rain: false },
  'disney-cruise': { label: 'Disney Cruise liner', kind: 'cruise', terrain: 'harbour-ridge', water: true, rain: false },
  metropolis: { label: 'City skyline', kind: 'metropolis', terrain: 'lowland', water: false, rain: true },
};

const fallbackProfile: SceneProfile = profiles.metropolis;
const warmLight = '#ffd68c';
const buildingTint = '#164755';
const cinematicCycleSeconds = 1800;

function localSolarHour(longitude: number, elapsed: number, reduced: boolean) {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const locationHour = (utcHour + longitude / 15 + 24) % 24;
  return reduced ? locationHour : (locationHour + elapsed * 24 / cinematicCycleSeconds) % 24;
}

function solarState(hour: number) {
  const angle = (hour - 6) / 12 * Math.PI;
  const elevation = Math.sin(angle);
  const x = Math.cos(angle);
  return { elevation, x, daylight: THREE.MathUtils.smoothstep(elevation, -0.14, 0.12), twilight: 1 - THREE.MathUtils.smoothstep(Math.abs(elevation), 0.05, 0.5) };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

function Tower({ position, size, accent, glow, rounded = 0.12 }: { position: [number, number, number]; size: [number, number, number]; accent: string; glow: string; rounded?: number }) {
  return <group position={position}>
    <RoundedBox args={size} radius={rounded} smoothness={4}>
      <meshPhysicalMaterial color={buildingTint} metalness={0.74} roughness={0.26} clearcoat={0.78} clearcoatRoughness={0.2} />
    </RoundedBox>
    <mesh position={[0, 0.06, size[2] * 0.51]}>
      <boxGeometry args={[size[0] * 0.7, size[1] * 0.82, 0.025]} />
      <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.72} roughness={0.4} transparent opacity={0.7} />
    </mesh>
  </group>;
}

function MarinaBay({ accent, glow }: { accent: string; glow: string }) {
  const towers = [[-2.12, 3.86, -0.115], [0, 4.15, -0.018], [2.12, 3.9, 0.082]] as const;
  return <group position={[0, 0, 0]}>
    {towers.map(([x, height, lean]) => <group key={x} position={[x, height / 2 + 0.28, 0]} rotation={[0, 0, lean]}><Tower position={[0, 0, 0]} size={[1.26, height, 0.92]} accent={accent} glow={glow} /></group>)}
    <RoundedBox args={[5.85, 0.16, 0.76]} radius={0.05} smoothness={3} position={[0, 3.08, 0]}><meshStandardMaterial color="#18343b" metalness={0.8} roughness={0.24} /></RoundedBox>
    <RoundedBox args={[7.3, 0.32, 1.3]} radius={0.16} smoothness={5} position={[0.2, 6.36, 0.03]} rotation={[0, 0, -0.022]}>
      <meshPhysicalMaterial color="#1d3841" metalness={0.86} roughness={0.2} clearcoat={1} />
    </RoundedBox>
    <RoundedBox args={[1.75, 0.18, 1.14]} radius={0.08} smoothness={4} position={[3.72, 6.31, 0.03]}><meshPhysicalMaterial color="#213d43" metalness={0.85} roughness={0.18} clearcoat={1} /></RoundedBox>
    <mesh position={[0.2, 6.58, 0.02]}><boxGeometry args={[6.9, 0.04, 0.08]} /><meshBasicMaterial color={warmLight} /></mesh>
    {[-1.8, -0.65, 0.65, 1.8].map((x) => <pointLight key={x} position={[x, 6.1, 1.1]} color={glow} intensity={2.1} distance={4.4} />)}
    <group position={[3.92, 0.54, 0.7]} rotation={[0.1, 0.1, -0.18]}>
      {[0, 1, 2, 3, 4].map((index) => <mesh key={index} position={[Math.cos(index * 1.25) * 0.58, 0, Math.sin(index * 1.25) * 0.26]} rotation={[0.2, index * 1.25, 0.8]} scale={[0.9, 0.17, 0.44]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#d7eff0" metalness={0.45} roughness={0.3} /></mesh>)}
    </group>
  </group>;
}

function OperaHouse({ accent, glow }: { accent: string; glow: string }) {
  const shells = [[-1.55, 0.85, 0.48], [-0.35, 1.32, 0.62], [1.05, 1.1, 0.55]] as const;
  return <group position={[0, 0.23, 0]} rotation={[0, -0.18, 0]}>
    <RoundedBox args={[6.5, 0.42, 1.85]} radius={0.12} smoothness={4} position={[0, 0.22, 0]}><meshStandardMaterial color="#101f27" metalness={0.72} roughness={0.24} /></RoundedBox>
    {shells.map(([x, height, width]) => <mesh key={x} position={[x, height * 0.56, 0.18]} rotation={[0, 0, -0.39]} scale={[width * 1.5, height, 0.78]}><sphereGeometry args={[1, 36, 24, 0, Math.PI * 1.05, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#dce7e3" metalness={0.18} roughness={0.16} clearcoat={0.9} /></mesh>)}
    <pointLight position={[0, 2.1, 2.2]} color={glow} intensity={4} distance={6} />
    <mesh position={[0, 0.49, 1.05]}><boxGeometry args={[5.7, 0.05, 0.04]} /><meshBasicMaterial color={accent} /></mesh>
  </group>;
}

function MelbourneSpire({ accent, glow }: { accent: string; glow: string }) {
  return <group>
    <RoundedBox args={[3.95, 0.86, 1.88]} radius={0.12} smoothness={4} position={[0, 0.45, 0]}><meshStandardMaterial color="#13222d" metalness={0.8} roughness={0.23} /></RoundedBox>
    <mesh position={[0, 4.26, 0]}><boxGeometry args={[0.038, 6.6, 0.038]} /><meshBasicMaterial color={glow} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * 0.32, 3.45, 0]} rotation={[0, 0, side * -0.102]}><boxGeometry args={[0.048, 5.85, 0.048]} /><meshBasicMaterial color={accent} /></mesh>)}
    {[-1, 1].map((side) => [1.15, 1.92, 2.7, 3.48, 4.25].map((y) => <mesh key={`${side}-${y}`} position={[side * (0.5 - y * 0.068), y, 0.08]} rotation={[0, 0, side * -0.56]}><boxGeometry args={[0.028, 1.12, 0.028]} /><meshBasicMaterial color={glow} transparent opacity={0.85} /></mesh>))}
    {[0.78, 1.28, 1.82, 2.46, 3.17, 3.9, 4.6, 5.17].map((y) => <mesh key={y} position={[0, y, 0.03]} scale={[1 + y * 0.06, 1, 0.7]}><torusGeometry args={[0.38 - y * 0.045, 0.018, 8, 32]} /><meshBasicMaterial color={glow} transparent opacity={0.68} /></mesh>)}
    <mesh position={[0, 5.7, 0]}><coneGeometry args={[0.06, 1.62, 8]} /><meshBasicMaterial color={glow} /></mesh>
    <pointLight position={[0.1, 2.3, 1.4]} color={glow} intensity={5.4} distance={7} />
  </group>;
}

function CantonTower({ accent, glow }: { accent: string; glow: string }) {
  const lattice = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const angle = index / 14 * Math.PI * 2;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 0.86, 0.35, Math.sin(angle) * 0.86),
      new THREE.Vector3(Math.cos(angle + Math.PI * 0.72) * 0.31, 3.25, Math.sin(angle + Math.PI * 0.72) * 0.31),
      new THREE.Vector3(Math.cos(angle + Math.PI * 1.28) * 0.76, 6.15, Math.sin(angle + Math.PI * 1.28) * 0.76),
    ]);
  }), []);
  return <group>
    <mesh position={[0, 3.28, 0]}><cylinderGeometry args={[0.19, 0.27, 6.15, 20]} /><meshPhysicalMaterial color="#132d38" metalness={0.88} roughness={0.18} /></mesh>
    {lattice.map((curve, index) => <mesh key={index}><tubeGeometry args={[curve, 32, 0.027, 6, false]} /><meshStandardMaterial color={index % 2 ? accent : glow} emissive={glow} emissiveIntensity={0.18} metalness={0.82} roughness={0.22} /></mesh>)}
    <mesh position={[0, 3.3, 0]} scale={[1.2, 1, 0.58]}><torusGeometry args={[0.98, 0.048, 10, 64]} /><meshBasicMaterial color={accent} /></mesh>
    <mesh position={[0, 5.55, 0]}><torusGeometry args={[0.81, 0.05, 10, 56]} /><meshBasicMaterial color={glow} /></mesh>
    <mesh position={[0, 6.9, 0]}><coneGeometry args={[0.075, 1.82, 10]} /><meshBasicMaterial color={glow} /></mesh>
    <pointLight position={[0, 4.1, 1.2]} color={glow} intensity={4.5} distance={7} />
  </group>;
}

function Taipei101({ accent, glow }: { accent: string; glow: string }) {
  return <group>
    {Array.from({ length: 8 }, (_, index) => {
      const width = 2.38 - index * 0.18;
      const height = 0.64;
      const y = 0.52 + index * 0.72;
      const taper = 0.12 + index * 0.008;
      return <group key={index} position={[0, y, 0]}>
        <RoundedBox args={[width, height, 1.18]} radius={0.075} smoothness={4}><meshPhysicalMaterial color={index % 2 ? '#10464c' : '#1b6861'} metalness={0.7} roughness={0.17} clearcoat={0.94} clearcoatRoughness={0.16} /></RoundedBox>
        <mesh position={[0, height * 0.49, 0]}><boxGeometry args={[width * 1.16, 0.105, 1.23]} /><meshPhysicalMaterial color="#123e42" metalness={0.78} roughness={0.18} clearcoat={0.82} /></mesh>
        <mesh position={[0, -height * 0.53, 0.612]}><boxGeometry args={[width * 1.05, 0.068, 0.028]} /><meshBasicMaterial color={accent} /></mesh>
        <mesh position={[0, 0.02, 0.606]}><planeGeometry args={[width * 0.8, height * 0.7]} /><meshPhysicalMaterial color="#7ec5b1" transparent opacity={0.14} metalness={0.7} roughness={0.09} /></mesh>
        {[-1, 1].map((side) => <group key={side}>
          <mesh position={[side * width * 0.49, 0.01, 0]} rotation={[0, 0, side * taper]}><boxGeometry args={[0.056, height * 1.06, 1.21]} /><meshBasicMaterial color="#8dc5ab" transparent opacity={0.42} /></mesh>
          <mesh position={[side * width * 0.3, 0, 0.624]}><boxGeometry args={[0.052, height * 0.73, 0.022]} /><meshBasicMaterial color={glow} transparent opacity={0.64} /></mesh>
        </group>)}
        <group position={[0, -height * 0.1, 0.635]} scale={[0.62, 0.62, 1]}>
          <mesh><torusGeometry args={[0.13, 0.028, 8, 20, Math.PI]} /><meshBasicMaterial color="#d7ac5d" /></mesh>
          <mesh position={[0, 0.095, 0]}><circleGeometry args={[0.075, 16]} /><meshBasicMaterial color="#d7ac5d" /></mesh>
        </group>
      </group>;
    })}
    <RoundedBox args={[3.05, 0.5, 1.72]} radius={0.1} smoothness={4} position={[0, 0.29, 0]}><meshPhysicalMaterial color="#173e42" metalness={0.72} roughness={0.22} clearcoat={0.82} /></RoundedBox>
    <mesh position={[0, 6.25, 0]}><cylinderGeometry args={[0.24, 0.38, 0.58, 8]} /><meshPhysicalMaterial color="#19534f" metalness={0.76} roughness={0.18} clearcoat={0.82} /></mesh>
    <mesh position={[0, 7.03, 0]}><coneGeometry args={[0.065, 1.88, 8]} /><meshBasicMaterial color={glow} /></mesh>
    <mesh position={[0, 6.72, 0.02]}><coneGeometry args={[0.21, 0.48, 8]} /><meshBasicMaterial color="#d7ac5d" /></mesh>
    <pointLight position={[0, 4.3, 1.5]} color={glow} intensity={3.5} distance={6} />
  </group>;
}

function Skytree({ accent, glow }: { accent: string; glow: string }) {
  const legs = useMemo(() => [-1, 1].map((side) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 1.05, 0.2, 0),
    new THREE.Vector3(side * 0.78, 1.3, 0.08),
    new THREE.Vector3(side * 0.26, 2.75, 0),
  ])), []);
  return <group>
    {legs.map((curve, index) => <mesh key={index}><tubeGeometry args={[curve, 24, 0.09, 8, false]} /><meshPhysicalMaterial color="#183744" metalness={0.86} roughness={0.17} /></mesh>)}
    <mesh position={[0, 4.55, 0]}><cylinderGeometry args={[0.16, 0.33, 5.55, 20]} /><meshPhysicalMaterial color="#102c3b" metalness={0.84} roughness={0.18} /></mesh>
    {[2.52, 4.15].map((y, index) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[index ? 0.48 : 0.7, index ? 0.48 : 0.7, 0.22, 28]} /><meshStandardMaterial color="#193643" emissive={accent} emissiveIntensity={0.32} metalness={0.8} roughness={0.2} /></mesh>)}
    <mesh position={[0, 7.55, 0]}><coneGeometry args={[0.07, 2.15, 8]} /><meshBasicMaterial color={glow} /></mesh>
    <pointLight position={[0, 4.2, 1.2]} color={glow} intensity={3.4} distance={6} />
  </group>;
}

function OsakaCastle({ accent, glow }: { accent: string; glow: string }) {
  const floors = [[3.55, 0.6, 2.35], [2.95, 1.18, 1.9], [2.32, 1.76, 1.45], [1.66, 2.34, 1.05]] as const;
  return <group>
    <RoundedBox args={[4.7, 0.68, 2.7]} radius={0.08} smoothness={3} position={[0, 0.34, 0]}><meshStandardMaterial color="#59665f" roughness={0.86} /></RoundedBox>
    {floors.map(([width, y, roof]) => <group key={y} position={[0, y, 0]}>
      <mesh><boxGeometry args={[width, 0.72, 1.62]} /><meshStandardMaterial color="#e0ded2" roughness={0.56} metalness={0.16} /></mesh>
      <mesh position={[0, 0.34, 0]}><boxGeometry args={[width * 1.2, 0.09, 1.88]} /><meshStandardMaterial color="#16433d" metalness={0.55} roughness={0.24} /></mesh>
      <mesh position={[0, 0.57, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[roof, 0.38, 4]} /><meshStandardMaterial color="#16433d" metalness={0.55} roughness={0.24} emissive={accent} emissiveIntensity={0.08} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * width * 0.36, 0.13, 0.84]}><sphereGeometry args={[0.09, 12, 8]} /><meshBasicMaterial color="#d8af4e" /></mesh>)}
    </group>)}
    <mesh position={[0, 3.52, 0]}><coneGeometry args={[0.06, 0.9, 6]} /><meshBasicMaterial color="#d8af4e" /></mesh>
    <pointLight position={[0, 2.1, 2.4]} color={glow} intensity={3.1} distance={5} />
  </group>;
}

function NamsanTower({ accent, glow }: { accent: string; glow: string }) {
  return <group>
    <mesh position={[0, 0.4, 0]} scale={[3.2, 0.7, 1.8]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#0b201a" roughness={0.96} /></mesh>
    <mesh position={[0, 3.42, 0]}><cylinderGeometry args={[0.19, 0.38, 5.82, 20]} /><meshPhysicalMaterial color="#142b37" metalness={0.83} roughness={0.2} /></mesh>
    {[3.2, 4.55].map((y, index) => <group key={y} position={[0, y, 0]}><mesh><cylinderGeometry args={[index ? 0.72 : 0.57, index ? 0.72 : 0.57, index ? 0.46 : 0.3, 28]} /><meshStandardMaterial color="#1a3c47" emissive={accent} emissiveIntensity={0.54} metalness={0.8} roughness={0.18} /></mesh><mesh position={[0, 0.28, 0]}><torusGeometry args={[index ? 0.72 : 0.57, 0.025, 8, 28]} /><meshBasicMaterial color={glow} /></mesh></group>)}
    <mesh position={[0, 6.92, 0]}><coneGeometry args={[0.07, 2.36, 8]} /><meshBasicMaterial color={glow} /></mesh>
    <pointLight position={[0, 4.8, 1.2]} color={glow} intensity={3.2} distance={5} />
  </group>;
}

function GwanganBridge({ accent, glow }: { accent: string; glow: string }) {
  const cables = useMemo(() => [
    new THREE.CatmullRomCurve3([new THREE.Vector3(-5.2, 1.2, 0), new THREE.Vector3(-3.45, 3.58, 0), new THREE.Vector3(0, 1.58, 0)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.58, 0), new THREE.Vector3(3.45, 3.58, 0), new THREE.Vector3(5.2, 1.2, 0)]),
  ], []);
  return <group>
    <mesh position={[0, 0.68, 0]}><boxGeometry args={[10.9, 0.22, 0.72]} /><meshStandardMaterial color="#122c35" metalness={0.82} roughness={0.2} /></mesh>
    <mesh position={[0, 0.98, 0]}><boxGeometry args={[10.9, 0.16, 0.72]} /><meshStandardMaterial color="#173640" metalness={0.82} roughness={0.2} /></mesh>
    {[-3.45, 3.45].map((x) => <group key={x} position={[x, 2.35, 0]}><mesh><boxGeometry args={[0.34, 3.45, 0.48]} /><meshStandardMaterial color="#173944" metalness={0.88} roughness={0.18} /></mesh><mesh position={[0, 1.82, 0]}><boxGeometry args={[0.72, 0.12, 0.6]} /><meshBasicMaterial color={accent} /></mesh><pointLight position={[0, 0.5, 0.8]} color={glow} intensity={2.4} distance={4} /></group>)}
    {cables.map((curve, index) => <mesh key={index}><tubeGeometry args={[curve, 52, 0.048, 8, false]} /><meshBasicMaterial color={accent} /></mesh>)}
    {[-4.65, -2.32, 0, 2.32, 4.65].map((x) => <mesh key={x} position={[x, 1.15, 0.38]}><sphereGeometry args={[0.06, 12, 12]} /><meshBasicMaterial color={warmLight} /></mesh>)}
  </group>;
}

function CruiseLiner({ accent, glow }: { accent: string; glow: string }) {
  return <group rotation={[0, -0.14, 0]}>
    <RoundedBox args={[7.7, 1.15, 1.7]} radius={0.22} smoothness={5} position={[0, 0.8, 0]}><meshPhysicalMaterial color="#d4e7e4" metalness={0.24} roughness={0.24} clearcoat={0.78} /></RoundedBox>
    <mesh position={[0, 1.38, 0.88]}><boxGeometry args={[7.15, 0.055, 0.035]} /><meshBasicMaterial color={accent} /></mesh>
    <RoundedBox args={[4.95, 1.3, 1.2]} radius={0.15} smoothness={4} position={[-0.35, 1.82, 0]}><meshStandardMaterial color="#14313c" metalness={0.64} roughness={0.25} /></RoundedBox>
    {[-1.6, -0.62, 0.36, 1.34].map((x) => <mesh key={x} position={[x, 2.82, 0]}><boxGeometry args={[0.48, 0.62, 0.75]} /><meshStandardMaterial color="#183948" emissive={glow} emissiveIntensity={0.3} metalness={0.6} roughness={0.25} /></mesh>)}
    {Array.from({ length: 13 }, (_, index) => <mesh key={index} position={[-3.05 + index * 0.5, 0.9, 0.88]}><boxGeometry args={[0.18, 0.16, 0.035]} /><meshBasicMaterial color={warmLight} /></mesh>)}
    <pointLight position={[0, 2.2, 2.2]} color={glow} intensity={4.1} distance={8} />
  </group>;
}

function FacadeSurface({ width, height, depth, accent, glow, rows, columns }: { width: number; height: number; depth: number; accent: string; glow: string; rows: number; columns: number }) {
  const uniforms = useMemo(() => ({
    uAccent: { value: new THREE.Color(accent) },
    uGlow: { value: new THREE.Color(glow) },
    uRows: { value: rows },
    uColumns: { value: columns },
  }), [accent, glow, rows, columns]);
  return <mesh position={[0, 0, depth * 0.508]}>
    <planeGeometry args={[width * 0.8, height * 0.88]} />
    <shaderMaterial
      uniforms={uniforms}
      toneMapped={false}
      vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
      fragmentShader="uniform vec3 uAccent; uniform vec3 uGlow; uniform float uRows; uniform float uColumns; varying vec2 vUv; float h(vec2 p){return fract(sin(dot(p,vec2(31.17,113.51)))*43758.5453);} void main(){vec2 grid=vUv*vec2(uColumns,uRows);vec2 cell=fract(grid);float frame=1.-step(.035,cell.x)*step(.035,cell.y)*step(cell.x,.965)*step(cell.y,.965);float seed=h(floor(grid));float lit=step(.74,seed);vec3 glass=mix(vec3(.025,.1,.13),vec3(.09,.31,.34),vUv.y);vec3 interior=mix(uGlow,uAccent,step(.58,h(floor(grid)+13.)));vec3 color=mix(glass,interior,lit*.32);color+=vec3(.12,.22,.24)*pow(1.-vUv.y,2.)*.3;color=mix(color,vec3(.012,.023,.028),frame*.7);gl_FragColor=vec4(color,1.);}"
    />
  </mesh>;
}

function SkylineFacade({ width, height, depth, accent, glow, rows = 7 }: { width: number; height: number; depth: number; accent: string; glow: string; rows?: number }) {
  const columns = Math.max(6, Math.round(width * 7));
  return <>
    <FacadeSurface width={width} height={height} depth={depth} accent={accent} glow={glow} rows={rows * 2} columns={columns} />
    {[-0.25, 0, 0.25].map((ratio) => <mesh key={ratio} position={[ratio * width, 0, depth * 0.525]}><boxGeometry args={[0.013, height * 0.8, 0.01]} /><meshBasicMaterial color="#a8cecd" transparent opacity={0.13} /></mesh>)}
  </>;
}

function BankOfChinaTower({ accent, glow }: { accent: string; glow: string }) {
  const levels = [[1.44, 1.22, 1.92], [1.18, 1.0, 1.78], [0.92, 0.76, 1.65], [0.64, 0.5, 1.48]] as const;
  return <group position={[-1.35, 0, -1.12]}>
    {levels.map(([bottom, top, height], index) => {
      const previous = levels.slice(0, index).reduce((sum, [, , partHeight]) => sum + partHeight, 0);
      return <group key={height} position={[0, previous + height / 2, 0]}>
        <mesh rotation={[0, Math.PI / 4, 0]}><cylinderGeometry args={[top * 0.7, bottom * 0.7, height, 4]} /><meshPhysicalMaterial color="#1b5366" metalness={0.62} roughness={0.17} clearcoat={0.9} /></mesh>
        <mesh position={[0, 0, bottom * 0.5 + 0.02]}><planeGeometry args={[bottom * 0.93, height * 0.86]} /><meshPhysicalMaterial color="#3d8291" metalness={0.54} roughness={0.1} clearcoat={1} transparent opacity={0.7} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * bottom * 0.24, 0, bottom * 0.53]} rotation={[0, 0, side * -0.53]}><boxGeometry args={[0.026, height * 1.02, 0.018]} /><meshBasicMaterial color={index % 2 ? accent : glow} transparent opacity={0.55} /></mesh>)}
      </group>;
    })}
    <mesh position={[0, 7.38, 0]}><coneGeometry args={[0.11, 1.08, 4]} /><meshBasicMaterial color="#a9d2d0" /></mesh>
    <pointLight position={[0.08, 4.1, 1.3]} color={glow} intensity={2.2} distance={5.5} />
  </group>;
}

function TwoIFC({ glow }: { glow: string }) {
  return <group position={[2.42, 0, -0.62]}>
    <mesh position={[0, 3.45, 0]}><cylinderGeometry args={[0.34, 0.6, 6.9, 12]} /><meshPhysicalMaterial color="#245d70" metalness={0.58} roughness={0.14} clearcoat={0.96} /></mesh>
    <group position={[0, 3.44, 0]}><FacadeSurface width={0.7} height={6.38} depth={1.22} accent="#66aeb2" glow={glow} rows={26} columns={8} /></group>
    <mesh position={[0, 7.04, 0]}><coneGeometry args={[0.13, 0.32, 12]} /><meshPhysicalMaterial color="#bddedd" metalness={0.9} roughness={0.08} /></mesh>
    <mesh position={[0, 7.42, 0]}><cylinderGeometry args={[0.018, 0.024, 0.48, 6]} /><meshBasicMaterial color={glow} /></mesh>
  </group>;
}

function HsbcTower({ accent, glow }: { accent: string; glow: string }) {
  return <group position={[-3.65, 0, -0.18]}>
    <mesh position={[0, 3.02, 0]}><boxGeometry args={[1.16, 3.62, 0.82]} /><meshPhysicalMaterial color="#255e69" metalness={0.58} roughness={0.2} clearcoat={0.78} /></mesh>
    <group position={[0, 3.02, 0]}><SkylineFacade width={1.1} height={3.46} depth={0.84} accent={accent} glow={glow} rows={7} /></group>
    {[-1, 1].flatMap((side) => [-1, 1].map((depthSide) => <mesh key={`${side}-${depthSide}`} position={[side * 0.78, 2.48, depthSide * 0.53]}><cylinderGeometry args={[0.035, 0.05, 4.96, 8]} /><meshPhysicalMaterial color="#9db9b8" metalness={0.9} roughness={0.18} /></mesh>))}
    {[1.14, 2.03, 2.94, 3.84, 4.74].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[1.72, 0.09, 1.16]} /><meshPhysicalMaterial color="#789b9c" metalness={0.84} roughness={0.16} /></mesh>)}
    {[-1, 1].flatMap((side) => [1.56, 3.35].map((y) => <mesh key={`${side}-${y}`} position={[side * 0.53, y, 0.6]} rotation={[0, 0, side * -0.64]}><boxGeometry args={[0.034, 1.48, 0.024]} /><meshBasicMaterial color="#b6d2cc" transparent opacity={0.48} /></mesh>))}
    {[-0.34, 0.34].map((x) => <mesh key={x} position={[x, 2.86, 0.48]}><boxGeometry args={[0.018, 3.42, 0.018]} /><meshBasicMaterial color="#b6d2cc" transparent opacity={0.34} /></mesh>)}
    <mesh position={[0, 0.77, 0]}><boxGeometry args={[1.88, 0.1, 1.32]} /><meshPhysicalMaterial color="#24424a" metalness={0.68} roughness={0.3} /></mesh>
    <mesh position={[0, 4.92, 0]}><boxGeometry args={[1.76, 0.14, 1.2]} /><meshStandardMaterial color="#1b343c" metalness={0.76} roughness={0.24} /></mesh>
  </group>;
}

function StarFerry({ glow }: { glow: string }) {
  return <group position={[3.6, 0.2, 1.25]} rotation={[0, -0.08, 0]}>
    <RoundedBox args={[2.78, 0.3, 0.86]} radius={0.12} smoothness={4} position={[0, 0.24, 0]}><meshStandardMaterial color="#143b3c" metalness={0.38} roughness={0.34} /></RoundedBox>
    <mesh position={[1.42, 0.24, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.42, 0.48, 16]} /><meshStandardMaterial color="#143b3c" metalness={0.38} roughness={0.34} /></mesh>
    <RoundedBox args={[2.18, 0.38, 0.72]} radius={0.055} smoothness={3} position={[-0.08, 0.5, 0]}><meshStandardMaterial color="#e1e2d5" metalness={0.14} roughness={0.48} /></RoundedBox>
    <mesh position={[-0.08, 0.54, 0.375]}><boxGeometry args={[2.22, 0.09, 0.02]} /><meshBasicMaterial color="#1c775a" /></mesh>
    <RoundedBox args={[1.56, 0.42, 0.57]} radius={0.045} smoothness={3} position={[-0.12, 0.88, 0]}><meshStandardMaterial color="#ecece0" metalness={0.12} roughness={0.52} /></RoundedBox>
    {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => <mesh key={x} position={[x, 0.68, 0.375]}><boxGeometry args={[0.17, 0.14, 0.018]} /><meshBasicMaterial color={glow} transparent opacity={0.74} /></mesh>)}
    {[-0.46, -0.08, 0.3].map((x) => <mesh key={x} position={[x, 1.07, 0.298]}><boxGeometry args={[0.14, 0.12, 0.014]} /><meshBasicMaterial color="#24505a" /></mesh>)}
    <mesh position={[-0.12, 1.17, 0]}><boxGeometry args={[0.055, 0.28, 0.055]} /><meshStandardMaterial color="#e5e8da" /></mesh>
    <pointLight position={[0, 0.7, 0.62]} color={glow} intensity={1.2} distance={2.6} />
  </group>;
}

function HarbourSkyline({ accent, glow }: { accent: string; glow: string }) {
  const secondaryTowers = [[-5.5, 2.3, 0.95, 0.65], [-4.65, 3.18, 0.78, 0.6], [-2.45, 2.12, 0.82, 0.56], [-0.18, 2.72, 0.92, 0.66], [1.25, 3.68, 0.82, 0.62], [3.72, 2.42, 0.82, 0.6], [4.78, 3.16, 0.95, 0.7], [5.82, 2.04, 0.76, 0.55]] as const;
  return <group>
    {secondaryTowers.map(([x, height, width, depth], index) => <group key={x} position={[x, height / 2, -2.25 + (index % 5) * 0.52]}>
      <RoundedBox args={[width, height, depth]} radius={0.05} smoothness={3}><meshPhysicalMaterial color={index % 2 ? '#1a4a58' : '#245d69'} metalness={0.58} roughness={0.2} clearcoat={0.84} /></RoundedBox>
      <SkylineFacade width={width} height={height} depth={depth} accent={accent} glow={glow} rows={Math.max(4, Math.round(height * 1.7))} />
      {index % 3 === 0 ? <mesh position={[0, height * 0.66, 0]}><cylinderGeometry args={[0.022, 0.03, height * 0.32, 6]} /><meshBasicMaterial color={glow} transparent opacity={0.72} /></mesh> : null}
    </group>)}
    <HsbcTower accent={accent} glow={glow} />
    <BankOfChinaTower accent={accent} glow={glow} />
    <TwoIFC glow={glow} />
    <StarFerry glow={glow} />
    <pointLight position={[0.4, 4.5, 2]} color={glow} intensity={3.6} distance={10} />
  </group>;
}

function LandmarkModel({ kind, accent, glow }: { kind: LandmarkKind; accent: string; glow: string }) {
  if (kind === 'marina-bay') return <MarinaBay accent={accent} glow={glow} />;
  if (kind === 'opera-house') return <OperaHouse accent={accent} glow={glow} />;
  if (kind === 'melbourne-spire') return <MelbourneSpire accent={accent} glow={glow} />;
  if (kind === 'canton-tower') return <CantonTower accent={accent} glow={glow} />;
  if (kind === 'taipei-101') return <Taipei101 accent={accent} glow={glow} />;
  if (kind === 'skytree') return <Skytree accent={accent} glow={glow} />;
  if (kind === 'osaka-castle') return <OsakaCastle accent={accent} glow={glow} />;
  if (kind === 'namsan') return <NamsanTower accent={accent} glow={glow} />;
  if (kind === 'gwangan-bridge') return <GwanganBridge accent={accent} glow={glow} />;
  if (kind === 'cruise') return <CruiseLiner accent={accent} glow={glow} />;
  return <HarbourSkyline accent={accent} glow={glow} />;
}

function MistVeil({ position, width, height, drift, reduced }: { position: [number, number, number]; width: number; height: number; drift: number; reduced: boolean }) {
  const group = useRef<Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uTint: { value: new THREE.Color('#8dc3cf') } }), []);

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (!group.current || reduced) return;
    group.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.035 + drift) * 0.28;
  });

  return <group ref={group} position={position} renderOrder={1}>
    <mesh>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader="uniform float uTime; uniform vec3 uTint; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y); } float fb(vec2 p){ float v=0.; v+=n(p); p=p*2.03+4.2; v+=.5*n(p); p=p*2.07+2.8; v+=.25*n(p); return v/1.75; } void main(){ vec2 uv=vUv; float cloud=fb(vec2(uv.x*3.8+uTime*.018, uv.y*4.2)); float edge=smoothstep(0.,.18,uv.y)*smoothstep(0.,.22,1.-uv.y)*smoothstep(0.,.12,uv.x)*smoothstep(0.,.12,1.-uv.x); float alpha=smoothstep(.43,.72,cloud)*edge*.19; gl_FragColor=vec4(uTint,alpha); }"
      />
    </mesh>
  </group>;
}

function WaterSurface({ glow, reduced }: { glow: string; reduced: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uGlow: { value: new THREE.Color(glow) } }), [glow]);

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
  });

  return <mesh position={[0, -0.14, -1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[25, 18, 72, 48]} />
    <shaderMaterial
      ref={material}
      uniforms={uniforms}
      vertexShader="uniform float uTime; varying vec2 vUv; varying float vWave; void main(){ vUv=uv; vec3 p=position; float wave=sin(p.x*.78+uTime*.62)*.042+sin(p.y*1.28-uTime*.44)*.032+sin((p.x+p.y)*1.9+uTime*.3)*.018; p.z=wave; vWave=wave; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }"
      fragmentShader="uniform float uTime; uniform vec3 uGlow; varying vec2 vUv; varying float vWave; float h(vec2 p){return fract(sin(dot(p,vec2(23.13,91.7)))*43758.54);} void main(){ float bands=sin(vUv.y*210.+sin(vUv.x*14.+uTime*.38)*2.)*.5+.5; float glint=pow(bands,18.)*(.18+.82*smoothstep(.05,.9,vUv.y)); float ripple=sin((vUv.x*18.-uTime*.32)+(vUv.y*34.))*0.5+.5; vec2 grid=vec2(vUv.x*22.,vUv.y*5.); float reflection=step(.77,h(floor(grid.x)*vec2(1.,7.)))*pow(1.-vUv.y,.75)*(1.-smoothstep(.02,.22,abs(fract(grid.y)-.5))); vec3 base=mix(vec3(.009,.052,.075),vec3(.025,.14,.17),vUv.y); base+=uGlow*(glint*.18+ripple*.018+reflection*.26+vWave*.9); gl_FragColor=vec4(base,.94); }"
    />
  </mesh>;
}

type TerrainPoint = readonly [number, number];
type CityBuilding = readonly [number, number, number, number, number];

function TerrainRidge({ points, position, color, opacity, depth, side }: { points: readonly TerrainPoint[]; position: [number, number, number]; color: string; opacity: number; depth: number; side: THREE.Side }) {
  const shape = useMemo(() => {
    const ridge = new THREE.Shape();
    ridge.moveTo(points[0][0], -1.7);
    points.forEach(([x, y]) => ridge.lineTo(x, y));
    ridge.lineTo(points[points.length - 1][0], -1.7);
    ridge.closePath();
    return ridge;
  }, [points]);

  return <mesh position={position} castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.055, bevelThickness: 0.055 }]} />
    <meshPhysicalMaterial color={color} transparent opacity={opacity} roughness={0.88} metalness={0.04} clearcoat={0.08} side={side} flatShading />
  </mesh>;
}

function LayeredTerrain({ accent, terrain }: { accent: string; terrain: TerrainKind }) {
  const ridges = useMemo(() => {
    const basin = {
      far: [[-10, 1.2], [-8.2, 2.22], [-6.6, 1.84], [-4.45, 3.2], [-2.25, 1.66], [0.2, 2.57], [2.35, 1.58], [4.3, 3.42], [6.25, 1.92], [8.4, 2.75], [10, 1.68]] as const,
      middle: [[-10, 0.72], [-8.15, 1.46], [-6.3, 0.92], [-4.2, 2.12], [-2.02, 1.12], [0.1, 1.68], [2.45, 0.92], [4.42, 2.34], [6.55, 1.02], [8.25, 1.75], [10, 0.92]] as const,
      near: [[-10, 0.25], [-7.8, 0.84], [-5.86, 0.56], [-3.65, 1.33], [-1.26, 0.6], [1.1, 1.05], [3.28, 0.48], [5.38, 1.48], [7.45, 0.72], [10, 1.05]] as const,
    };
    const harbour = {
      far: [[-10, 0.9], [-7.9, 1.7], [-6.0, 1.16], [-3.82, 2.08], [-1.46, 1.22], [0.55, 2.25], [2.62, 1.16], [4.65, 1.94], [7.05, 1.1], [10, 1.62]] as const,
      middle: [[-10, 0.38], [-8.05, 1.08], [-6.02, 0.6], [-3.5, 1.43], [-0.85, 0.72], [1.8, 1.12], [4.35, 0.55], [6.58, 1.25], [10, 0.56]] as const,
      near: [[-10, 0.06], [-7.52, 0.63], [-5.2, 0.25], [-2.42, 0.92], [0.2, 0.36], [2.86, 0.86], [5.2, 0.3], [7.42, 0.83], [10, 0.28]] as const,
    };
    const lowland = {
      far: [[-10, 0.66], [-8, 1.13], [-5.7, 0.78], [-3.3, 1.36], [-0.75, 0.92], [2.04, 1.18], [4.5, 0.72], [6.65, 1.16], [10, 0.8]] as const,
      middle: [[-10, 0.24], [-7.4, 0.64], [-4.8, 0.32], [-2.18, 0.91], [0.38, 0.44], [3.22, 0.84], [5.5, 0.35], [7.55, 0.76], [10, 0.34]] as const,
      near: [[-10, -0.04], [-7.2, 0.32], [-4.28, 0.08], [-1.66, 0.56], [1.12, 0.12], [3.84, 0.48], [6.4, 0.1], [8.45, 0.41], [10, 0.05]] as const,
    };
    return terrain === 'mountain-basin' ? basin : terrain === 'harbour-ridge' ? harbour : lowland;
  }, [terrain]);

  return <group>
    <TerrainRidge points={ridges.far} position={[0, 1.02, -8.5]} color="#0a1c2a" opacity={0.87} depth={0.44} side={THREE.FrontSide} />
    <TerrainRidge points={ridges.middle} position={[0, 0.62, -6.55]} color="#123640" opacity={0.88} depth={0.54} side={THREE.FrontSide} />
    <TerrainRidge points={ridges.near} position={[0, 0.18, -4.72]} color={accent} opacity={0.28} depth={0.66} side={THREE.FrontSide} />
  </group>;
}

function CityTower({ building, accent, glow, index }: { building: CityBuilding; accent: string; glow: string; index: number }) {
  const [x, height, width, depth, z] = building;
  const rows = Math.min(7, Math.max(3, Math.round(height * 1.7)));
  const isTall = height > 2.5;
  return <group position={[x, height / 2, z]}>
    <RoundedBox args={[width, height, depth]} radius={0.045} smoothness={3}><meshPhysicalMaterial color={index % 2 ? '#102c37' : '#173b45'} metalness={0.72} roughness={0.24} clearcoat={0.62} /></RoundedBox>
    <mesh position={[0, 0.01, depth * 0.505]}><planeGeometry args={[width * 0.78, height * 0.84]} /><meshPhysicalMaterial color={index % 3 ? '#2a5b61' : '#507f79'} metalness={0.54} roughness={0.12} transparent opacity={0.42} /></mesh>
    {Array.from({ length: rows }, (_, row) => <mesh key={row} position={[0, -height * 0.34 + row * (height * 0.68 / Math.max(rows - 1, 1)), depth * 0.518]}><boxGeometry args={[width * 0.7, 0.026, 0.012]} /><meshBasicMaterial color={row % 3 === 0 ? glow : accent} transparent opacity={row % 3 === 0 ? 0.54 : 0.24} /></mesh>)}
    <mesh position={[0, height * 0.52, 0]}><boxGeometry args={[width * 0.5, 0.11, depth * 0.62]} /><meshStandardMaterial color="#132a34" metalness={0.68} roughness={0.3} /></mesh>
    {isTall ? <mesh position={[0, height * 0.68, 0]}><cylinderGeometry args={[0.016, 0.022, height * 0.34, 6]} /><meshBasicMaterial color={glow} transparent opacity={0.7} /></mesh> : null}
  </group>;
}

function BackdropCity({ accent, glow, kind }: { accent: string; glow: string; kind: LandmarkKind }) {
  const buildings = useMemo(() => {
    const standard: CityBuilding[] = [
      [-7.1, 1.15, 0.74, 0.44, -5.8], [-6.1, 1.72, 0.86, 0.56, -5.35], [-5.1, 1.32, 0.7, 0.45, -5.7], [-4.0, 2.05, 0.84, 0.58, -4.7], [-2.95, 1.56, 0.72, 0.5, -4.86],
      [2.95, 1.48, 0.74, 0.48, -4.86], [4.02, 2.22, 0.88, 0.62, -4.7], [5.13, 1.38, 0.7, 0.48, -5.6], [6.14, 1.82, 0.83, 0.53, -5.32], [7.08, 1.12, 0.72, 0.45, -5.8],
      [-5.7, 2.45, 0.9, 0.72, -3.45], [-4.5, 2.02, 0.78, 0.62, -3.65], [-3.38, 2.86, 0.92, 0.78, -3.3], [-2.15, 1.9, 0.8, 0.65, -3.52],
      [2.18, 2.12, 0.84, 0.66, -3.52], [3.36, 2.92, 0.98, 0.8, -3.3], [4.67, 1.96, 0.8, 0.62, -3.62], [5.8, 2.28, 0.88, 0.7, -3.45],
    ];
    if (kind !== 'taipei-101') return standard;
    const taipei: CityBuilding[] = [
      [-7.72, 0.92, 0.72, 0.42, -3.9], [-6.72, 2.78, 0.96, 0.72, -3.06], [-1.52, 2.25, 0.8, 0.68, -3.16], [1.48, 2.5, 0.9, 0.72, -3.08], [6.82, 2.6, 0.92, 0.7, -3.12], [7.74, 1.05, 0.68, 0.45, -3.75],
      [-4.9, 1.16, 0.74, 0.65, -2.15], [-3.9, 1.4, 0.82, 0.67, -2.26], [-2.82, 1.05, 0.68, 0.58, -2.15], [2.72, 1.08, 0.7, 0.6, -2.15], [3.72, 1.42, 0.84, 0.7, -2.26], [4.86, 1.12, 0.72, 0.62, -2.15],
    ];
    return [...standard, ...taipei];
  }, [kind]);
  return <group>{buildings.map((building, index) => <CityTower key={`${building[0]}-${building[4]}`} building={building} accent={accent} glow={glow} index={index} />)}</group>;
}

function CelestialCycle({ destination, observedDaytime, reduced }: { destination: Destination; observedDaytime?: boolean; reduced: boolean }) {
  const sky = useRef<THREE.ShaderMaterial>(null);
  const sunGroup = useRef<Group>(null);
  const moonGroup = useRef<Group>(null);
  const sunlight = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const landmarkRim = useRef<THREE.PointLight>(null);
  const sunMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const moonGlowMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const moonMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const uniforms = useMemo(() => ({ uDay: { value: 0 }, uTwilight: { value: 0 }, uTime: { value: 0 }, uSun: { value: new THREE.Vector2(0.5, 0.6) } }), []);
  const fogColors = useMemo(() => ({ night: new THREE.Color('#081119'), day: new THREE.Color('#7ba6b1') }), []);

  useFrame(({ scene, clock }) => {
    const solar = solarState(localSolarHour(destination.longitude, clock.elapsedTime, reduced));
    const observationBias = observedDaytime === undefined ? 0 : observedDaytime ? 0.1 : -0.1;
    const daylight = THREE.MathUtils.clamp(solar.daylight + observationBias, 0, 1);
    const sunX = solar.x * 4.85;
    const sunY = 3.1 + solar.elevation * 4.0;
    const moonX = -solar.x * 4.45;
    const moonY = 3.25 - solar.elevation * 3.7;
    const night = 1 - daylight;

    if (sky.current) {
      sky.current.uniforms.uDay.value = daylight;
      sky.current.uniforms.uTwilight.value = solar.twilight;
      sky.current.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime;
      sky.current.uniforms.uSun.value.set(0.5 + sunX / 20, 0.48 + sunY / 19);
    }
    if (sunGroup.current) sunGroup.current.position.set(sunX, sunY, -8.8);
    if (moonGroup.current) moonGroup.current.position.set(moonX, moonY, -8.75);
    if (sunlight.current) {
      sunlight.current.position.set(sunX, Math.max(0.5, sunY), 5.6);
      sunlight.current.intensity = 0.08 + daylight * 2.15;
      sunlight.current.color.set(daylight > 0.55 ? '#fff0cf' : '#f1b07b');
    }
    if (ambient.current) ambient.current.intensity = 0.11 + daylight * 0.32;
    if (hemisphere.current) hemisphere.current.intensity = 0.24 + daylight * 0.67;
    if (landmarkRim.current) landmarkRim.current.intensity = 0.55 + night * 5.8;
    if (sunMaterial.current) sunMaterial.current.opacity = daylight * daylight * 0.94;
    if (moonGlowMaterial.current) moonGlowMaterial.current.opacity = night * 0.25;
    if (moonMaterial.current) moonMaterial.current.opacity = night * 0.98;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.lerpColors(fogColors.night, fogColors.day, daylight);
  });

  return <>
    <mesh position={[0, 4.5, 0]} renderOrder={-10}>
      <sphereGeometry args={[32, 64, 32]} />
      <shaderMaterial
        ref={sky}
        uniforms={uniforms}
        depthWrite={false}
        depthTest
        side={THREE.BackSide}
        vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }"
        fragmentShader="uniform float uDay; uniform float uTwilight; uniform float uTime; uniform vec2 uSun; varying vec2 vUv; float h(vec2 p){return fract(sin(dot(p,vec2(41.23,289.91)))*43758.54);} float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);} float fb(vec2 p){float v=n(p);p=p*2.02+3.7;v+=.5*n(p);p=p*2.07+5.1;v+=.25*n(p);return v/1.75;} void main(){ vec3 night=mix(vec3(.006,.012,.03),vec3(.028,.065,.11),smoothstep(0.,.76,vUv.y)); vec3 day=mix(vec3(.91,.63,.39),vec3(.19,.49,.72),smoothstep(.04,.9,vUv.y)); vec3 dusk=mix(vec3(.17,.035,.08),vec3(.66,.17,.18),smoothstep(.04,.78,vUv.y)); vec3 color=mix(night,day,uDay); color=mix(color,dusk,uTwilight*(1.-uDay*.38)); float sun=exp(-38.*dot(vUv-uSun,vUv-uSun)); color+=mix(vec3(.95,.22,.12),vec3(1.,.78,.42),uDay)*sun*(.42+.58*uDay); float cloud=fb(vec2(vUv.x*3.1-uTime*.012,vUv.y*5.4)); float cloudBand=smoothstep(.48,.76,cloud)*smoothstep(.06,.3,vUv.y)*smoothstep(.12,.96,1.-vUv.y); vec3 cloudTone=mix(vec3(.014,.03,.055),vec3(.74,.79,.78),uDay); color=mix(color,cloudTone,cloudBand*(.13+.24*uDay+.1*uTwilight)); vec2 grid=vUv*vec2(180.,96.); vec2 cell=fract(grid)-.5; float stars=step(.992,h(floor(grid)))*(1.-smoothstep(.025,.095,length(cell)))*(1.-uDay); color+=vec3(stars*.68); gl_FragColor=vec4(color,1.); }"
      />
    </mesh>
    <ambientLight ref={ambient} intensity={0.22} color="#7595ac" />
    <hemisphereLight ref={hemisphere} intensity={0.5} color="#d4e7ec" groundColor="#0c211d" />
    <directionalLight ref={sunlight} position={[4, 7, 5.6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight ref={landmarkRim} position={[0, 5.65, 3.7]} color={destination.glow} intensity={5.2} distance={15} decay={2} />
    <group ref={sunGroup}>
      <mesh><circleGeometry args={[0.74, 48]} /><meshBasicMaterial ref={sunMaterial} color="#fff2c4" transparent toneMapped={false} /></mesh>
    </group>
    <group ref={moonGroup}>
      <mesh><circleGeometry args={[1.72, 48]} /><meshBasicMaterial ref={moonGlowMaterial} color={destination.glow} transparent toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.02]}><circleGeometry args={[1.18, 48]} /><meshBasicMaterial ref={moonMaterial} color="#f2a487" transparent toneMapped={false} /></mesh>
      {[[0.34, 0.32, 0.2], [-0.3, 0.06, 0.13], [0.11, -0.37, 0.16], [-0.38, -0.35, 0.1]].map(([x, y, scale], index) => <mesh key={index} position={[x, y, 0.04]}><circleGeometry args={[scale, 24]} /><meshBasicMaterial color="#7e3540" transparent opacity={0.2} toneMapped={false} /></mesh>)}
    </group>
  </>;
}

function Promenade({ accent, glow, water }: { accent: string; glow: string; water: boolean }) {
  const slabs = Array.from({ length: water ? 6 : 16 }, (_, index) => index);
  const lampStops = water ? [3.05, 4.25] : [-2.4, -0.45, 1.35, 3.25];
  return <group>
    <mesh position={[0, -0.03, water ? 4.42 : 0.95]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[water ? 17.6 : 6.8, water ? 2.85 : 12.6]} /><meshStandardMaterial color={water ? '#09181b' : '#0a1716'} roughness={0.88} metalness={water ? 0.42 : 0.12} /></mesh>
    {slabs.map((index) => {
      const z = water ? 4.76 - index * 0.42 : 4.4 - index * 0.62;
      const width = water ? 16.2 : 5.9 - index * 0.17;
      return <mesh key={index} position={[0, 0.018, z]}><boxGeometry args={[width, 0.035, 0.06]} /><meshBasicMaterial color={index % 3 ? '#142b31' : accent} transparent opacity={index % 3 ? 0.58 : 0.42} /></mesh>;
    })}
    {[-1, 1].map((side) => lampStops.map((z, index) => <group key={`${side}-${z}`} position={[side * (water ? 7.3 : 2.8 + Math.max(z, 0) * 0.19), 0.3, z]}>
      <mesh position={[0, water ? 0.28 : 0.38, 0]}><cylinderGeometry args={[water ? 0.022 : 0.035, water ? 0.045 : 0.07, water ? 0.56 : 0.76, 8]} /><meshStandardMaterial color="#101b1d" metalness={0.5} roughness={0.6} /></mesh>
      <mesh position={[0, water ? 0.61 : 0.83, 0]}><boxGeometry args={water ? [0.13, 0.13, 0.13] : [0.24, 0.23, 0.24]} /><meshBasicMaterial color={glow} /></mesh>
      <pointLight position={[0, water ? 0.62 : 0.84, 0.12]} color={glow} intensity={index === 0 ? 1.2 : 0.75} distance={water ? 1.25 : 2.1} />
    </group>))}
  </group>;
}

function HarbourForeground({ glow }: { glow: string }) {
  return <group position={[0, 0, 2.95]}>
    <mesh position={[0, 0.55, 0]}><boxGeometry args={[17.8, 0.045, 0.05]} /><meshStandardMaterial color="#0a181c" metalness={0.76} roughness={0.3} /></mesh>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[17.8, 0.035, 0.04]} /><meshStandardMaterial color="#0a181c" metalness={0.72} roughness={0.34} /></mesh>
    {Array.from({ length: 12 }, (_, index) => <group key={index} position={[-8.1 + index * 1.46, 0.28, 0]}>
      <mesh><cylinderGeometry args={[0.034, 0.052, 0.72, 8]} /><meshStandardMaterial color="#10262c" metalness={0.72} roughness={0.32} /></mesh>
      {index % 3 === 0 ? <pointLight position={[0, 0.28, 0.08]} color={glow} intensity={0.34} distance={1.4} /> : null}
    </group>)}
  </group>;
}

function ForegroundFoliage({ accent, glow }: { accent: string; glow: string }) {
  const clusters = useMemo(() => [
    [-5.2, 0.38, 2.15, 1.25], [-4.05, 0.26, 3.25, 0.78], [-3.3, 0.25, 0.28, 0.66],
    [5.25, 0.38, 2.15, 1.25], [4.02, 0.26, 3.25, 0.78], [3.25, 0.25, 0.28, 0.66],
  ] as const, []);
  return <group>{clusters.map(([x, y, z, scale], index) => <group key={x} position={[x, y, z]} scale={scale}>
    <mesh position={[0, 0.55, 0.02]} rotation={[0.02, 0, index % 2 ? -0.12 : 0.12]}><cylinderGeometry args={[0.055, 0.13, 1.16, 7]} /><meshStandardMaterial color="#263027" roughness={0.94} /></mesh>
    {Array.from({ length: 9 }, (_, leaf) => {
      const angle = leaf * 1.94 + index * 0.44;
      const radius = 0.26 + (leaf % 3) * 0.17;
      return <mesh key={leaf} position={[Math.cos(angle) * radius, 0.5 + (leaf % 4) * 0.19, Math.sin(angle) * radius * 0.55]} rotation={[0.24, -angle, Math.sin(angle) * 0.78]} scale={[0.56, 1 + (leaf % 3) * 0.16, 0.5]}><coneGeometry args={[0.17, 0.8, 5]} /><meshStandardMaterial color={leaf % 3 ? '#174038' : accent} transparent opacity={leaf % 3 ? 0.92 : 0.58} roughness={0.86} /></mesh>;
    })}
    {index % 2 === 0 ? <pointLight position={[0.2, 0.5, 0.62]} color={glow} intensity={0.42} distance={1.8} /> : null}
  </group>)}</group>;
}

function Rain({ reduced }: { reduced: boolean }) {
  const count = reduced ? 110 : 320;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 6);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 6;
      const x = ((index * 1.71) % 12) - 6;
      const y = ((index * 0.93) % 8) - 0.5;
      const z = ((index * 2.39) % 7) - 2.5;
      values[offset] = x;
      values[offset + 1] = y;
      values[offset + 2] = z;
      values[offset + 3] = x - 0.04;
      values[offset + 4] = y - 0.34;
      values[offset + 5] = z;
    }
    return values;
  }, [count]);
  const attribute = useRef<BufferAttribute>(null);

  useFrame((_, delta) => {
    if (reduced || !attribute.current) return;
    const values = attribute.current.array as Float32Array;
    for (let index = 0; index < values.length; index += 6) {
      const fall = delta * (4.2 + ((index / 6) % 5) * 0.22);
      values[index + 1] -= fall;
      values[index + 4] -= fall;
      values[index] -= delta * 0.34;
      values[index + 3] -= delta * 0.34;
      if (values[index + 1] < -1.3) {
        values[index + 1] = 7.8;
        values[index + 4] = 7.46;
      }
      if (values[index] < -6.3) {
        values[index] = 6.1;
        values[index + 3] = 6.06;
      }
    }
    attribute.current.needsUpdate = true;
  });

  return <lineSegments renderOrder={4}><bufferGeometry><bufferAttribute ref={attribute} attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#c6e7ff" transparent opacity={0.5} depthWrite={false} /></lineSegments>;
}

function DriftingMotes({ color, reduced }: { color: string; reduced: boolean }) {
  const count = reduced ? 20 : 52;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 6);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 6;
      const x = ((index * 1.87) % 13) - 6.5;
      const y = ((index * 0.71) % 7.2) - 0.3;
      const z = -2.8 + (index % 7) * 0.72;
      values[offset] = x;
      values[offset + 1] = y;
      values[offset + 2] = z;
      values[offset + 3] = x + 0.075 + (index % 3) * 0.025;
      values[offset + 4] = y + 0.12;
      values[offset + 5] = z;
    }
    return values;
  }, [count]);
  const attribute = useRef<BufferAttribute>(null);

  useFrame((state, delta) => {
    if (reduced || !attribute.current) return;
    const values = attribute.current.array as Float32Array;
    for (let index = 0; index < values.length; index += 6) {
      const flutter = Math.sin(state.clock.elapsedTime * 1.45 + index * 0.17) * delta * 0.58;
      values[index] += flutter - delta * 0.09;
      values[index + 3] += flutter - delta * 0.09;
      values[index + 1] -= delta * (0.3 + (index % 5) * 0.042);
      values[index + 4] -= delta * (0.3 + (index % 5) * 0.042);
      if (values[index + 1] < -1.2) {
        const x = ((index * 2.31 + state.clock.elapsedTime * 0.41) % 13) - 6.5;
        values[index] = x;
        values[index + 3] = x + 0.1;
        values[index + 1] = 7.4;
        values[index + 4] = 7.52;
      }
    }
    attribute.current.needsUpdate = true;
  });

  return <lineSegments renderOrder={5}><bufferGeometry><bufferAttribute ref={attribute} attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color={color} transparent opacity={0.56} depthWrite={false} /></lineSegments>;
}

function CinematicGrain({ reduced }: { reduced: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
  });

  return <mesh position={[0, 3.6, 7.2]} renderOrder={10}>
    <planeGeometry args={[26, 18]} />
    <shaderMaterial
      ref={material}
      uniforms={uniforms}
      transparent
      depthTest={false}
      depthWrite={false}
      vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
      fragmentShader="uniform float uTime; varying vec2 vUv; float h(vec2 p){return fract(sin(dot(p,vec2(17.41,91.73)))*43758.5453);} void main(){float grain=h(floor(vUv*vec2(760.,420.))+floor(uTime*18.));float lines=.5+.5*sin(vUv.y*1200.);float edge=pow(length(vUv-.5)*1.42,2.1);float alpha=.018+grain*.035+lines*.018+edge*.17;gl_FragColor=vec4(vec3(.004,.008,.012),clamp(alpha,0.,.25));}"
    />
  </mesh>;
}

function World({ destination, profile, pointer, active, reduced, observedDaytime, atmosphere }: { destination: Destination; profile: SceneProfile; pointer: React.MutableRefObject<THREE.Vector2>; active: boolean; reduced: boolean; observedDaytime?: boolean; atmosphere?: WeatherAtmosphere }) {
  const terrainLayer = useRef<Group>(null);
  const cityLayer = useRef<Group>(null);
  const landmarkLayer = useRef<Group>(null);
  const foregroundLayer = useRef<Group>(null);
  const targetCamera = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, delta) => {
    const focus = active ? 1 : 0;
    targetCamera.set(pointer.current.x * 0.24, 3.42 + pointer.current.y * 0.11 + focus * 0.04, 14.2 - focus * 0.18);
    camera.position.lerp(targetCamera, 1 - Math.exp(-delta * 2.1));
    camera.lookAt(pointer.current.x * 0.06, 2.85 + pointer.current.y * 0.035, -0.65);
    const shiftLayer = (layer: Group | null, depth: number, y: number) => {
      if (!layer) return;
      layer.position.x = THREE.MathUtils.damp(layer.position.x, -pointer.current.x * depth, 2.5, delta);
      layer.position.y = THREE.MathUtils.damp(layer.position.y, y - pointer.current.y * depth * 0.18, 2.5, delta);
    };
    shiftLayer(terrainLayer.current, 0.1, 0);
    shiftLayer(cityLayer.current, 0.24, 0);
    shiftLayer(landmarkLayer.current, 0.44, 0.18);
    shiftLayer(foregroundLayer.current, 0.74, 0);
  });

  return <>
    <color attach="background" args={['#020610']} />
    <fog attach="fog" args={['#081119', 11, 29]} />
    <CelestialCycle destination={destination} observedDaytime={observedDaytime} reduced={reduced} />
    <group ref={terrainLayer}>
      <LayeredTerrain accent={destination.accent} terrain={profile.terrain} />
      <MistVeil position={[-1.6, 4.35, -5.2]} width={13} height={3.8} drift={0} reduced={reduced} />
      <MistVeil position={[2.9, 2.55, -3.8]} width={11} height={2.4} drift={2.9} reduced={reduced} />
    </group>
    <group ref={cityLayer}>
      <BackdropCity accent={destination.accent} glow={destination.glow} kind={profile.kind} />
      {profile.water ? <WaterSurface glow={destination.glow} reduced={reduced} /> : null}
    </group>
    <group ref={landmarkLayer} position={[0, 0.18, -0.42]}>
      <LandmarkModel kind={profile.kind} accent={destination.accent} glow={destination.glow} />
    </group>
    <group ref={foregroundLayer}>
      <Promenade accent={destination.accent} glow={destination.glow} water={profile.water} />
      {profile.kind === 'harbour-skyline' ? <HarbourForeground glow={destination.glow} /> : <ForegroundFoliage accent={destination.accent} glow={destination.glow} />}
      <ContactShadows position={[0, -0.02, 0]} opacity={0.34} scale={16} blur={2.8} far={9} resolution={512} color="#00050a" frames={reduced ? 1 : 2} />
    </group>
    <DriftingMotes color={destination.glow} reduced={reduced} />
    {atmosphere === 'rain' || atmosphere === 'storm' || (!atmosphere && profile.rain) ? <Rain reduced={reduced} /> : null}
    <CinematicGrain reduced={reduced} />
  </>;
}

export function CinematicCityScene({ destination, isDaytime, atmosphere }: { destination: Destination; isDaytime?: boolean; atmosphere?: WeatherAtmosphere }) {
  const profile = profiles[destination.illustrationKey ?? destination.key] ?? fallbackProfile;
  const pointer = useRef(new THREE.Vector2());
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();
  const dpr = typeof window === 'undefined' ? 1 : Math.min(1.5, window.devicePixelRatio || 1);

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height * 2 - 1));
  };

  const resetPointer = () => pointer.current.set(0, 0);
  const active = pinned || focused;
  const caption = pinned ? 'Layered view held · click to release' : 'Move your pointer to shift the illustration layers';

  return <div className={`cinematic-city${active ? ' cinematic-city--active' : ''}`}>
    <Canvas className="cinematic-city__canvas" dpr={[1, dpr]} shadows gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} camera={{ position: [0, 3.42, 14.2], fov: 41 }} frameloop={reduced ? 'demand' : 'always'}>
      <World destination={destination} profile={profile} pointer={pointer} active={active} reduced={reduced} observedDaytime={isDaytime} atmosphere={atmosphere} />
    </Canvas>
    <button className="cinematic-city__hit-area" type="button" aria-label={`Explore the animated ${profile.label} illustration`} aria-pressed={pinned} onClick={() => setPinned((value) => !value)} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); resetPointer(); }} onPointerEnter={() => setFocused(true)} onPointerMove={handlePointerMove} onPointerLeave={() => { setFocused(false); resetPointer(); }} />
    <div className="cinematic-city__caption" aria-live="polite"><strong>{profile.label}</strong><span>{caption}</span></div>
  </div>;
}
