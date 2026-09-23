import { useCallback, useState } from 'react';
import { CONFIG_LIMITS } from '../../types';
import type { AppConfig } from '../../types';
import { clampConfigValue } from '../../lib/config';
import { BackupSection } from './BackupSection';
import { StorageSection } from './StorageSection';

interface Props {
  config: AppConfig;
  onUpdateConfig: (partial: Partial<AppConfig>) => void;
}

export function ConfigTab({ config, onUpdateConfig }: Props) {
  // 入力中は文字列のまま持ち（null = 編集していない）、確定（フォーカスが外れる・Enter）時に範囲内へ丸めて保存する。
  // 1文字ずつ保存すると、空欄の瞬間に 0 秒が保存されてスライドショーが暴走する
  const [intervalDraft, setIntervalDraft] = useState<string | null>(null);
  const intervalValue = intervalDraft ?? String(config.slideIntervalSec);

  const commitInterval = useCallback(() => {
    if (intervalDraft === null) return;
    onUpdateConfig({ slideIntervalSec: clampConfigValue('slideIntervalSec', intervalDraft) });
    setIntervalDraft(null);
  }, [intervalDraft, onUpdateConfig]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">スライドショー設定</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 w-36">切替間隔（秒）</label>
          <input
            type="number"
            min={CONFIG_LIMITS.slideIntervalSec.min}
            max={CONFIG_LIMITS.slideIntervalSec.max}
            value={intervalValue}
            onChange={e => setIntervalDraft(e.target.value)}
            onBlur={commitInterval}
            onKeyDown={e => { if (e.key === 'Enter') commitInterval(); }}
            className="input-dark w-24"
          />
        </div>
      </div>

      <BackupSection />
      <StorageSection />
    </div>
  );
}
