import { IS_DEMO } from '../env';

interface Props {
  onStart: () => void;
}

export function LaunchScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white select-none">
      <p className="text-gray-500 text-sm mb-3 tracking-widest uppercase">Gym Video Scheduler</p>
      <h1 className="text-4xl font-bold mb-12 text-gray-100">ジム動画スケジューラー</h1>
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xl font-semibold px-12 py-5 rounded-xl transition-colors shadow-lg"
      >
        ▶ 全画面で開始
      </button>
      {IS_DEMO && (
        <p className="mt-10 max-w-lg px-6 text-center text-sm leading-relaxed text-gray-400">
          デモ版です。開始すると CM 素材のスライドショーが流れ、約1分後にサンプル動画が自動再生されます（音が出ます）。
          右下の「⚙ 設定」から、予約・CM 素材・再生履歴の画面を見られます。
        </p>
      )}
    </div>
  );
}
