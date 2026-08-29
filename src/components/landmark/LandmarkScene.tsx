import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import type { Destination } from '../../data/destinations';
import type { LiveWeather } from '../../hooks/useLiveWeather';
import type { LocalTimeState } from '../../hooks/useLocalTime';
import { useSceneAvailability } from '../../hooks/useSceneAvailability';
import { SkyDome } from './SkyDome';
import { CelestialLight } from './CelestialLight';
import { Water } from './Water';
import { WeatherEffects } from './WeatherFX';
import { useGroundTexture } from './groundTexture';
import { GlobeErrorBoundary } from '../GlobeErrorBoundary';
import { LandmarkStaticFallback } from './LandmarkStaticFallback';
import { landmarkRegistry } from './Landmarks';

const CONDITION_OVERCAST_BOOST: Record<string, number> = {
  clear: 0,
  cloudy: 0.15,
  fog: 0.55,
  drizzle: 0.3,
  rain: 0.4,
  snow: 0.35,
  thunderstorm: 0.55,
};

function GroundPlaza({ color }: { color: string }) {
  const { map } = useGroundTexture(color);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[22, 48]} />
      <meshStandardMaterial map={map} roughness={0.88} metalness={0.05} />
    </mesh>
  );
}

/** A warm highlight beam that calls the hero landmark out from the surrounding skyline. */
function LandmarkHighlight({ glow, dayPhase, goldenPhase }: { glow: string; dayPhase: number; goldenPhase: number }) {
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(0, 1.6, 0);
    return object;
  }, []);
  const intensity = 1.4 + (1 - dayPhase) * 2.2 + goldenPhase * 1.2;

  return (
    <>
      <primitive object={target} />
      <spotLight
        position={[4.5, 7, 5]}
        target={target}
        color={glow}
        intensity={intensity}
        angle={0.32}
        penumbra={0.65}
        distance={20}
        decay={1.6}
      />
    </>
  );
}

interface SceneContentProps {
  destination: Destination;
  weather: LiveWeather | null;
  localTime: LocalTimeState;
}

function SceneContent({ destination, weather, localTime }: SceneContentProps) {
  const LandmarkComponent = landmarkRegistry[destination.landmark];
  const cloudCoverFraction = weather ? weather.cloudCoverPct / 100 : 0.2;
  const conditionBoost = weather ? (CONDITION_OVERCAST_BOOST[weather.condition] ?? 0) : 0;
  const overcast = Math.min(1, cloudCoverFraction * 0.7 + conditionBoost);

  const fogColor = useMemo(() => new THREE.Color(destination.sky).lerp(new THREE.Color(destination.deep), 1 - localTime.dayPhase), [destination.sky, destination.deep, localTime.dayPhase]);
  const fogDensity = 0.006 + overcast * 0.028;

  const nightLights = 1 - localTime.dayPhase;

  return (
    <>
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />
      <SkyDome
        deep={destination.deep}
        sky={destination.sky}
        glow={destination.glow}
        dayPhase={localTime.dayPhase}
        goldenPhase={localTime.goldenPhase}
        sunElevation={localTime.sunElevation}
        overcast={overcast}
      />
      <CelestialLight
        sunElevation={localTime.sunElevation}
        dayPhase={localTime.dayPhase}
        goldenPhase={localTime.goldenPhase}
        overcast={overcast}
        glow={destination.glow}
      />
      <LandmarkHighlight glow={destination.glow} dayPhase={localTime.dayPhase} goldenPhase={localTime.goldenPhase} />

      {destination.hasWater ? (
        <Water
          deep={destination.deep}
          sky={destination.sky}
          glow={destination.glow}
          dayPhase={localTime.dayPhase}
          choppiness={weather ? Math.min(weather.windKph / 30, 1) : 0.2}
        />
      ) : (
        <GroundPlaza color={destination.deep} />
      )}

      <Suspense fallback={null}>
        <LandmarkComponent accent={destination.accent} deep={destination.deep} glow={destination.glow} nightLights={nightLights} />
      </Suspense>

      {weather && (
        <WeatherEffects
          condition={weather.condition}
          precipitationMm={weather.precipitationMm}
          cloudCoverPct={weather.cloudCoverPct}
          windKph={weather.windKph}
          windDirectionDeg={weather.windDirectionDeg}
          cloudTint={destination.sky}
          dayPhase={localTime.dayPhase}
        />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={9}
        maxDistance={24}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.47}
        rotateSpeed={0.4}
        autoRotate
        autoRotateSpeed={0.28}
        enableDamping
        dampingFactor={0.08}
        target={[0, 2, 0]}
      />

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.25} intensity={0.65 + nightLights * 0.5} mipmapBlur radius={0.55} />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

export interface LandmarkSceneProps {
  destination: Destination;
  weather: LiveWeather | null;
  localTime: LocalTimeState;
  loading: boolean;
}

export function LandmarkScene({ destination, weather, localTime, loading }: LandmarkSceneProps) {
  const { canRenderScene } = useSceneAvailability();

  if (!canRenderScene) {
    return <LandmarkStaticFallback destination={destination} localTime={localTime} loading={loading} />;
  }

  return (
    <GlobeErrorBoundary fallback={<LandmarkStaticFallback destination={destination} localTime={localTime} />}>
      <Suspense fallback={<LandmarkStaticFallback destination={destination} localTime={localTime} loading />}>
        <Canvas
          className="landmark-canvas"
          dpr={[1, 1.75]}
          shadows
          gl={{ antialias: true, alpha: false }}
          camera={{ position: [0, 5.4, 14], fov: 45, near: 0.1, far: 150 }}
        >
          <SceneContent destination={destination} weather={weather} localTime={localTime} />
        </Canvas>
      </Suspense>
    </GlobeErrorBoundary>
  );
}
