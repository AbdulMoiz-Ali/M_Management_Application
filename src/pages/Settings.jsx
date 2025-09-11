import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Lock,
    Eye,
    EyeOff,
    Save,
    AlertCircle,
    CheckCircle,
    Shield,
    LogOut,
    Moon,
    Sun,
    Monitor,
    BadgeInfo,
    FolderSync
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BasicForm from '../components/BasicForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import ResetSoftware from '../components/ResetSoftware';
import LoadingDemo from '../components/LoadingDemo';
import { useUpdate } from '../hooks/useUpdate';

const Settings = () => {
    const { user, changePassword, changeUseremail, logout, basicInformation } = useAuth?.();
    const [activeTab, setActiveTab] = useState('account');
    const [isEmail, setEmail] = useState({
        newemail: '',
        newpassword: '',
        showNewPassword: false
    })

    const {
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        updateInfo,
        isChecking,
        isDownloading,
        downloadProgress,
        error,
        clearError,
        currentVersion
    } = useUpdate();

    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Loading functions to pass to child
    const showLoading = () => {
        setIsGlobalLoading(true);
    };

    const hideLoading = () => {
        setIsGlobalLoading(false);
    };

    // Success dialog functions
    const showSuccessDialogFunc = () => {
        setShowSuccessDialog(true);
    };

    const hideSuccessDialog = () => {
        setShowSuccessDialog(false);
    };


    const [isEmailText, setEmailText] = useState()

    const [isBasicInformation, setBasicInformation] = useState({
        martName: '',
        shopAddress: '',
    })

    // Account settings state
    useEffect(() => {
        setEmailText(user?.email)
    }, [user]);

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
        pin: '',
        showNewPassword: false,
        showConfirmPassword: false
    });

    const [messages, setMessages] = useState({
        username: { type: '', text: '' },
        password: { type: '', text: '' },
        email: { type: '', text: '' },
        basicInformation: { type: '', text: '' },
    });

    const [loading, setLoading] = useState({
        username: false,
        password: false,
        email: false,
        basicInformation: false
    });

    // Theme settings
    const [theme, setTheme] = useState(() => {
        return localStorage?.getItem('app-theme') || 'system';
    });

    // Clear messages after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages({
                username: { type: '', text: '' },
                password: { type: '', text: '' }
            });
        }, 5000);
        return () => clearTimeout(timer);
    }, [messages]);

    const handleEmailChange = async (e) => {
        e?.preventDefault();
        setLoading(prev => ({ ...prev, email: true }));
        try {
            const result = await changeUseremail?.({ email: isEmail?.newemail, password: isEmail?.newpassword });

            if (result?.success) {
                setMessages(prev => ({
                    ...prev,
                    email: { type: 'success', text: result?.message }
                }));
                setEmailText(isEmail?.newemail)
                setEmail({
                    newemail: '',
                    newpassword: '',
                    showNewPassword: false
                })
            } else {
                setMessages(prev => ({
                    ...prev,
                    email: { type: 'error', text: result?.error }
                }));
            }
        } catch (error) {
            setMessages(prev => ({
                ...prev,
                email: { type: 'error', text: error?.message }
            }));
        } finally {
            setLoading(prev => ({ ...prev, email: false }));
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage?.setItem('app-theme', newTheme);

        // Apply theme immediately
        if (newTheme === 'dark') {
            document?.documentElement?.classList?.add('dark');
        } else if (newTheme === 'light') {
            document?.documentElement?.classList?.remove('dark');
        } else {
            // System theme
            const systemDark = window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
            if (systemDark) {
                document?.documentElement?.classList?.add('dark');
            } else {
                document?.documentElement?.classList?.remove('dark');
            }
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'basicInf', label: 'Basic Information', icon: BadgeInfo },
        { id: 'resetsoftware', label: 'Reset Software', icon: FolderSync },
        { id: 'updatesoftware', label: 'Update Software', icon: FolderSync }
    ];

    const getInitials = (name) => {
        if (!name) return '';
        const words = name?.trim()?.split(' ')?.filter(Boolean);

        if (words?.length === 1) {
            return words[0]?.[0]?.toUpperCase();
        } else {
            return (words[0]?.[0] + words[1]?.[0])?.toUpperCase();
        }
    };

    const MessageAlert = ({ message, type }) => {
        if (!message) return null;

        return (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                }`}>
                {type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <p className={`text-sm ${type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                    {message}
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {isGlobalLoading && (
                <div className="fixed inset-0 z-50">
                    <LoadingDemo
                        message={"Please Wait - Clearing All Data..."}
                        showBackground={true}
                    />
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                            {getInitials(user?.username)}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user?.username || 'User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {user?.username || 'Standard User'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isEmailText}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6">
                        {tabs?.map((tab) => {
                            const Icon = tab?.icon;
                            return (
                                <button
                                    key={tab?.id}
                                    onClick={() => setActiveTab(tab?.id)}
                                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab?.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab?.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-8">
                            <PasswordChangeForm />
                            {/* Change Username */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Email</h3>
                                <MessageAlert message={messages?.email?.text} type={messages?.email?.type} />

                                <form onSubmit={handleEmailChange} className="space-y-4">
                                    <div>
                                        <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            New Email Address
                                        </label>
                                        <input
                                            id="newEmail"
                                            type="email"
                                            value={isEmail?.newemail}
                                            onChange={(e) => setEmail(prev => ({ ...prev, newemail: e?.target?.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter new email address"
                                            required
                                            pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={isEmail?.showNewPassword ? "text" : "password"}
                                                value={isEmail?.newpassword}
                                                onChange={(e) => setEmail(prev => ({ ...prev, newpassword: e?.target?.value }))}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="New password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEmail(prev => ({ ...prev, showNewPassword: !prev?.showNewPassword }))}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {isEmail?.showNewPassword ? (
                                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading?.email}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${loading?.email
                                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                                } text-white`}
                                        >
                                            {loading?.email ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Updating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    <span>Update Email</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme Preferences</h3>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Choose how the application looks and feels
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Light Theme */}
                                    <div
                                        onClick={() => handleThemeChange('light')}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'light'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                <Sun className="h-6 w-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">Light</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Clean and bright interface
                                                </p>
                                            </div>
                                        </div>
                                        {theme === 'light' && (
                                            <CheckCircle className="h-5 w-5 text-blue-500 mt-2 ml-auto" />
                                        )}
                                    </div>

                                    {/* Dark Theme */}
                                    <div
                                        onClick={() => handleThemeChange('dark')}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'dark'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                <Moon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">Dark</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Easy on the eyes
                                                </p>
                                            </div>
                                        </div>
                                        {theme === 'dark' && (
                                            <CheckCircle className="h-5 w-5 text-blue-500 mt-2 ml-auto" />
                                        )}
                                    </div>

                                    {/* System Theme */}
                                    <div
                                        onClick={() => handleThemeChange('system')}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'system'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">System</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Follow system preference
                                                </p>
                                            </div>
                                        </div>
                                        {theme === 'system' && (
                                            <CheckCircle className="h-5 w-5 text-blue-500 mt-2 ml-auto" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Information</h3>

                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                            Authentication System
                                        </h4>
                                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                                            <p>• Dual authentication system with admin and user credentials</p>
                                            <p>• PIN protection required for credential changes</p>
                                            <p>• Default admin credentials cannot be modified</p>
                                            <p>• User credentials can be customized through this interface</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current User</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Username:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {user?.username || 'user'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {user?.username || 'Standard User'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Custom Credentials:</span>
                                            <span className={`font-medium ${user?.hasCustomCredentials
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {user?.hasCustomCredentials ? 'Enabled' : 'Using Defaults'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Security Tips</h4>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p>• Use a strong, unique password</p>
                                        <p>• Keep your PIN secure</p>
                                        <p>• Log out when not using the application</p>
                                        <p>• Regularly update your credentials</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                            Important Note
                                        </h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            The default PIN is used for all security operations.
                                            Keep this PIN secure and remember it for credential changes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'basicInf' && (
                        <div className="space-y-6">
                            {/* Change Username */}
                            <BasicForm />
                        </div>
                    )}
                    {activeTab === 'resetsoftware' && (
                        <ResetSoftware
                            showFullPage={true}
                            isLoading={isGlobalLoading}
                            showLoading={showLoading}
                            hideLoading={hideLoading}
                            showSuccessDialog={showSuccessDialogFunc}
                            hideSuccessDialog={hideSuccessDialog}
                            showSuccessDialogState={showSuccessDialog}
                        />
                    )}

                    {activeTab === 'updatesoftware' && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                🔄 Software Updates
                            </h3>

                            <div className="space-y-4">
                                {/* Current Version Display */}
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-600 font-medium">Current Version:</span>
                                    <span className="font-bold text-blue-600 text-lg">
                                        v{currentVersion}
                                    </span>
                                </div>

                                {/* Update Available Info */}
                                {updateInfo && (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <span className="text-green-600 text-xl">✨</span>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-green-800 font-semibold">
                                                    New Version Available: v{updateInfo.version}
                                                </h4>
                                                <p className="text-green-700 text-sm mt-1">
                                                    {updateInfo.releaseNotes || 'New features and improvements available'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="flex">
                                                <span className="text-red-600 text-xl mr-3">⚠️</span>
                                                <div>
                                                    <h4 className="text-red-800 font-semibold">Update Error</h4>
                                                    <p className="text-red-700 text-sm">{error}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={clearError}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Download Progress */}
                                {isDownloading && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                        <div className="flex items-center mb-2">
                                            <span className="text-blue-600 text-xl mr-3">⬇️</span>
                                            <h4 className="text-blue-800 font-semibold">
                                                Downloading Update...
                                            </h4>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${downloadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-blue-700 text-sm">
                                            {Math.round(downloadProgress)}% completed
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    {/* Check for Updates Button */}
                                    <button
                                        onClick={checkForUpdates}
                                        disabled={isChecking || isDownloading}
                                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isChecking || isDownloading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                                            }`}
                                    >
                                        {isChecking ? (
                                            <span className="flex items-center justify-center">
                                                <span className="animate-spin mr-2">🔄</span>
                                                Checking...
                                            </span>
                                        ) : (
                                            '🔍 Check for Updates'
                                        )}
                                    </button>

                                    {/* Download Button */}
                                    {updateInfo && !isDownloading && !updateInfo.downloaded && (
                                        <button
                                            onClick={downloadUpdate}
                                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 hover:shadow-lg transition-all duration-200"
                                        >
                                            ⬇️ Download Update
                                        </button>
                                    )}

                                    {/* Install Button */}
                                    {updateInfo && updateInfo.downloaded && (
                                        <button
                                            onClick={installUpdate}
                                            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 hover:shadow-lg transition-all duration-200 animate-pulse"
                                        >
                                            🚀 Install & Restart
                                        </button>
                                    )}
                                </div>

                                {/* Information Footer */}
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border-t">
                                    <p className="mb-1">
                                        <strong>💡 How it works:</strong> Click "Check for Updates" to manually search for new versions.
                                    </p>
                                    <p>
                                        <strong>🔄 Manual Control:</strong> You decide when to download and install updates.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;