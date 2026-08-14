'use client';

import Link from 'next/link';
import { memo, useEffect, useRef, useState } from 'react';
import HeroBirds1 from '@/components/HeroBirds1';

type Pose = 'wave' | 'thumbsup' | 'neutral' | 'armsup';
type Gender = 'male' | 'female';

const SKIN_TONES = ['#f5d0a9', '#e0ac69', '#c68642', '#8d5524', '#ffd9b3'];
const SHIRT_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
  '#14b8a6', '#f97316', '#0ea5e9', '#ec4899', '#64748b',
  '#84cc16', '#f43f5e',
];
const HAIR_COLORS = ['#111827', '#1f2937', '#4b5563', '#78350f', '#92400e', '#fbbf24', '#b45309'];
const POSES: Pose[] = ['wave', 'thumbsup', 'neutral', 'armsup'];

const CATEGORY_TEXTS = [
  'Hotel Booking', 'Tour Package', 'Visa Services', 'Flight Ticket',
  'Life Insurance', 'Health Insurance', 'General Insurance',
  'Personal Loan', 'Vehicle Loan', 'Housing Loan', 'Mortgage Loan',
  'Educational Loan', 'Business Loan',
];

// Deterministic PRNG so the crowd is identical between server and client (no hydration mismatch).
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260813);
const FIGURE_COUNT = 1000;
const FIGURES = Array.from({ length: FIGURE_COUNT }, () => ({
  skin: SKIN_TONES[Math.floor(rand() * SKIN_TONES.length)],
  shirt: SHIRT_COLORS[Math.floor(rand() * SHIRT_COLORS.length)],
  hair: HAIR_COLORS[Math.floor(rand() * HAIR_COLORS.length)],
  pose: POSES[Math.floor(rand() * POSES.length)],
  gender: (rand() < 0.5 ? 'male' : 'female') as Gender,
  floatDelay: (rand() * 8).toFixed(2),
  floatDuration: (8 + rand() * 6).toFixed(2),
}));

// Split the crowd into independent rows so that when an avatar is removed,
// only that row compacts (no other part of the screen moves).
const AVATARS_PER_ROW = 48;
const ROWS: typeof FIGURES[] = [];
for (let i = 0; i < FIGURES.length; i += AVATARS_PER_ROW) {
  ROWS.push(FIGURES.slice(i, i + AVATARS_PER_ROW));
}

interface FigureProps {
  skin: string;
  shirt: string;
  hair: string;
  pose: Pose;
  gender: Gender;
}

const HumanFigure = memo(function HumanFigure({ skin, shirt, hair, pose, gender }: FigureProps) {
  return (
    <svg viewBox="0 0 80 100" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
      {/* torso — adult half body (broad shoulders, tapered waist) */}
      <path d="M24 100 C22 82 22 66 30 58 C34 54 46 54 50 58 C58 66 58 82 56 100 Z" fill={shirt} />
      {/* torso highlight (pseudo-3D) */}
      <path d="M28 100 C26 84 26 70 32 61 C34 58 38 57 40 59 L40 100 Z" fill="rgba(255,255,255,0.15)" />
      {/* neck */}
      <rect x="36" y="40" width="8" height="13" rx="3" fill={skin} />

      {/* long hair behind head (female) */}
      {gender === 'female' && (
        <path
          d="M27 30 C27 15 33 9 40 9 C47 9 53 15 53 30 C53 40 50 47 47 50 L44 50 L43 37 L40 50 L37 37 L36 50 L33 50 C30 47 27 40 27 30 Z"
          fill={hair}
        />
      )}

      {/* head (adult, smaller) */}
      <circle cx="40" cy="29" r="13" fill={skin} />
      {/* head highlight (pseudo-3D) */}
      <circle cx="36" cy="25" r="4.5" fill="rgba(255,255,255,0.18)" />

      {/* short hair cap on top (male) */}
      {gender === 'male' && (
        <path
          d="M27 29 C27 15 33 10 40 10 C47 10 53 15 53 29 C53 22 47 18 40 18 C33 18 27 22 27 29 Z"
          fill={hair}
        />
      )}

      {/* face */}
      <circle cx="36" cy="29" r="1.7" fill="#111827" />
      <circle cx="44" cy="29" r="1.7" fill="#111827" />
      <path d="M36 35 Q40 38 44 35" stroke="#111827" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* arms / gesture (shoulders ~ y=58) */}
      {pose === 'neutral' && (
        <>
          <path d="M18 60 C12 68 10 78 12 88" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M62 60 C68 68 70 78 68 88" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      )}
      {pose === 'wave' && (
        <>
          <path d="M18 60 C13 65 6 60 3 48" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="3" cy="44" r="4" fill={skin} />
          <path d="M62 60 C68 68 70 78 68 88" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      )}
      {pose === 'thumbsup' && (
        <>
          <path d="M18 60 C12 68 10 78 12 88" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M62 60 C66 56 70 54 72 50" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="69" y="37" width="6" height="12" rx="2" fill={skin} />
        </>
      )}
      {pose === 'armsup' && (
        <>
          <path d="M18 60 C13 50 11 38 10 30" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="10" cy="26" r="4" fill={skin} />
          <path d="M62 60 C67 50 69 38 70 30" stroke={shirt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="70" cy="26" r="4" fill={skin} />
        </>
      )}
    </svg>
  );
});

const AvatarGrid = memo(function AvatarGrid({ removed }: { removed: Set<number> }) {
  return (
    <div className="flex h-full w-full flex-col content-start overflow-hidden">
      {ROWS.map((row, r) => (
        <div key={r} className="flex w-full shrink-0 overflow-hidden">
          {row.map((f, c) => {
            const i = r * AVATARS_PER_ROW + c;
            const isRemoved = removed.has(i);
            const animate = i % 7 === 0 && !isRemoved;
            return (
              <div
                key={i}
                data-avatar-idx={i}
                style={{
                  width: isRemoved ? 0 : 38,
                  height: 48,
                  margin: isRemoved ? 0 : 1,
                  opacity: isRemoved ? 0 : 1,
                  overflow: 'hidden',
                  transition: 'width 0.5s ease, margin 0.5s ease, opacity 0.45s ease',
                  ...(animate ? { animation: `avatar-float ${f.floatDuration}s ease-in-out ${f.floatDelay}s infinite` } : {}),
                }}
              >
                <HumanFigure {...f} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

interface Burst {
  id: number;
  x: number;
  y: number;
  text: string;
}

function BurstOverlay({ burst }: { burst: Burst }) {
  const { x, y, text } = burst;
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      {/* glow */}
      <div
        className="absolute rounded-full bg-brand-500/40 blur-md"
        style={{ width: 72, height: 72, left: -36, top: -36, animation: 'burst-glow 0.9s ease-out forwards' }}
      />
      {/* ripple */}
      <span
        className="absolute rounded-full border-2 border-amber-400/60"
        style={{ width: 44, height: 44, left: -22, top: -22, animation: 'burst-ripple 1s ease-out forwards' }}
      />
      {/* gold star */}
      <span
        className="absolute text-2xl text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        style={{ left: -12, top: -12, animation: 'burst-star 1.1s ease-out forwards' }}
      >
        ★
      </span>
      {/* floating category text */}
      <span
        className="absolute whitespace-nowrap text-sm font-semibold text-amber-300 drop-shadow"
        style={{ left: -60, top: -22, animation: 'burst-rise 1.6s ease-out forwards' }}
      >
        {text}
      </span>
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const removedRef = useRef<Set<number>>(new Set());
  const timeoutsRef = useRef<number[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [burst, setBurst] = useState<Burst | null>(null);
  const [logoOk, setLogoOk] = useState(true);
  const [mouseInside, setMouseInside] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setMouseInside(true);
    };
    const onLeave = () => setMouseInside(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      let idx = Math.floor(Math.random() * FIGURE_COUNT);
      let attempts = 0;
      while (removedRef.current.has(idx) && attempts < 50) {
        idx = Math.floor(Math.random() * FIGURE_COUNT);
        attempts += 1;
      }
      if (removedRef.current.has(idx)) return;

      const el = heroRef.current?.querySelector(`[data-avatar-idx="${idx}"]`) as HTMLElement | null;
      const hero = heroRef.current;
      if (!el || !hero) return;

      const heroRect = hero.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const x = elRect.left - heroRect.left + elRect.width / 2;
      const y = elRect.top - heroRect.top + elRect.height / 2;
      const text = CATEGORY_TEXTS[Math.floor(Math.random() * CATEGORY_TEXTS.length)];

      setBurst({ id: Date.now(), x, y, text });

      // after the star/text, remove that avatar so the row compacts
      const t = window.setTimeout(() => {
        removedRef.current.add(idx);
        setRemoved(new Set(removedRef.current));
      }, 1600);
      timeoutsRef.current.push(t);
    };

    tick();
    const interval = setInterval(tick, 2000);

    // Full reset every 30 minutes so the crowd refills and no empty space accumulates.
    const resetInterval = setInterval(() => {
      removedRef.current.clear();
      setRemoved(new Set());
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(resetInterval);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <div ref={heroRef} className="relative min-h-screen overflow-hidden bg-secondary-950 text-white">
      {/* full-screen crowd — avatars get consumed over time, row compacts */}
      <div className="absolute inset-0">
        <div className="h-full w-full opacity-50">
          <AvatarGrid removed={removed} />
        </div>
      </div>

      {/* vignette for readability */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.55)_60%,rgba(2,6,23,0.9)_100%)]" />

      {/* random avatar burst */}
      {burst && <BurstOverlay key={burst.id} burst={burst} />}

      {/* center content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex flex-col items-center" style={{ animation: 'fade-up 0.6s ease-out both' }}>
          <h1 className="whitespace-nowrap text-xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Every purchase{' '}
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-amber-400 bg-clip-text text-transparent">
              pays you back
            </span>
          </h1>

          {/* transparent YO1Cashback logo — intrinsic size; drop the file at /public/logo.png */}
          {logoOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt="YO1Cashback"
              className="mx-auto mt-8 h-auto w-auto max-w-full"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="mt-8 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">YO1Cashback</span>
          )}

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-9">
            <Link
              href="/login"
              className="text-lg font-semibold text-brand-400 underline-offset-4 transition hover:text-brand-300 hover:underline"
            >
              Login
            </Link>
            <Link
              href="/#how-it-works"
              className="text-lg font-semibold text-sky-400 underline-offset-4 transition hover:text-sky-300 hover:underline"
            >
              How It Works?
            </Link>
            <Link
              href="/tickets"
              className="text-lg font-semibold text-amber-400 underline-offset-4 transition hover:text-amber-300 hover:underline"
            >
              HelpDesk
            </Link>
          </div>
        </div>
      </div>

      {/* arctic tern bird — follows the mouse only while it's inside the screen */}
      <HeroBirds1 active={mouseInside} startX={mousePosRef.current.x} startY={mousePosRef.current.y} />

      {/* powered by YOlast — bottom right */}
      <a
        href="https://yolast.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-20 opacity-80 transition hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mouseInside ? '/powered-by-yolast1.png' : '/powered-by-yolast.png'}
          alt="Powered by YOlast"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </a>
    </div>
  );
}
