import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-gray-400 text-sm mb-6">
              حدث خطأ أثناء تحميل هذه الصفحة. يرجى محاولة إعادة تحديث الصفحة.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
            >
              <FiRefreshCw className="w-4 h-4" />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
