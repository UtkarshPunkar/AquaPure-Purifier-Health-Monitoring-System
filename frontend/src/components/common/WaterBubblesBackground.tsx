import React, { useMemo, useState } from 'react';

interface BubbleConfig {
  id: number;
  size: number;
  left: number; // percentage 0-100
  duration: number; // seconds
  delay: number; // negative seconds for instant seamless loop
  swayDuration: number;
  swayDistance: number; // px
  opacity: number;
  hasGlint: boolean;
}

export const WaterBubblesBackground: React.FC = () => {
  const [poppedIds, setPoppedIds] = useState<Set<number>>(new Set());

  // Generate 26 uniquely configured, organic water bubbles
  const bubbles = useMemo<BubbleConfig[]>(() => {
    const bubbleDefs: BubbleConfig[] = [
      { id: 1, size: 14, left: 4, duration: 13, delay: -2, swayDuration: 4.5, swayDistance: 16, opacity: 0.7, hasGlint: true },
      { id: 2, size: 28, left: 11, duration: 18, delay: -9, swayDuration: 6.2, swayDistance: 28, opacity: 0.85, hasGlint: true },
      { id: 3, size: 8, left: 17, duration: 11, delay: -5, swayDuration: 3.8, swayDistance: 12, opacity: 0.55, hasGlint: false },
      { id: 4, size: 38, left: 24, duration: 22, delay: -14, swayDuration: 7.1, swayDistance: 32, opacity: 0.9, hasGlint: true },
      { id: 5, size: 12, left: 29, duration: 14, delay: -1, swayDuration: 4.2, swayDistance: 18, opacity: 0.65, hasGlint: false },
      { id: 6, size: 20, left: 35, duration: 16, delay: -11, swayDuration: 5.4, swayDistance: 22, opacity: 0.75, hasGlint: true },
      { id: 7, size: 48, left: 42, duration: 25, delay: -7, swayDuration: 8.0, swayDistance: 36, opacity: 0.95, hasGlint: true },
      { id: 8, size: 9, left: 47, duration: 10, delay: -3, swayDuration: 3.5, swayDistance: 14, opacity: 0.6, hasGlint: false },
      { id: 9, size: 24, left: 53, duration: 17, delay: -15, swayDuration: 5.8, swayDistance: 24, opacity: 0.8, hasGlint: true },
      { id: 10, size: 16, left: 59, duration: 15, delay: -8, swayDuration: 4.8, swayDistance: 20, opacity: 0.7, hasGlint: true },
      { id: 11, size: 34, left: 66, duration: 21, delay: -18, swayDuration: 6.8, swayDistance: 30, opacity: 0.88, hasGlint: true },
      { id: 12, size: 7, left: 72, duration: 12, delay: -4, swayDuration: 3.6, swayDistance: 10, opacity: 0.5, hasGlint: false },
      { id: 13, size: 22, left: 78, duration: 16, delay: -12, swayDuration: 5.2, swayDistance: 22, opacity: 0.78, hasGlint: true },
      { id: 14, size: 44, left: 84, duration: 24, delay: -6, swayDuration: 7.6, swayDistance: 34, opacity: 0.92, hasGlint: true },
      { id: 15, size: 10, left: 90, duration: 13, delay: -10, swayDuration: 4.0, swayDistance: 15, opacity: 0.6, hasGlint: false },
      { id: 16, size: 30, left: 95, duration: 19, delay: -16, swayDuration: 6.5, swayDistance: 26, opacity: 0.82, hasGlint: true },
      // Secondary depth layer (micro effervescence)
      { id: 17, size: 6, left: 8, duration: 9, delay: -6, swayDuration: 3.2, swayDistance: 8, opacity: 0.45, hasGlint: false },
      { id: 18, size: 18, left: 21, duration: 15, delay: -13, swayDuration: 5.0, swayDistance: 18, opacity: 0.7, hasGlint: true },
      { id: 19, size: 11, left: 39, duration: 12, delay: -7, swayDuration: 4.1, swayDistance: 14, opacity: 0.58, hasGlint: false },
      { id: 20, size: 26, left: 49, duration: 20, delay: -17, swayDuration: 6.0, swayDistance: 25, opacity: 0.8, hasGlint: true },
      { id: 21, size: 15, left: 63, duration: 14, delay: -2, swayDuration: 4.6, swayDistance: 16, opacity: 0.65, hasGlint: true },
      { id: 22, size: 8, left: 75, duration: 11, delay: -9, swayDuration: 3.7, swayDistance: 12, opacity: 0.5, hasGlint: false },
      { id: 23, size: 36, left: 81, duration: 23, delay: -21, swayDuration: 7.4, swayDistance: 30, opacity: 0.85, hasGlint: true },
      { id: 24, size: 13, left: 92, duration: 13, delay: -8, swayDuration: 4.3, swayDistance: 16, opacity: 0.62, hasGlint: false },
    ];
    return bubbleDefs;
  }, []);

  const handlePop = (id: number) => {
    setPoppedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Respawn the bubble after 2.5 seconds
    setTimeout(() => {
      setPoppedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Fluid Ambient Deep-Water Glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/12 blur-[120px] animate-fluid-pulse" />
      <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-sky-400/10 dark:bg-sky-500/14 blur-[130px] animate-fluid-pulse-delayed" />
      <div className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] rounded-full bg-teal-400/8 dark:bg-teal-500/10 blur-[140px] animate-fluid-pulse" />

      {/* 2. Delicate Sub-surface Water Caustic Wave Grid */}
      <div className="absolute inset-0 bg-water-grid opacity-30 dark:opacity-15" />

      {/* 3. Dynamic Interactive Water Bubbles Grid */}
      <div className="absolute inset-0">
        {bubbles.map((b) => {
          const isPopped = poppedIds.has(b.id);
          return (
            <div
              key={b.id}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${b.left}%`,
                bottom: '-60px',
                width: `${b.size}px`,
                height: `${b.size}px`,
                animation: `waterBubbleFloat ${b.duration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${b.delay}s`,
              }}
              onClick={() => handlePop(b.id)}
              onMouseEnter={() => handlePop(b.id)}
              title="AquaPure Water Bubble"
            >
              {/* Horizontal sway wrapper for organic sine drift */}
              <div
                className="w-full h-full"
                style={{
                  animation: `waterBubbleSway ${b.swayDuration}s ease-in-out infinite alternate`,
                }}
              >
                <div
                  className={`w-full h-full rounded-full transition-all duration-300 relative ${
                    isPopped
                      ? 'scale-150 opacity-0 transition-transform duration-200'
                      : 'hover:scale-125'
                  }`}
                  style={{
                    opacity: isPopped ? 0 : b.opacity,
                    background:
                      'radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.95) 0%, rgba(224, 242, 254, 0.45) 25%, rgba(56, 189, 248, 0.18) 58%, rgba(14, 165, 233, 0.08) 100%)',
                    border: '1px solid rgba(186, 230, 253, 0.55)',
                    boxShadow:
                      'inset -2px -2px 6px rgba(14, 165, 233, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.7), 0 0 14px rgba(56, 189, 248, 0.28)',
                    backdropFilter: 'blur(1.5px)',
                    WebkitBackdropFilter: 'blur(1.5px)',
                  }}
                >
                  {/* Specular White Highlight Glint */}
                  {b.hasGlint && (
                    <span
                      className="absolute top-[18%] left-[22%] rounded-full bg-white opacity-90"
                      style={{
                        width: `${Math.max(2, Math.round(b.size * 0.22))}px`,
                        height: `${Math.max(2, Math.round(b.size * 0.22))}px`,
                        boxShadow: '0 0 4px rgba(255, 255, 255, 0.9)',
                      }}
                    />
                  )}

                  {/* Secondary subtle rim refraction reflection */}
                  {b.size >= 24 && (
                    <span
                      className="absolute bottom-[20%] right-[22%] rounded-full bg-sky-200/50 opacity-60"
                      style={{
                        width: `${Math.max(2, Math.round(b.size * 0.14))}px`,
                        height: `${Math.max(2, Math.round(b.size * 0.14))}px`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
