import { useEffect } from 'react';

// 操作とみなすイベント。timeupdate は試聴中の動画が流れている間も「操作中」と扱うため
// （メディアのイベントは伝播しないので、document の捕捉フェーズで拾う）
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'timeupdate'] as const;
const CHECK_INTERVAL_MS = 5_000;

interface UseIdleTimeoutOptions {
  enabled: boolean;
  timeoutMs: number;
  onIdle: () => void;
}

// enabled の間、timeoutMs 操作が無ければ onIdle を呼ぶ
export function useIdleTimeout({ enabled, timeoutMs, onIdle }: UseIdleTimeoutOptions) {
  useEffect(() => {
    if (!enabled) return;

    let lastActivityAt = Date.now();
    const markActive = () => {
      lastActivityAt = Date.now();
    };

    for (const type of ACTIVITY_EVENTS) document.addEventListener(type, markActive, true);
    const interval = setInterval(() => {
      if (Date.now() - lastActivityAt >= timeoutMs) onIdle();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      for (const type of ACTIVITY_EVENTS) document.removeEventListener(type, markActive, true);
    };
  }, [enabled, timeoutMs, onIdle]);
}
