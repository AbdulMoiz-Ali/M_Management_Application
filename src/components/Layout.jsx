import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Package,
  FileText,
  Settings,
  Bell,
  UserCircle,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import AlertBox from './AlertBox';
import { useAuth } from '../hooks/useAuth';
import Togglecolourmode from './Togglecolourmode';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Set active tab based on current route
  React.useEffect(() => {
    const path = location.pathname.split('/')[1] || '';
    setActiveTab(path);
  }, [location]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Global alert function
  const showAlert = (type, message, duration = 5000) => {
    const alertId = Date.now();
    setAlert({ id: alertId, type, message });

    setTimeout(() => {
      setAlert(prev => prev?.id === alertId ? null : prev);
    }, duration);
  };

  // Handle tab navigation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    showAlert('success', 'Logged out successfully');
  };

  const tabs = [
    { id: '', label: 'Dashboard', icon: TrendingUp },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'purchaseinvoice', label: 'Purchase Invoice', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 dark:bg-gray-800 bg-white border-b dark:border-gray-700 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold dark:text-white text-gray-900">
                {user?.martName ? `${user?.martName} Dashboard` : 'Business Dashboard'}
              </h1>
              <p className="text-sm dark:text-gray-300 text-gray-600">
                {user ? `Welcome back, ${user.username}` : 'Manage your business efficiently'}
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-sm dark:text-gray-300 text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              <Togglecolourmode />

              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 dark:text-white text-gray-800"
                >
                  <UserCircle size={24} />
                  <span className="hidden md:inline-block text-sm font-medium">
                    {user?.username || 'Account'}
                  </span>
                </button>
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 border z-50">
                    <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm w-full text-left dark:text-gray-300 dark:hover:bg-gray-700 text-gray-700 hover:bg-gray-100">
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'dark:border-blue-400 dark:text-blue-400 border-blue-600 text-blue-600'
                  : 'border-transparent dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      {/* <main className="flex-1 dark:bg-gray-900 bg-gray-50"> */}
      <main className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet context={{ showAlert, darkMode }} />
        </div>
      </main>
    </div>
  );
};

{/* <main className={`flex-1 dark:bg-gray-900 bg-gray-50`}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <Outlet context={{ showAlert, darkMode }} />
  </div>
</main> */}
export default Layout;