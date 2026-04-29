'use client';

import { useMemo } from 'react';

interface FloatingLeavesProps {
  count?: number;
  opacity?: number;
}

export function FloatingLeaves({ count = 8, opacity = 0.25 }: FloatingLeavesProps) {
  const leaves = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const hue = 90 + Math.random() * 65;
      const sat = 40 + Math.random() * 20;
      const lit = 50 + Math.random() * 15;
      const size = 12 + Math.random() * 10;
      const left = Math.random() * 100;
      const delay = Math.random() * 18;
      const duration = 14 + Math.random() * 8;

      return { id: i, hue, sat, lit, size, left, delay, duration };
    });
  }, [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1, opacity }}
    >
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-leaf-drift"
          style={{
            left: `${leaf.left}%`,
            top: '-20px',
            width: `${leaf.size}px`,
            height: `${leaf.size * 0.6}px`,
            backgroundColor: `hsl(${leaf.hue} ${leaf.sat}% ${leaf.lit}%)`,
            borderRadius: '0 80% 0 80%',
            animationDelay: `${leaf.delay}s`,
            ['--leaf-duration' as string]: `${leaf.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
