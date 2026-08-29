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
 * Shared gate for every WebGL scene in the app (globe, landmark pages): render
 * live 3D whenever WebGL works and motion is not reduced.
 */
export function useSceneAvailability(): { canRenderScene: boolean; reason: 'reduced-motion' | 'no-webgl' | null } {
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

  if (!hasWebgl) return { canRenderScene: false, reason: 'no-webgl' };
  if (prefersReducedMotion) return { canRenderScene: false, reason: 'reduced-motion' };
  return { canRenderScene: true, reason: null };
}
