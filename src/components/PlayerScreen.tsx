import { useCallback, useEffect, useRef } from 'react';
import type { PlaybackOutcome, Schedule } from '../types';
import { getFile } from '../lib/fileStore';
import { HoldToStopButton } from './HoldToStopButton';

interface Props {
  schedule: Schedule;
  onFinish: (outcome: PlaybackOutcome) => void;
}

// 再生がこの時間内に始まらなければ諦めてスライドショーへ戻る（非対応形式・破損ファイル対策）
const START_TIMEOUT_MS = 20_000;
// 動画の残り時間を過ぎてもこの猶予内に ended が来なければ強制的に戻る
const END_MARGIN_MS = 30_000;

// 失敗理由に付けるブラウザのエラー名（原因を調べる手がかり）
function describeError(error: unknown): string {
  return error instanceof Error ? `（${error.name}）` : '';
}

export function PlayerScreen({ schedule, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let finished = false;
    let url: string | null = null;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    // どの経路（正常終了・エラー・タイムアウト）でも必ず 1 回だけ戻る
    const finish = (outcome: PlaybackOutcome) => {
      if (finished) return;
      finished = true;
      onFinishRef.current(outcome);
    };
    const fail = (reason: string) => finish({ status: 'failed', reason });

    const armWatchdog = (ms: number, reason: string) => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => fail(reason), ms);
    };
    // 再生が始まったら開始の見張りは必ず解除する。
    // 長さが分かる動画だけ終了の見張りを付ける（長さ情報の無い webm などは ended とエラーに任せる）
    const handlePlaying = () => {
      clearTimeout(watchdog);
      const remainingSec = video.duration - video.currentTime;
      if (Number.isFinite(remainingSec)) {
        armWatchdog(remainingSec * 1000 + END_MARGIN_MS, '終了予定を過ぎても再生が終わりませんでした');
      }
    };
    const handleEnded = () => finish({ status: 'completed' });
    const handleError = () => fail('再生できない形式か、ファイルが壊れています');

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    armWatchdog(START_TIMEOUT_MS, `${START_TIMEOUT_MS / 1000}秒以内に再生が始まりませんでした`);

    getFile(schedule.videoKey)
      .then(blob => {
        if (finished) return;
        if (!blob) {
          fail('動画ファイルが見つかりません');
          return;
        }
        url = URL.createObjectURL(blob);
        video.src = url;
        return video.play().catch(error => {
          // AbortError は「別の読み込みや停止で中断された」だけで、失敗とは限らない。
          // 本当に再生できないなら error イベントか開始の見張りが拾う
          if (error instanceof DOMException && error.name === 'AbortError') return;
          fail(`再生を開始できませんでした${describeError(error)}`);
        });
      })
      .catch(error => fail(`動画の読み込みに失敗しました${describeError(error)}`));

    return () => {
      finished = true;
      clearTimeout(watchdog);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      // load() で読み込みを打ち切らない。開発時の再実行で、次に始めた再生まで中断してしまう
      video.pause();
      if (url) URL.revokeObjectURL(url);
    };
  }, [schedule.videoKey]);

  const stop = useCallback(() => onFinish({ status: 'stopped' }), [onFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stop]);

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />
      <HoldToStopButton onStop={stop} />
    </div>
  );
}
