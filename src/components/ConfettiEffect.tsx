'use client';

import { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const hasRun = useRef(false);

  const fire = useCallback(() => {
    const colors = ['#FFD1DC', '#B2FBA5', '#FFFACD', '#FF85A2', '#C9B1FF', '#FFD6A5'];

    // 왼쪽 파티클
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.1, y: 0.8 },
      colors,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });

    // 오른쪽 파티클
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.9, y: 0.8 },
      colors,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });

    // 중앙 파티클
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 30,
        gravity: 0.8,
      });
    }, 200);

    setTimeout(() => {
      onComplete?.();
    }, 3000);
  }, [onComplete]);

  useEffect(() => {
    if (trigger && !hasRun.current) {
      hasRun.current = true;
      fire();
    }
    if (!trigger) {
      hasRun.current = false;
    }
  }, [trigger, fire]);

  return null;
}
