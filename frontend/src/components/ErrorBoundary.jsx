import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { AskioLogoIcon } from './AskioLogo';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected interface error occurred.'
    };
  }

  componentDidCatch(error, info) {
    console.error('Askio UI ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 text-center">
          <AskioLogoIcon className="w-14 h-14 rounded-2xl shadow-lg mb-5" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Something went wrong</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Askio encountered a display error</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Your saved conversations are safe in browser storage. Reloading will restore your session.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Askio</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
