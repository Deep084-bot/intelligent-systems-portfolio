import React, { useEffect, useState } from 'react';

const BOOT_SEQUENCE = [
  'booting portfolio system...',
  'loading engineering modules...',
  'initializing ai assistant...',
  'warming retrieval pipeline...',
  'syncing project metadata...',
  'system ready.',
];

export default function LoadingScreen({ onFinish }) {
  const [completed, setCompleted] = useState([]);
  const [current, setCurrent] = useState('');
  const [typing, setTyping] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setTyping(true);
      for (let idx = 0; idx < BOOT_SEQUENCE.length; idx++) {
        const full = BOOT_SEQUENCE[idx];
        if (cancelled) return;
        setCurrent('');
        for (let i = 0; i < full.length; i++) {
          if (cancelled) return;
          setCurrent(prev => prev + full[i]);
          await new Promise(r => setTimeout(r, 22 + Math.random() * 28));
        }
        // move to completed lines
        setCompleted(prev => [...prev, full]);
        setCurrent('');
        // small pause between lines
        await new Promise(r => setTimeout(r, 220));
      }

      // welcome message
      setCompleted(prev => [...prev, "Welcome to Deep's interactive terminal"]);
      setTyping(false);

      // brief pause then fade
      await new Promise(r => setTimeout(r, 600));
      setLeaving(true);
      // allow CSS fade duration
      await new Promise(r => setTimeout(r, 520));
      if (!cancelled && typeof onFinish === 'function') onFinish();
    }
    run();
    return () => { cancelled = true; };
  }, [onFinish]);

  // progress ratio for subtle progress bar
  const progress = Math.min(1, (completed.length + (current ? 0.5 : 0)) / BOOT_SEQUENCE.length);

  return (
    <div className={`w-full h-full fixed inset-0 z-[1000] flex items-center justify-center bg-neutral-950 transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-[min(680px,92%)] p-6 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl shadow-primary/5 text-neutral-200">
        <div className="font-mono text-sm leading-relaxed h-48 overflow-hidden bg-neutral-950 p-4 rounded border border-neutral-800/50">
          {completed.map((l, i) => (
            <div key={`c-${i}`} className="mb-1.5 text-sm text-accent-300">{l}</div>
          ))}
          {current ? <div className="mb-1.5 text-sm text-accent-300">{current}<span className="inline-block ml-1 animate-pulse">_</span></div> : null}
        </div>

        <div className="mt-5">
          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
