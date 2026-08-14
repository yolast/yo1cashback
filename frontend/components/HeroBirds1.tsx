'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

// --- sprite configuration (edit these to match your sprite sheet) ---
const SPRITE_FRAMES = 4; // number of animation frames in the horizontal strip
const SPRITE_WIDTH = 1024; // full sprite sheet width (px)
const SPRITE_HEIGHT = 168; // full sprite sheet height (px)
const DISPLAY_WIDTH = 96; // on-screen bird width (px)

const FRAME_WIDTH = SPRITE_WIDTH / SPRITE_FRAMES;
const DISPLAY_HEIGHT = Math.round(DISPLAY_WIDTH * (SPRITE_HEIGHT / FRAME_WIDTH));

interface Props {
  active: boolean;
  startX: number;
  startY: number;
}

export default function HeroBirds1({ active, startX, startY }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlapping, setIsFlapping] = useState(false);
  const [pitch, setPitch] = useState(0);

  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!active) return;

    // start from the current mouse position
    currentX.current = startX - DISPLAY_WIDTH / 2;
    currentY.current = startY - DISPLAY_HEIGHT / 2;
    targetX.current = currentX.current;
    targetY.current = currentY.current;
    setCoords({ x: currentX.current, y: currentY.current });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const left = rect?.left ?? 0;
      const top = rect?.top ?? 0;
      targetX.current = e.clientX - left - DISPLAY_WIDTH / 2;
      targetY.current = e.clientY - top - DISPLAY_HEIGHT / 2;
    };

    let animationFrameId = 0;
    const updateBird = () => {
      const dx = targetX.current - currentX.current;
      const dy = targetY.current - currentY.current;

      // smooth inertial follow (lower value = slower glide)
      currentX.current += dx * 0.08;
      currentY.current += dy * 0.08;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 4) {
        setIsFlapping(true);
        if (dx < -1) setIsFlipped(true);
        if (dx > 1) setIsFlipped(false);
        setPitch(Math.max(-18, Math.min(18, dy * 0.5)));
      } else {
        setIsFlapping(false);
        setPitch(0);
      }

      setCoords({ x: currentX.current, y: currentY.current });
      animationFrameId = requestAnimationFrame(updateBird);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateBird);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, startX, startY]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        className="bird-interactive"
        style={
          {
            '--bird-x': `${coords.x}px`,
            '--bird-y': `${coords.y}px`,
            '--bird-flip': isFlipped ? -1 : 1,
            '--bird-rotate': `${pitch}deg`,
            '--bird-w': `${DISPLAY_WIDTH}px`,
            '--bird-h': `${DISPLAY_HEIGHT}px`,
            '--bird-frames': SPRITE_FRAMES,
          } as CSSProperties
        }
      >
        <div className={`bird-interactive-sprite ${isFlapping ? 'flapping' : ''}`} />
      </div>
    </div>
  );
}
