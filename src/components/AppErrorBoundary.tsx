import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// 描画中の例外で画面が真っ白のまま止まらないよう、少し待ってから読み込み直す
const RELOAD_DELAY_MS = 5_000;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
    setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-gray-400 select-none">
          <p className="text-xl">エラーが発生しました</p>
          <p className="text-sm mt-2 text-gray-600">数秒後に自動で再起動します</p>
        </div>
      );
    }
    return this.props.children;
  }
}
