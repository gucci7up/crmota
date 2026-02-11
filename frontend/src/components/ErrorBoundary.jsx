import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white min-h-screen text-slate-900">
          <h1 className="text-3xl font-bold text-rose-600 mb-4">Algo salió mal.</h1>
          <div className="bg-slate-100 p-6 rounded-2xl overflow-auto font-mono text-sm max-w-4xl border border-slate-200 shadow-inner">
            <p className="font-bold mb-2 text-slate-700">{this.state.error && this.state.error.toString()}</p>
            <pre className="text-slate-500 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
