import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import Products from './pages/Product';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import BlockedPage from './components/BlockedPage';
import LoadingDemo from './components/LoadingDemo';

function App() {
  const { user, loading, error, licensecheck } = useAuth();
  const [ischeck, setCheck] = useState(true)

  const [hasCheckedLicense, setHasCheckedLicense] = useState(false);
  // Initial license check
  useEffect(() => {
    if (!hasCheckedLicense) {
      const performInitialCheck = async () => {
        try {
          const result = await licensecheck();
          if (result) {
            setCheck(true)
          }
          // console.log("Initial license check completed", result);
        } catch (error) {
          // console.error("Initial license check failed:", error);
        } finally {
          setHasCheckedLicense(true);
          setTimeout(() => {
            setCheck(false)
          }, 5000);
        }
      };
      performInitialCheck();
    } else {
      setHasCheckedLicense(true);
      setTimeout(() => {
        setCheck(false)
      }, 5000);
    }


  }, [hasCheckedLicense]);

  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme');
    const htmlElement = document.querySelector('html');

    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme based on stored preference or system preference
    if (storedTheme === 'dark' || (storedTheme === null && prefersDarkMode)) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, []);

  // Handle retry for blocked page
  const handleRetry = async () => {
    try {
      const result = await licensecheck();
      if (result) {
        setCheck(true)
      }
    } catch (error) {
      // console.error("Initial license check failed:", error);
    } finally {
      setTimeout(() => {
        setCheck(false)
      }, 5000);
    }
  };

  if (loading || ischeck) {
    return (
      <LoadingDemo message={"Cheack Your License Verification"} showBackground={true} />
    );
  }

  // if (!user || !user?.isAuthenticated) {
  //   return <LoginPage />;
  // }

  // Show blocked page if access is denied
  if (user && !user?.isAccessGranted) {  // ← NOT operator lagana zaroori hai!
    return <BlockedPage onRetry={handleRetry} />;
  }


  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Routes>
          <Route
            path="/login"
            element={
              user && user?.isAuthenticated ?
                <Navigate to="/" replace /> :
                <LoginPage />
            }
          />

          {user && user?.isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="products" element={<Products />} />
              <Route path="customers" element={<Customers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
              {/* Catch all route for authenticated users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : (
            // Redirect unauthenticated users to login
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;