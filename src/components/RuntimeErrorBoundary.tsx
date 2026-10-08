import React from 'react';

interface Props { children: React.ReactNode; appName?: string }
interface State { hasError: boolean; message: string; stack: string; componentStack: string }

/** Prevents render-time failures from becoming an unexplained blank page and preserves diagnostics. */
export default class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '', stack: '', componentStack: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
      stack: error?.stack || '',
      componentStack: '',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[TradeEase runtime error]', {
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
    this.setState({ componentStack: info?.componentStack || '' });
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    const appName = this.props.appName || 'TradeEase';
    const details = [this.state.stack, this.state.componentStack].filter(Boolean).join('\n\nReact component stack:\n');
    return (
      <div className="min-h-screen w-full bg-[#020d0b] text-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-2xl rounded-2xl border border-[#95C93D]/20 bg-[#001714] p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300 text-xl">!</div>
          <h1 className="text-center text-lg font-extrabold">{appName} could not load</h1>
          <p className="mt-2 text-center text-sm text-gray-300">A frontend error stopped this screen from rendering. The details below identify the failing JavaScript call.</p>
          <p className="mt-3 break-words rounded-lg bg-black/30 p-3 text-left text-sm text-red-300">{this.state.message}</p>
          <details open className="mt-3 rounded-lg bg-black/30 p-3">
            <summary className="cursor-pointer text-sm font-bold">Technical details for diagnosis</summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-left text-[11px] text-gray-300">{details || 'No stack trace was provided by this browser.'}</pre>
          </details>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button onClick={this.handleReload} className="w-full rounded-xl bg-[#95C93D] py-3 text-sm font-extrabold text-[#003D36]">Reload TradeEase</button>
            <button onClick={() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} window.location.reload(); }} className="w-full rounded-xl border border-white/20 py-3 text-sm font-bold text-white">Clear local app state & reload</button>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">Clearing local state removes saved app preferences and local session data on this device; it does not delete your TradeEase account or server data.</p>
        </div>
      </div>
    );
  }
}
