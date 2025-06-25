import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VividPlate Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "2rem", maxWidth: "400px" }}>
            <h1 style={{ color: "#f59e0b", fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>VividPlate</h1>
            <p className="text-gray-600 mb-4">Loading application...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}