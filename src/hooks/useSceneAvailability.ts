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
 * live 3D only when WebGL works, motion is not reduced, and the viewport is
 * wider than 700px — otherwise callers should show a static fallback.
 */
export function useSceneAvailability(): { canRenderScene: boolean; reason: 'reduced-motion' | 'narrow' | 'no-webgl' | null } {
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

  if (!hasWebgl) return { canRenderScene: false, reason: 'no-webgl' };
  if (prefersReducedMotion) return { canRenderScene: false, reason: 'reduced-motion' };
  if (isNarrow) return { canRenderScene: false, reason: 'narrow' };
  return { canRenderScene: true, reason: null };
}
