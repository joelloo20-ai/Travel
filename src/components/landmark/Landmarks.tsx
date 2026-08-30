import { useMemo, type ComponentType } from 'react';
import * as THREE from 'three';
import type { LandmarkKind } from '../../data/destinations';
import {
  BridgeSpan,
  LatticeTower,
  PagodaTower,
  ShellSail,
  ShipHull,
  SkyscraperCluster,
  TexturedBox,
  type BuildingSpec,
} from './primitives';

export interface LandmarkProps {
  accent: string;
  deep: string;
  glow: string;
  nightLights: number;
  /** The shared diorama provides the city context; suppress local clutter in the hero. */
  showContext?: boolean;
}

function ringOfBuildings(count: number, radius: number, minH: number, maxH: number, minW: number, maxW: number, color: string): BuildingSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 1.5 + Math.PI * 0.1;
    const r = radius + Math.random() * radius * 0.9;
    return {
      x: Math.cos(angle) * r,
      z: -Math.abs(Math.sin(angle) * r) - radius * 0.4,
      width: minW + Math.random() * (maxW - minW),
      depth: minW + Math.random() * (maxW - minW),
      height: minH + Math.random() * (maxH - minH),
      color,
    };
  });
}

/** Plinth every landmark sits on, so the hero form always reads clearly against the ground. */
function Plinth({ radius = 1.1, height = 0.22, color = '#2b2b2b' }: { radius?: number; height?: number; color?: string }) {
  return (
    <mesh position={[0, height / 2, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[radius, radius * 1.08, height, 32]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.08} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Singapore — the Merlion, with Marina Bay Sands behind it
// ---------------------------------------------------------------------------
function Merlion({ accent, glow, nightLights, showContext = true }: LandmarkProps) {
  const jetCurve = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.55, 0.35),
      new THREE.Vector3(0.35, 1.9, 1.1),
      new THREE.Vector3(0.55, 1.4, 1.9),
      new THREE.Vector3(0.6, 0.05, 2.35),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.05, 8, false);
  }, []);

  const buildings = useMemo(
    () => [
      { x: -2.4, z: -3.4, width: 0.45, depth: 0.45, height: 2.6, color: '#3a4550' },
      { x: -1.6, z: -3.7, width: 0.45, depth: 0.45, height: 2.9, color: '#3f4c58' },
      { x: -0.8, z: -3.4, width: 0.45, depth: 0.45, height: 2.6, color: '#3a4550' },
    ],
    [],
  );

  return (
    <group position={[0, 0, 0]}>
      <Plinth radius={0.9} color="#4a4d47" />
      <group position={[0, 0.22, 0]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.62, 24, 24]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.55} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.48, 0.28]} castShadow>
          <boxGeometry args={[0.42, 0.32, 0.55]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.55} metalness={0.05} />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 1.85, 0.32]} rotation={[0, 0, x > 0 ? -0.3 : 0.3]} castShadow>
            <coneGeometry args={[0.11, 0.32, 12]} />
            <meshStandardMaterial color="#f2f0ea" roughness={0.55} metalness={0.05} />
          </mesh>
        ))}
        <mesh position={[0, 1.5, 0.58]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.18]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.5} />
        </mesh>
        <group position={[0, 0.35, 1.1]} rotation={[0.55, 0, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.55, 2.1, 5, 1, true]} />
            <meshStandardMaterial color="#eae7df" roughness={0.5} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh geometry={jetCurve}>
          <meshStandardMaterial color="#dff1f5" emissive="#dff1f5" emissiveIntensity={0.3} roughness={0.2} transparent opacity={0.85} />
        </mesh>
        <mesh position={[1.55, 1.55, 0]}>
          <boxGeometry args={[1.6, 0.28, 0.42]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.4} />
        </mesh>
        {[0.9, 1.55, 2.2].map((x, i) => (
          <TexturedBox
            key={i}
            width={0.32}
            depth={0.32}
            height={1.55 + i * 0.12}
            position={[x, 0.78, 0]}
            seed={i * 1.7 + 3}
            nightLights={nightLights}
            facadeMetalness={0.5}
          />
        ))}
        <mesh position={[0.9, 1.55, 0]}>
          <boxGeometry args={[0.34, 0.02, 0.34]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.4 + nightLights * 2} toneMapped={false} />
        </mesh>
      </group>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sydney — Opera House shells + Harbour Bridge
// ---------------------------------------------------------------------------
function OperaHouse({ glow, nightLights }: LandmarkProps) {
  return (
    <group>
      <Plinth radius={1.6} height={0.14} color="#e8e4da" />
      <ShellSail position={[-0.65, 0.14, 0.1]} rotationY={0.35} scale={1.15} color="#f4f1e8" />
      <ShellSail position={[-0.1, 0.14, -0.15]} rotationY={0.1} scale={1.35} color="#f7f4ec" />
      <ShellSail position={[0.45, 0.14, -0.05]} rotationY={-0.2} scale={1.05} color="#eeeade" />
      <ShellSail position={[0.85, 0.14, 0.3]} rotationY={-0.45} scale={0.85} color="#f2efe4" />
      <group position={[0, 0, -6.5]}>
        <BridgeSpan length={9} deckWidth={0.5} towerHeight={2.1} style="arch" color="#4a5560" glowColor={glow} nightLights={nightLights} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Melbourne — Eureka Tower with its gold crown, above a river-city cluster
// ---------------------------------------------------------------------------
function EurekaTower({ accent, glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(16, 2.6, 1.2, 2.4, 0.35, 0.6, '#33414d'), []);
  return (
    <group>
      <Plinth radius={0.5} />
      {/* The slender blue shaft, uneven shoulders, gold crown and red blade are the
          structural cues that distinguish Eureka from a generic city tower. */}
      <TexturedBox width={0.72} depth={0.62} height={3.98} position={[0, 2.1, 0]} seed={11.3} nightLights={nightLights} facadeMetalness={0.58} />
      <TexturedBox width={0.42} depth={0.52} height={2.08} position={[-0.58, 1.14, -0.06]} seed={11.7} nightLights={nightLights * 0.42} facadeMetalness={0.38} />
      <TexturedBox width={0.36} depth={0.48} height={1.42} position={[0.52, 0.81, 0.02]} seed={12.1} nightLights={nightLights * 0.36} facadeMetalness={0.38} />
      <mesh position={[0, 4.34, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.68]} />
        <meshStandardMaterial color="#c78f42" roughness={0.27} metalness={0.78} emissive={accent} emissiveIntensity={0.06 + nightLights * 0.18} toneMapped={false} />
      </mesh>
      <mesh position={[0.16, 4.14, 0.326]}>
        <boxGeometry args={[0.082, 1.05, 0.014]} />
        <meshStandardMaterial color="#bd3e35" roughness={0.34} metalness={0.42} emissive="#8e2924" emissiveIntensity={0.08 + nightLights * 0.48} />
      </mesh>
      <mesh position={[0, 4.68, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.18]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.16 + nightLights * 0.62} toneMapped={false} />
      </mesh>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Guangzhou — Canton Tower's hourglass "supermodel waist"
// ---------------------------------------------------------------------------
function CantonTower({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(13, 3.2, 1, 2.2, 0.4, 0.65, '#4a2733'), []);
  return (
    <group>
      <Plinth radius={0.55} />
      <LatticeTower
        height={4.6}
        baseRadius={0.55}
        waistRadius={0.22}
        waistHeight={2.7}
        topRadius={0.35}
        color="#8a97a0"
        glowColor={glow}
        nightLights={nightLights}
        podRadius={0.4}
        podHeight={3.4}
      />
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Hong Kong — dense Victoria Harbour skyline with two signature towers
// ---------------------------------------------------------------------------
function HkSkyline({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(19, 2.2, 1.4, 3.1, 0.4, 0.7, '#242c3a'), []);
  return (
    <group>
      <Plinth radius={0.4} height={0.16} />
      <TexturedBox width={0.55} depth={0.55} height={4} position={[-0.4, 2.1, 0]} seed={7.2} nightLights={nightLights} facadeMetalness={0.55} />
      <mesh position={[0.55, 1.7, -0.3]} castShadow>
        <coneGeometry args={[0.35, 3.2, 4]} />
        <meshStandardMaterial color="#38465a" roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[-0.4, 4.15, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.5 + nightLights * 2.4} toneMapped={false} />
      </mesh>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Taipei — Taipei 101's tiered, flaring pagoda-tech stack
// ---------------------------------------------------------------------------
function Taipei101({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(14, 2.8, 0.9, 1.8, 0.35, 0.55, '#213326'), []);
  const tiers = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        width: 0.62 - i * 0.008,
        depth: 0.62 - i * 0.008,
        height: 0.42,
        roofOverhang: 0.14,
      })),
    [],
  );
  return (
    <group>
      <Plinth radius={0.55} />
      <group position={[0, 0.22, 0]}>
        <PagodaTower tiers={tiers} color="#5c6b60" roofColor="#3e4a42" glowColor={glow} nightLights={nightLights} windowed />
        <mesh position={[0, tiers.length * 0.42 + 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.06, 1.2, 8]} />
          <meshStandardMaterial color="#9aa79e" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Tokyo — Tokyo Tower's red-and-white lattice
// ---------------------------------------------------------------------------
function TokyoTower({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(16, 2.6, 1, 2.1, 0.35, 0.6, '#3a2126'), []);
  return (
    <group>
      <Plinth radius={0.6} />
      <LatticeTower
        height={4.4}
        baseRadius={0.6}
        waistRadius={0.16}
        waistHeight={2.4}
        topRadius={0.05}
        color="#c94b3f"
        glowColor={glow}
        nightLights={nightLights}
      />
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Osaka — Osaka Castle's green-tiled tenshu on a stone base
// ---------------------------------------------------------------------------
function OsakaCastle({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(14, 3, 0.9, 1.7, 0.35, 0.55, '#432a2f'), []);
  const tiers = useMemo(
    () => [
      { width: 1.1, depth: 1.1, height: 0.55, roofOverhang: 0.28 },
      { width: 0.85, depth: 0.85, height: 0.4, roofOverhang: 0.22 },
      { width: 0.62, depth: 0.62, height: 0.32, roofOverhang: 0.18 },
      { width: 0.42, depth: 0.42, height: 0.28, roofOverhang: 0.14 },
    ],
    [],
  );
  return (
    <group>
      <Plinth radius={1.1} height={0.3} color="#5b5347" />
      <group position={[0, 0.3, 0]}>
        <PagodaTower tiers={tiers} color="#f1ede3" roofColor="#2f5c46" glowColor={glow} nightLights={nightLights} />
      </group>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Seoul — N Seoul Tower atop Namsan's mound
// ---------------------------------------------------------------------------
function SeoulTower({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(() => ringOfBuildings(17, 3.2, 0.8, 1.8, 0.35, 0.6, '#1e2536'), []);
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 1.1, 32]} />
        <meshStandardMaterial color="#2f3a2c" roughness={0.9} />
      </mesh>
      <group position={[0, 1.1, 0]}>
        <LatticeTower
          height={2.8}
          baseRadius={0.3}
          waistRadius={0.24}
          waistHeight={1.7}
          topRadius={0.05}
          color="#aab0b8"
          glowColor={glow}
          nightLights={nightLights}
          podRadius={0.28}
          podHeight={2.1}
        />
      </group>
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Busan — Gwangandaegyo's cable-stayed span over the water
// ---------------------------------------------------------------------------
function GwanganBridge({ glow, nightLights, showContext = true }: LandmarkProps) {
  const buildings = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: -3.6 + i * 0.5,
        z: -3,
        width: 0.35,
        depth: 0.35,
        height: 1.1 + Math.random() * 1.6,
        color: '#123042',
      })),
    [],
  );
  return (
    <group position={[0, 0.42, 0]}>
      <BridgeSpan length={7.5} deckWidth={0.42} towerHeight={1.9} style="cable-stayed" color="#31404c" glowColor={glow} nightLights={nightLights} />
      {showContext ? <SkyscraperCluster buildings={buildings} glowColor={glow} nightLights={nightLights} /> : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Disney Cruise — a liner alone on the open water
// ---------------------------------------------------------------------------
function CruiseShip({ glow, nightLights }: LandmarkProps) {
  return (
    <group position={[0, 0.1, 0]}>
      <ShipHull length={5.2} beam={1.1} decks={5} hullColor="#0f3e57" deckColor="#f4f1e6" glowColor={glow} nightLights={nightLights} />
    </group>
  );
}

export const landmarkRegistry: Record<LandmarkKind, ComponentType<LandmarkProps>> = {
  merlion: Merlion,
  'opera-house': OperaHouse,
  'eureka-tower': EurekaTower,
  'canton-tower': CantonTower,
  'hk-skyline': HkSkyline,
  'taipei-101': Taipei101,
  'tokyo-tower': TokyoTower,
  'osaka-castle': OsakaCastle,
  'seoul-tower': SeoulTower,
  'gwangan-bridge': GwanganBridge,
  'cruise-ship': CruiseShip,
};
