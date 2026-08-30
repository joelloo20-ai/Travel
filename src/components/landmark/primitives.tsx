import { useMemo } from 'react';
import * as THREE from 'three';
import { useLatticeAlphaTexture, useWindowTextures } from './buildingTextures';

export interface BuildingSpec {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

interface SkyscraperClusterProps {
  buildings: BuildingSpec[];
  glowColor: string;
  nightLights: number;
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295;
}

interface TexturedBoxProps {
  width: number;
  height: number;
  depth: number;
  position?: [number, number, number];
  seed: number;
  nightLights: number;
  facadeRoughness?: number;
  facadeMetalness?: number;
}

/** A box tower with a generated lit-window facade on its four side faces. */
export function TexturedBox({
  width,
  height,
  depth,
  position = [0, 0, 0],
  seed,
  nightLights,
  facadeRoughness = 0.5,
  facadeMetalness = 0.35,
}: TexturedBoxProps) {
  const { colorMap, emissiveMap } = useWindowTextures(width, height, seed);

  const materials = useMemo(() => {
    const facade = new THREE.MeshStandardMaterial({
      map: colorMap,
      emissiveMap,
      emissive: '#d8ae77',
      emissiveIntensity: nightLights * 0.58,
      roughness: Math.max(facadeRoughness, 0.58),
      metalness: facadeMetalness,
    });
    const roof = new THREE.MeshStandardMaterial({ color: '#1c2229', roughness: 0.8, metalness: 0.1 });
    const base = new THREE.MeshStandardMaterial({ color: '#0d1114', roughness: 0.9 });
    return [facade, facade, roof, base, facade, facade];
  }, [colorMap, emissiveMap, nightLights, facadeRoughness, facadeMetalness]);

  return (
    <mesh position={position} material={materials} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}

/** A single background tower with a generated lit-window facade and roof clutter. */
function Building({ b, index, glowColor, nightLights }: { b: BuildingSpec; index: number; glowColor: string; nightLights: number }) {
  const seed = index * 0.618 + b.height * 0.13 + hashSeed(b.color);
  const hasRoofDetail = index % 3 === 0;
  const hasSetback = index % 4 === 1 && b.height > 1.6;
  const hasSpire = index % 5 === 2 && b.height > 2.2;

  return (
    <group position={[b.x, 0, b.z]}>
      <TexturedBox width={b.width} height={b.height} depth={b.depth} position={[0, b.height / 2, 0]} seed={seed} nightLights={nightLights} />
      {hasSetback && (
        <mesh position={[0, b.height + b.height * 0.06, 0]} castShadow>
          <boxGeometry args={[b.width * 0.62, b.height * 0.12, b.depth * 0.62]} />
          <meshStandardMaterial color="#1c2229" roughness={0.7} metalness={0.2} />
        </mesh>
      )}
      {hasRoofDetail && (
        <mesh position={[b.width * 0.2, b.height + 0.06, b.depth * 0.15]} castShadow>
          <boxGeometry args={[b.width * 0.12, 0.1, b.depth * 0.12]} />
          <meshStandardMaterial color="#2a3138" roughness={0.8} />
        </mesh>
      )}
      {hasSpire && (
        <group position={[b.width * -0.16, b.height + 0.17, b.depth * 0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.018, 0.028, 0.32, 8]} />
            <meshStandardMaterial color="#536069" roughness={0.48} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={nightLights * 0.45} toneMapped={false} />
          </mesh>
        </group>
      )}
      <mesh position={[0, b.height + 0.005, 0]}>
        <boxGeometry args={[b.width * 0.98, 0.01, b.depth * 0.98]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={nightLights * 0.32}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** A cluster of glass/concrete towers with lit-window facades, used for background skylines. */
export function SkyscraperCluster({ buildings, glowColor, nightLights }: SkyscraperClusterProps) {
  return (
    <group>
      {buildings.map((b, i) => (
        <Building key={i} b={b} index={i} glowColor={glowColor} nightLights={nightLights} />
      ))}
    </group>
  );
}

interface LatticeTowerProps {
  height: number;
  baseRadius: number;
  waistRadius: number;
  waistHeight: number;
  topRadius: number;
  color: string;
  glowColor: string;
  nightLights: number;
  podRadius?: number;
  podHeight?: number;
}

/** A tapered lattice/observation tower (Tokyo Tower, Canton Tower, N Seoul Tower). */
export function LatticeTower({
  height,
  baseRadius,
  waistRadius,
  waistHeight,
  topRadius,
  color,
  glowColor,
  nightLights,
  podRadius,
  podHeight,
}: LatticeTowerProps) {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(baseRadius, 0),
      new THREE.Vector2(waistRadius, waistHeight),
      new THREE.Vector2(topRadius, height),
    ];
    return new THREE.LatheGeometry(points, 28);
  }, [baseRadius, waistRadius, waistHeight, topRadius, height]);

  const latticeAlpha = useLatticeAlphaTexture();

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.55}
          alphaMap={latticeAlpha}
          alphaTest={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Solid inner core so the open lattice doesn't read as a hollow paper cutout from the front. */}
      <mesh geometry={geometry} scale={0.94} renderOrder={-1}>
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {podRadius && podHeight && (
        <mesh position={[0, podHeight, 0]} castShadow>
          <sphereGeometry args={[podRadius, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
        </mesh>
      )}
      <mesh position={[0, height + 0.05, 0]}>
        <sphereGeometry args={[Math.max(topRadius * 1.6, 0.035), 12, 12]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.6 + nightLights * 2.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

interface PagodaTowerProps {
  tiers: { width: number; depth: number; height: number; roofOverhang: number }[];
  color: string;
  roofColor: string;
  glowColor: string;
  nightLights: number;
  /** Use a lit-window facade on the tier bodies (modern tech tower) instead of flat plaster/stone. */
  windowed?: boolean;
}

/** A tiered pagoda/castle silhouette built from stacked boxes with overhanging roof slabs. */
export function PagodaTower({ tiers, color, roofColor, glowColor, nightLights, windowed = false }: PagodaTowerProps) {
  const baseYs = useMemo(() => {
    const offsets: number[] = [];
    let cumulative = 0;
    for (const tier of tiers) {
      offsets.push(cumulative);
      cumulative += tier.height;
    }
    return offsets;
  }, [tiers]);

  const parts = tiers.map((tier, i) => {
    const bodyY = baseYs[i] + tier.height / 2;
    const roofY = baseYs[i] + tier.height;
    return (
      <group key={i}>
        {windowed ? (
          <TexturedBox
            width={tier.width}
            depth={tier.depth}
            height={tier.height}
            position={[0, bodyY, 0]}
            seed={i * 2.3 + 4.1}
            nightLights={nightLights}
            facadeRoughness={0.4}
            facadeMetalness={0.4}
          />
        ) : (
          <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
            <boxGeometry args={[tier.width, tier.height, tier.depth]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
          </mesh>
        )}
        <mesh position={[0, roofY, 0]} castShadow>
          <boxGeometry
            args={[tier.width + tier.roofOverhang, Math.max(tier.height * 0.12, 0.03), tier.depth + tier.roofOverhang]}
          />
          <meshStandardMaterial color={roofColor} roughness={0.4} metalness={0.3} />
        </mesh>
        {i === tiers.length - 1 && (
          <mesh position={[0, roofY + 0.08, 0]}>
            <coneGeometry args={[0.04, 0.16, 8]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={0.5 + nightLights * 2}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
    );
  });
  return <group>{parts}</group>;
}

interface ShellSailProps {
  position: [number, number, number];
  rotationY: number;
  scale: number;
  color: string;
}

/** One curved "sail" shell, approximating an opera-house roof form via a bent lathe wedge. */
export function ShellSail({ position, rotationY, scale, color }: ShellSailProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.55, 0.05, 0.62, 0.95);
    shape.quadraticCurveTo(0.4, 1.05, 0.05, 0.7);
    shape.quadraticCurveTo(-0.05, 0.3, 0, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3 });
  }, []);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface BridgeSpanProps {
  length: number;
  deckWidth: number;
  towerHeight: number;
  style: 'arch' | 'cable-stayed';
  color: string;
  glowColor: string;
  nightLights: number;
}

/** A bridge across the scene: either a steel through-arch or a cable-stayed twin-pylon deck. */
export function BridgeSpan({ length, deckWidth, towerHeight, style, color, glowColor, nightLights }: BridgeSpanProps) {
  const archGeometry = useMemo(() => {
    if (style !== 'arch') return null;
    const curve = new THREE.EllipseCurve(0, 0, length / 2, towerHeight, Math.PI, 0, false, 0);
    const points = curve.getPoints(40).map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, 0.03, 8, false);
  }, [length, towerHeight, style]);

  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[length, 0.04, deckWidth]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.052, 0]}>
        <boxGeometry args={[length * 0.985, 0.032, deckWidth * 0.62]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={1.55 + nightLights * 3.4}
          toneMapped={false}
        />
      </mesh>

      {style === 'arch' && archGeometry && (
        <mesh geometry={archGeometry} castShadow>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
        </mesh>
      )}

      {style === 'cable-stayed' &&
        [-length * 0.28, length * 0.28].map((x, towerIndex) => (
          <group key={towerIndex} position={[x, 0, 0]}>
            <mesh position={[0, towerHeight / 2, 0]} castShadow>
              <boxGeometry args={[0.035, towerHeight, 0.035]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.45 + nightLights * 1.2} roughness={0.32} metalness={0.6} toneMapped={false} />
            </mesh>
            {Array.from({ length: 7 }).map((_, cableIndex) => {
              const t = (cableIndex + 1) / 8;
              const cableGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, towerHeight * 0.92, 0),
                new THREE.Vector3((towerIndex === 0 ? 1 : -1) * length * 0.3 * t, 0.03, 0),
              ]);
              return (
                <line key={cableIndex}>
                  <primitive object={cableGeometry} attach="geometry" />
                  <lineBasicMaterial color={glowColor} transparent opacity={0.86 + nightLights * 0.12} toneMapped={false} />
                </line>
              );
            })}
          </group>
        ))}
    </group>
  );
}

interface ShipHullProps {
  length: number;
  beam: number;
  decks: number;
  hullColor: string;
  deckColor: string;
  glowColor: string;
  nightLights: number;
}

/** A stylised cruise-liner silhouette: tapered hull + stacked deck slabs + a funnel. */
export function ShipHull({ length, beam, decks, hullColor, deckColor, glowColor, nightLights }: ShipHullProps) {
  const hullGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const half = beam / 2;
    shape.moveTo(-length / 2, 0);
    shape.lineTo(-length / 2 + length * 0.08, half);
    shape.lineTo(length / 2 - length * 0.14, half);
    shape.lineTo(length / 2, 0);
    shape.lineTo(length / 2 - length * 0.14, -half);
    shape.lineTo(-length / 2 + length * 0.08, -half);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  }, [length, beam]);

  return (
    <group>
      <mesh geometry={hullGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={hullColor} roughness={0.45} metalness={0.35} />
      </mesh>
      {Array.from({ length: decks }).map((_, i) => (
        <mesh key={i} position={[0, 0.22 + i * 0.09, 0]} castShadow>
          <boxGeometry args={[length * (0.82 - i * 0.09), 0.08, beam * (0.55 - i * 0.06)]} />
          <meshStandardMaterial color={deckColor} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[length * 0.12, 0.22 + decks * 0.09 + 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.22, 16]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} metalness={0.3} />
      </mesh>
      {Array.from({ length: decks + 2 }).map((_, i) => (
        <mesh key={i} position={[length * (0.42 - (i % 6) * 0.16), 0.24 + Math.floor(i / 1) * 0.02, beam * 0.28]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.6 + nightLights * 2.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
