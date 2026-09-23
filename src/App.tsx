import { useState, useCallback } from 'react';
import type { AppScreen, PlaybackOutcome, Schedule } from './types';
import { useConfig } from './hooks/useConfig';
import { useSchedules } from './hooks/useSchedules';
import { usePosters } from './hooks/usePosters';
import { usePlaybackLog } from './hooks/usePlaybackLog';
import { useScheduler } from './hooks/useScheduler';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { TRIGGER_GRACE_MINUTES } from './lib/findDueSchedule';
import { LaunchScreen } from './components/LaunchScreen';
import { SlideshowScreen } from './components/SlideshowScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

// Electron は起動時点で全画面かつ自動再生が許可されているので、
// 起動画面のクリック待ちを挟まない（再起動後に誰も押さず予約が止まるのを防ぐ）。
// ブラウザ実行時は全画面化と音声付き自動再生にユーザー操作が要るため起動画面を残す
const IS_ELECTRON = navigator.userAgent.includes('Electron');
const INITIAL_SCREEN: AppScreen = IS_ELECTRON ? 'slideshow' : 'launch';

// 設定画面を操作せずに放置したらスライドショーへ戻る。
// 予約の猶予より短くしておくと、設定画面を開いたまま予約時刻を迎えても戻った直後に再生される
const SETTINGS_IDLE_MS = (TRIGGER_GRACE_MINUTES - 2) * 60_000;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(INITIAL_SCREEN);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  const { config, updateConfig } = useConfig();
  const { schedules, addSchedule, updateSchedule, deleteSchedule, hasDuplicate } = useSchedules();
  const { posters, addPoster, deletePoster } = usePosters();
  const { entries: playbackLog, recordPlayback } = usePlaybackLog();

  const handleScheduleTrigger = useCallback((schedule: Schedule) => {
    setActiveSchedule(schedule);
    setScreen('player');
  }, []);

  useScheduler({
    schedules,
    enabled: screen === 'slideshow',
    onTrigger: handleScheduleTrigger,
  });

  const handleStart = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {});
    setScreen('slideshow');
  }, []);

  // 正常終了・停止・再生失敗のいずれでも履歴に残してスライドショーへ戻る
  const handlePlaybackFinished = useCallback((outcome: PlaybackOutcome) => {
    if (activeSchedule) recordPlayback(activeSchedule, outcome);
    setActiveSchedule(null);
    setScreen('slideshow');
  }, [activeSchedule, recordPlayback]);

  const handleOpenSettings = useCallback(() => setScreen('settings'), []);
  const handleBackToSlideshow = useCallback(() => setScreen('slideshow'), []);

  useIdleTimeout({
    enabled: screen === 'settings',
    timeoutMs: SETTINGS_IDLE_MS,
    onIdle: handleBackToSlideshow,
  });

  return (
    <>
      {screen === 'launch' && <LaunchScreen onStart={handleStart} />}

      {screen === 'slideshow' && (
        <SlideshowScreen
          posters={posters}
          slideIntervalSec={config.slideIntervalSec}
          fadeSec={config.fadeSec}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {screen === 'player' && activeSchedule && (
        <PlayerScreen schedule={activeSchedule} onFinish={handlePlaybackFinished} />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          schedules={schedules}
          posters={posters}
          config={config}
          playbackLog={playbackLog}
          onAddSchedule={addSchedule}
          onUpdateSchedule={updateSchedule}
          onDeleteSchedule={deleteSchedule}
          hasDuplicate={hasDuplicate}
          onAddPoster={addPoster}
          onDeletePoster={deletePoster}
          onUpdateConfig={updateConfig}
          onBack={handleBackToSlideshow}
        />
      )}
    </>
  );
}
