import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import ResetSoftware from './components/ResetSoftware.jsx';
import LoadingDemo from './components/LoadingDemo.jsx';

// Enable React DevTools in development
if (process.env.NODE_ENV === 'development') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
}

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, loading: false, showSuccessDialog: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // console.error('App Error:', error, errorInfo);

    // In an Electron app, you might want to send this to the main process
    if (window.electronAPI && window.electronAPI.logError) {
      window.electronAPI.logError({
        error: error.toString(),
        stack: error.stack,
        errorInfo
      });
    }
  }

  // Method to show loading
  showLoading = () => {
    this.setState({
      isLoading: true,
    });
  }

  // Method to hide loading
  hideLoading = () => {
    this.setState({ isLoading: false });
  }

  // Method to show success dialog
  showSuccessDialog = () => {
    this.setState({
      showSuccessDialog: true,
    });
  }

  // Method to hide success dialog
  hideSuccessDialog = () => {
    this.setState({ showSuccessDialog: false });
  }

  render() {
    const { isLoading, showSuccessDialog } = this.state;
    if (isLoading) {
      return (
        <LoadingDemo message="Please Wait - Clearing All Data..." showBackground={true} />
      );
    }
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <ResetSoftware
              isLoading={isLoading}
              showFullPage={false}
              showLoading={this.showLoading}
              hideLoading={this.hideLoading}
              showSuccessDialog={this.showSuccessDialog}
              hideSuccessDialog={this.hideSuccessDialog}
              showSuccessDialogState={showSuccessDialog}
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The application encountered an unexpected error. Please restart the app.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reload Application
              </button>
              {window.electronAPI && window.electronAPI.restartApp && (
                <button
                  onClick={() => window.electronAPI.restartApp()}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Restart Application
                </button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // console.error('Unhandled promise rejection:', event.reason);

  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError({
      type: 'unhandledRejection',
      error: event.reason?.toString(),
      stack: event.reason?.stack
    });
  }
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  // console.error('Uncaught error:', event.error);

  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError({
      type: 'uncaughtError',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString(),
      stack: event.error?.stack
    });
  }
});

// Service worker registration (if you plan to add PWA features)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        // console.log('SW registration failed: ', registrationError);
      });
  });
}