import { useEffect, useState } from 'react';

// 画面を開いた時点のストレージ使用量。開き直すたびに測り直す
export function useStorageEstimate(): StorageEstimate | null {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.storage?.estimate?.()
      .then(result => {
        if (!cancelled) setEstimate(result);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  return estimate;
}
