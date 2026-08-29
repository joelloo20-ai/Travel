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
 * The globe renders only when WebGL works, motion is not reduced, and the
 * viewport is wider than 700px — matching the fallback contract in the spec.
 */
export function useGlobeAvailability(): { canRenderGlobe: boolean; reason: 'reduced-motion' | 'narrow' | 'no-webgl' | null } {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 700 : false,
  );
  const [hasWebgl] = useState(detectWebgl);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => setPrefersReducedMotion(motionQuery.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const handleResize = () => setIsNarrow(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!hasWebgl) return { canRenderGlobe: false, reason: 'no-webgl' };
  if (prefersReducedMotion) return { canRenderGlobe: false, reason: 'reduced-motion' };
  if (isNarrow) return { canRenderGlobe: false, reason: 'narrow' };
  return { canRenderGlobe: true, reason: null };
}
