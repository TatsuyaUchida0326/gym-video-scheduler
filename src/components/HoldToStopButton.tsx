import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

// 利用者が画面に触れただけで止まらないよう、押し続けたときだけ停止する
const HOLD_TO_STOP_MS = 1500;

interface Props {
  onStop: () => void;
}

export function HoldToStopButton({ onStop }: Props) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  function startHold() {
    clearTimeout(timerRef.current);
    setHolding(true);
    timerRef.current = setTimeout(onStop, HOLD_TO_STOP_MS);
  }

  function cancelHold() {
    clearTimeout(timerRef.current);
    setHolding(false);
  }

  return (
    <button
      type="button"
      className={`btn-overlay overflow-hidden touch-none ${holding ? 'opacity-100' : ''}`}
      style={{ '--hold-duration': `${HOLD_TO_STOP_MS}ms` } as CSSProperties}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={e => e.preventDefault()}
    >
      {/* 押している間、左から右へ満ちていく */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 bg-white/30 ease-linear ${
          holding ? 'w-full transition-[width] duration-(--hold-duration)' : 'w-0'
        }`}
      />
      <span className="relative">■ 長押しで停止</span>
    </button>
  );
}
