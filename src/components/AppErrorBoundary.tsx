import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[TradeEase] React startup/render error:', error, info.componentStack);
  }

  private reload = () => window.location.reload();

  private clearAppStateAndReload = () => {
    try {
      localStorage.removeItem('tradeease_token');
      localStorage.removeItem('tradeease_admin_token');
      localStorage.removeItem('tradeease_user_location');
      localStorage.removeItem('tradeease_onboarding_seen');
    } catch {
      // Storage can be unavailable in restricted browser modes.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100dvh', background: '#07130d', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ margin: '0 0 10px', fontSize: 24 }}>TradeEase could not open</h1>
          <p style={{ margin: '0 auto 18px', color: '#cbd5e1', lineHeight: 1.55 }}>
            The app encountered an unexpected error while loading. Refreshing usually fixes a temporary browser or deployment issue.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={this.reload} style={{ border: 0, borderRadius: 10, padding: '12px 18px', fontWeight: 700, cursor: 'pointer', background: '#b7f34a', color: '#07130d' }}>
              Reload TradeEase
            </button>
            <button onClick={this.clearAppStateAndReload} style={{ border: '1px solid #475569', borderRadius: 10, padding: '12px 18px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#f8fafc' }}>
              Reset local app data
            </button>
          </div>
          {this.state.message && (
            <details style={{ marginTop: 18, textAlign: 'left', color: '#94a3b8', fontSize: 12 }}>
              <summary>Technical detail</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{this.state.message}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
