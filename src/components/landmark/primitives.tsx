import { useMemo } from 'react';
import * as THREE from 'three';

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

/** A cluster of simple glass/concrete towers used for background skylines. */
export function SkyscraperCluster({ buildings, glowColor, nightLights }: SkyscraperClusterProps) {
  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial color={b.color} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, b.height + 0.005, 0]}>
            <boxGeometry args={[b.width * 0.98, 0.01, b.depth * 0.98]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={nightLights * 1.4}
              toneMapped={false}
            />
          </mesh>
        </group>
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
    return new THREE.LatheGeometry(points, 24);
  }, [baseRadius, waistRadius, waistHeight, topRadius, height]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.55} wireframe={false} />
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
}

/** A tiered pagoda/castle silhouette built from stacked boxes with overhanging roof slabs. */
export function PagodaTower({ tiers, color, roofColor, glowColor, nightLights }: PagodaTowerProps) {
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
        <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
          <boxGeometry args={[tier.width, tier.height, tier.depth]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
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
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[length * 0.98, 0.006, deckWidth * 0.15]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.5 + nightLights * 2}
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
              <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />
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
                  <lineBasicMaterial color="#e7e2d6" transparent opacity={0.4} />
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
