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

