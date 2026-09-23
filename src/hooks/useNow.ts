import { useEffect, useState } from 'react';

// 一定間隔で更新される現在時刻（「次の予約」の表示を古くしないため）
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
