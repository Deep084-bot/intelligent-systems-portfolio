import React, { useEffect, useState } from 'react';

const BOOT_PHASES = [
  { label: 'runtime kernel', detail: 'loading core modules' },
  { label: 'project registry', detail: 'mounting file system' },
  { label: 'backend services', detail: 'initializing api layer' },
  { label: 'telemetry streams', detail: 'connecting data sources' },
  { label: 'boot sequence', detail: 'finalizing system' },
];

const PHASE_DURATION = 300;
const COMPLETION_PAUSE = 500;
const FADE_OUT_DURATION = 500;

export default function LoadingScreen({ onFinish }) {
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts = [];

    const scheduleTimeout = (callback, delay) => {
      if (cancelled) return;
      const id = setTimeout(() => {
        if (!cancelled) callback();
      }, delay);
      timeouts.push(id);
      return id;
    };

    async function runBootSequence() {
      try {
        // Phase 1: Runtime kernel
        if (!cancelled) {
          setPhaseIndex(0);
          await new Promise(r => scheduleTimeout(r, PHASE_DURATION));
        }

        // Phase 2: Project registry
        if (!cancelled) {
          setPhaseIndex(1);
          await new Promise(r => scheduleTimeout(r, PHASE_DURATION));
        }

        // Phase 3: Backend services
        if (!cancelled) {
          setPhaseIndex(2);
          await new Promise(r => scheduleTimeout(r, PHASE_DURATION));
        }

        // Phase 4: Telemetry streams
        if (!cancelled) {
          setPhaseIndex(3);
          await new Promise(r => scheduleTimeout(r, PHASE_DURATION));
        }

        // Phase 5: Boot sequence complete
        if (!cancelled) {
          setPhaseIndex(4);
          await new Promise(r => scheduleTimeout(r, COMPLETION_PAUSE));
        }

        // Fade out transition
        if (!cancelled) {
          setLeaving(true);
          await new Promise(r => scheduleTimeout(r, FADE_OUT_DURATION));
        }

        // Complete boot
        if (!cancelled && typeof onFinish === 'function') {
          onFinish();
        }
      } catch (error) {
        console.error('[LoadingScreen] Boot sequence error:', error);
        if (!cancelled && typeof onFinish === 'function') {
          onFinish();
        }
      }
    }

    runBootSequence();

    return () => {
      cancelled = true;
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [onFinish]);

  const progress = (phaseIndex + 1) / BOOT_PHASES.length;

  return (
    <div
      className={`w-full h-full fixed inset-0 z-[1000] flex items-center justify-center bg-neutral-950 transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main container */}
      <div className="relative w-[min(680px,92%)] p-8 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl">
        {/* Title */}
        <div className="mb-8">
          <div className="text-accent-400 font-mono text-xs uppercase tracking-wider mb-2">
            [portfolio.boot]
          </div>
          <div className="text-neutral-600 font-mono text-xs">
            initializing engineering portfolio system
          </div>
        </div>

        {/* Boot phases */}
        <div className="space-y-2 mb-8 font-mono text-sm">
          {BOOT_PHASES.map((phase, idx) => {
            const isActive = idx === phaseIndex;
            const isComplete = idx < phaseIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 transition-all duration-300 ${
                  isComplete
                    ? 'opacity-60 text-green-400'
                    : isActive
                      ? 'opacity-100 text-cyan-400'
                      : 'opacity-30 text-neutral-600'
                }`}
              >
                <div className="mt-0.5 w-5 flex-shrink-0">
                  {isComplete ? (
                    <span className="text-green-400">✓</span>
                  ) : isActive ? (
                    <span className="inline-block animate-pulse">→</span>
                  ) : (
                    <span>○</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{phase.label}</div>
                  <div className={`text-xs ${isActive ? 'text-cyan-400/70' : isComplete ? 'text-green-400/60' : 'text-neutral-600/50'}`}>
                    {isActive ? phase.detail : phase.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-primary-400 to-accent-400 transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Status text */}
        <div className="mt-4 text-xs text-neutral-600 font-mono">
          {phaseIndex < BOOT_PHASES.length
            ? `phase ${phaseIndex + 1}/${BOOT_PHASES.length}`
            : 'boot complete'}
        </div>
      </div>
    </div>
  );
}
