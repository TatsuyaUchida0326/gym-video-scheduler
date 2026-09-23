import { useState, useEffect } from 'react';
import type { Poster } from '../types';
import { useBlobUrls } from '../hooks/useBlobUrls';

interface Props {
  posters: Poster[];
  slideIntervalSec: number;
  fadeSec: number;
  onOpenSettings: () => void;
}

export function SlideshowScreen({ posters, slideIntervalSec, fadeSec, onOpenSettings }: Props) {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const urls = useBlobUrls(posters);

  useEffect(() => {
    if (posters.length <= 1) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setOpacity(0);
      timeoutId = setTimeout(() => {
        setDisplayedIndex(prev => (prev + 1) % posters.length);
        setOpacity(1);
      }, fadeSec * 1000);
    }, slideIntervalSec * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [posters.length, slideIntervalSec, fadeSec]);

  // ポスターが減って添字が範囲外になっても effect で戻さず、その場で範囲内に折り返す
  const currentPoster = posters.length > 0 ? posters[displayedIndex % posters.length] : undefined;
  const currentUrl = currentPoster ? urls[currentPoster.imageKey] : undefined;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {posters.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full h-full text-center text-gray-600 select-none">
          <div className="text-7xl mb-6">🏋️</div>
          <p className="text-3xl font-light text-gray-500">準備中</p>
          <p className="text-sm mt-3 text-gray-700">設定画面からCM素材を登録してください</p>
        </div>
      ) : currentUrl ? (
        <div
          className="relative w-full h-full"
          style={{
            opacity,
            transition: `opacity ${fadeSec}s ease-in-out`,
          }}
        >
          {/* ぼかし背景：同じ画像を拡大・ぼかして黒帯を埋める */}
          <img
            src={currentUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(24px) brightness(0.5)',
              transform: 'scale(1.1)',
            }}
          />
          {/* 前面：元画像を全体表示（切れなし） */}
          <img
            src={currentUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-700 text-sm">
          読み込み中...
        </div>
      )}

      <button onClick={onOpenSettings} className="btn-overlay" title="設定">
        ⚙ 設定
      </button>
    </div>
  );
}
