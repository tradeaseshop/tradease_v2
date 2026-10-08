import React from 'react';

interface Props { children: React.ReactNode; appName?: string }
interface State { hasError: boolean; message: string }

export default class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'An unexpected application error occurred.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[TradeEase runtime error]', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    const appName = this.props.appName || 'TradeEase';
    return (
      <div className="min-h-screen w-full bg-[#020d0b] text-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-[#95C93D]/20 bg-[#001714] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300 text-xl">!</div>
          <h1 className="text-lg font-extrabold">{appName} could not load</h1>
          <p className="mt-2 text-sm text-gray-400">The application encountered an unexpected browser error. Reloading normally resolves a stale or incomplete app bundle.</p>
          <p className="mt-3 break-words rounded-lg bg-black/20 p-3 text-left text-[11px] text-red-300">{this.state.message}</p>
          <button onClick={this.handleReload} className="mt-5 w-full rounded-xl bg-[#95C93D] py-3 text-sm font-extrabold text-[#003D36]">Reload TradeEase</button>
        </div>
      </div>
    );
  }
}
