import { useEffect, useState } from 'react';

export interface VisualViewportRect {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
}

function getVisualViewportRect(): VisualViewportRect {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 };
  }

  const viewport = window.visualViewport;

  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
    offsetTop: viewport?.offsetTop ?? 0,
    offsetLeft: viewport?.offsetLeft ?? 0,
  };
}

export function useVisualViewportRect() {
  const [rect, setRect] = useState<VisualViewportRect>(() => getVisualViewportRect());

  useEffect(() => {
    const updateRect = () => setRect(getVisualViewportRect());
    const viewport = window.visualViewport;

    updateRect();
    viewport?.addEventListener('resize', updateRect);
    viewport?.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);
    window.addEventListener('orientationchange', updateRect);

    return () => {
      viewport?.removeEventListener('resize', updateRect);
      viewport?.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('orientationchange', updateRect);
    };
  }, []);

  return rect;
}
