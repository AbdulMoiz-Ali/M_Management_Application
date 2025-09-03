import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const BlockedPage = ({ onRetry }) => {
    const { user } = useAuth();
    // localStorage se initial values load karo
    const [retryCount, setRetryCount] = useState(() => {
        const saved = localStorage.getItem('blockPageRetryCount');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [showDialog, setShowDialog] = useState(false);

    const [isBlocked, setIsBlocked] = useState(() => {
        const saved = localStorage.getItem('blockPageIsBlocked');
        return saved === 'true';
    });

    // localStorage ko update karo jab bhi state change ho
    useEffect(() => {
        localStorage.setItem('blockPageRetryCount', retryCount.toString());
    }, [retryCount]);

    useEffect(() => {
        localStorage.setItem('blockPageIsBlocked', isBlocked.toString());
    }, [isBlocked]);

    const handleRetryClick = () => {
        if (isBlocked) return;

        const newCount = retryCount + 1;
        setRetryCount(newCount);

        if (newCount >= 5) {
            setShowDialog(true);
            setIsBlocked(true);
        } else {
            // Call the original onRetry function
            if (onRetry) onRetry();
        }
    };

    const closeDialog = () => {
        setShowDialog(false);
    };

    useEffect(() => {
        if (user && user?.isAccessGranted) {
            setRetryCount(0);
            setIsBlocked(false);
            setShowDialog(false);
            localStorage.removeItem('blockPageRetryCount');
            localStorage.removeItem('blockPageIsBlocked');
        }
    }, [user])


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Access Blocked
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your device has been blocked from accessing this software.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleRetryClick}
                        disabled={isBlocked}
                        className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${isBlocked
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        {isBlocked ? 'Retry Disabled' : 'Retry License Check'}
                    </button>
                    <button
                        onClick={() => { isBlocked ? setShowDialog(true) : window.location.reload() }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Reload Application
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Contact support if you believe this is an error.
                    </p>

                    {retryCount > 0 && !isBlocked && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Attempts: {retryCount}/5
                        </p>
                    )}
                </div>
            </div>

            {/* Dialog Modal */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="text-center">
                            <div className="mb-4">
                                <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Access Denied
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Please contact the owner for access permissions. Multiple retry attempts have been blocked.
                            </p>
                            <button
                                onClick={closeDialog}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-2"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockedPage;