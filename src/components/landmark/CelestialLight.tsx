import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CelestialLightProps {
  sunElevation: number;
  dayPhase: number;
  goldenPhase: number;
  overcast: number;
  glow: string;
}

/**
 * A directional key light that arcs with the sun (warm at dawn/dusk, bright white
 * at noon, replaced by a cool dim "moonlight" feel at night), plus ambient fill.
 */
export function CelestialLight({ sunElevation, dayPhase, goldenPhase, overcast, glow }: CelestialLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const dayColor = useMemo(() => new THREE.Color('#fff6e4'), []);
  const duskColor = useMemo(() => new THREE.Color(glow), [glow]);
  const nightColor = useMemo(() => new THREE.Color('#5f7ad1'), []);
  const mixed = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const angle = (sunElevation * Math.PI) / 2 + Math.PI / 2;
    const x = Math.cos(angle * 0.6) * 12;
    const y = Math.max(Math.sin(angle), 0.08) * 12;
    const z = 0.35 * 12;

    if (lightRef.current) {
      lightRef.current.position.set(x, y, z);

      mixed.copy(nightColor).lerp(duskColor, goldenPhase).lerp(dayColor, Math.max(0, dayPhase - goldenPhase * 0.3));
      lightRef.current.color.copy(mixed);

      const baseIntensity = 0.35 + dayPhase * 2.4 + goldenPhase * 0.5;
      lightRef.current.intensity = baseIntensity * (1 - overcast * 0.55);
    }
  });

  const ambientIntensity = 0.35 + dayPhase * 0.55 + overcast * 0.25;
  const ambientColor = dayPhase > 0.5 ? '#dfe9f2' : '#2c3a5e';
  const fillIntensity = 0.5 + (1 - dayPhase) * 0.5;

  return (
    <>
      <directionalLight ref={lightRef} castShadow intensity={1} />
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <pointLight position={[-3, 1.5, 2]} intensity={fillIntensity * 0.6} color="#4c9ab4" />
    </>
  );
}
