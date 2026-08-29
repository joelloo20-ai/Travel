import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import {
  destinations,
  latLngToVector3,
  longitudeToRotationY,
  type Destination,
} from '../data/destinations';
import { StaticAtlas } from './StaticAtlas';
import { GlobeErrorBoundary } from './GlobeErrorBoundary';


interface GlobeProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}


function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}


function lerpAngle(current: number, target: number, t: number): number {
  const normalizedCurrent = normalizeAngle(current);
  const normalizedTarget = normalizeAngle(target);
  let delta = normalizedTarget - normalizedCurrent;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * t;
}


function Earth() {
  const texture = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}assets/earth-blue-marble.jpg`);

  useLayoutEffect(() => {
    // three.js textures are mutable engine objects; this is the standard
    // r3f pattern for configuring a loaded texture before first paint.
    // oxlint-disable-next-line react/immutability
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <>
      <mesh>
        <sphereGeometry args={[1.48, 72, 72]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.75}
          metalness={0.02}
          emissiveMap={texture}
          emissive={new THREE.Color('#0b2530')}
          emissiveIntensity={0.42}
        />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[1.48, 48, 48]} />
        <meshPhongMaterial
          color="#b5eaff"
          opacity={0.12}
          transparent
          shininess={80}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[1.48, 48, 48]} />
        <meshBasicMaterial
          color="#5aabc6"
          opacity={0.16}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

interface BeaconProps {
  destination: Destination;
  isActive: boolean;
  isHovered: boolean;
  onSelect: (key: string) => void;
  onHoverChange: (key: string | null) => void;
}

function Beacon({ destination, isActive, isHovered, onSelect, onHoverChange }: BeaconProps) {
  const position = useMemo(
    () => latLngToVector3(destination.latitude, destination.longitude, 1.56),
    [destination.latitude, destination.longitude],
  );
  const emphasized = isActive || isHovered;
  const beaconRadius = emphasized ? 0.068 : 0.032;
  const ringScale = emphasized ? 1.8 : 1.18;
  const ringOpacity = emphasized ? 0.8 : 0.35;
  const ringRef = useRef<Mesh>(null);

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(destination.key);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHoverChange(destination.key);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHoverChange(null);
        }}
      >
        <sphereGeometry args={[beaconRadius, 24, 24]} />
        <meshBasicMaterial color={destination.accent} toneMapped={false} />
      </mesh>
      <mesh ref={ringRef} scale={ringScale} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.066, 0.079, 32]} />
        <meshBasicMaterial
          color={destination.accent}
          transparent
          opacity={ringOpacity}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {emphasized && (
        <Html position={[0, 0.13, 0]} center occlude="raycast" distanceFactor={4.2} zIndexRange={[10, 0]}>
          <div className="beacon-label">
            <span className="beacon-label__code">
              {destination.airportCode} · {destination.countryName}
            </span>
            <span className="beacon-label__city">{destination.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

interface SceneProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

function Scene({ selectedKey, onSelect }: SceneProps) {
  const selected = destinations.find((destination) => destination.key === selectedKey);
  const [initialRotationY] = useState(() => longitudeToRotationY(selected?.longitude ?? 0));

  const groupRef = useRef<Group>(null);
  const isDraggingRef = useRef(false);
  const targetRotationRef = useRef(initialRotationY);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      targetRotationRef.current = longitudeToRotationY(selected.longitude);
    }
  }, [selected]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y = lerpAngle(group.rotation.y, targetRotationRef.current, Math.min(delta * 2.2, 1));
    if (!isDraggingRef.current) {
      group.rotation.y += delta * 0.12;
    }
  });

  const handleHoverChange = useCallback((key: string | null) => {
    setHoveredKey(key);
    document.body.style.cursor = key ? 'pointer' : 'auto';
  }, []);

  return (
    <>
      <color attach="background" args={['#061b1d']} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[4, 2.5, 4]} intensity={2.3} color="#fff3d9" />
      <pointLight position={[-4, -1, 3]} intensity={1.15} color="#4c9ab4" />
      <Stars radius={16} depth={8} count={700} factor={2.2} saturation={0.2} fade speed={0.3} />
      <group ref={groupRef} rotation={[0, initialRotationY, 0]}>
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        {destinations.map((destination) => (
          <Beacon
            key={destination.key}
            destination={destination}
            isActive={destination.key === selectedKey}
            isHovered={destination.key === hoveredKey}
            onSelect={onSelect}
            onHoverChange={handleHoverChange}
          />
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        rotateSpeed={0.52}
        enableDamping
        dampingFactor={0.08}
        onStart={() => {
          isDraggingRef.current = true;
        }}
        onEnd={() => {
          isDraggingRef.current = false;
        }}
      />
    </>
  );
}

export function Globe({ selectedKey, onSelect }: GlobeProps) {
  return (
    <GlobeErrorBoundary fallback={<StaticAtlas selectedKey={selectedKey} />}>
      <Suspense fallback={<StaticAtlas loading selectedKey={selectedKey} />}>
        <Canvas
          className="globe-canvas"
          dpr={[1, Math.min(1.5, window.devicePixelRatio || 1)]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0.15, 4.7], fov: 42 }}
        >
          <Scene selectedKey={selectedKey} onSelect={onSelect} />
        </Canvas>
      </Suspense>
    </GlobeErrorBoundary>
  );
}
