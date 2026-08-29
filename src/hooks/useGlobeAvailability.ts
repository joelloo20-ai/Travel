import { useEffect, useState } from 'react';

function detectWebgl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

/**
 * The globe renders whenever WebGL is available. Compact screens use the same
 * scene with the Canvas pixel ratio capped in the renderer instead of losing
 * the exploration experience altogether.
 */
export function useGlobeAvailability(): { canRenderGlobe: boolean; reason: 'reduced-motion' | 'no-webgl' | null } {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  const [hasWebgl] = useState(detectWebgl);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => setPrefersReducedMotion(motionQuery.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  if (!hasWebgl) return { canRenderGlobe: false, reason: 'no-webgl' };
  if (prefersReducedMotion) return { canRenderGlobe: false, reason: 'reduced-motion' };
  return { canRenderGlobe: true, reason: null };
}
