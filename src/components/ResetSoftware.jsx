import React, { useEffect, useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Shield, Database, FileX, Settings, CheckCircle } from 'lucide-react';
import LoadingDemo from './LoadingDemo';
import { useAuth } from '../hooks/useAuth';


// Simple Reset Button Component
const SimpleResetButton = ({ onReset, isLoading }) => {
    return (
        <button
            onClick={onReset}
            disabled={isLoading}
            className="inline-flex absolute top-10 right-10 items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200 space-x-2"
        >
            <Trash2 className="h-4 w-4" />
            <span>{isLoading ? 'Resetting...' : 'Reset Software'}</span>
        </button>
    );
};

// Full Page Reset Component
const FullPageReset = ({ onReset, isLoading }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Database className="h-6 w-6 text-red-500" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Software Data</h2>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                                Warning: Data Loss
                            </h4>
                            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                <p>• All application data will be permanently deleted</p>
                                <p>• This action cannot be undone</p>
                                <p>• Make sure to backup important data first</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                What Gets Reset
                            </h4>
                            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <p>• All data and tasks</p>
                                <p>• Product database</p>
                                <p>• Customer records</p>
                                <p>• Invoice history</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Data Files to be Reset:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { name: 'Analysis', icon: FileX, description: 'Tasks and Analysis' },
                        { name: 'Products', icon: Database, description: 'Product inventory' },
                        { name: 'Customers', icon: Database, description: 'Customer database' },
                        { name: 'Invoices', icon: FileX, description: 'Invoice records' },
                    ].map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <file.icon className="h-4 w-4 text-gray-500" />
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{file.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onReset}
                    disabled={isLoading}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 text-lg font-medium"
                >
                    <Trash2 className="h-5 w-5" />
                    <span>{isLoading ? 'Resetting Software...' : 'Reset All Data'}</span>
                </button>
            </div>
        </div>
    );
};

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center flex-col justify-center items-center gap-2 mb-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                            Confirm Software Reset
                        </h3>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                        Are you sure you want to reset your software? This will permanently delete:
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-3">
                        This action cannot be undone!
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>{isLoading ? 'Resetting...' : 'Yes, Reset'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success Dialog Component
const SuccessDialog = ({ isOpen, onClose, autoShow = false }) => {

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Reset Successful
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Your software has been reset successfully. All data has been cleared and the application is ready for fresh use.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Reset Software Component
const ResetSoftware = ({ showFullPage = true, isLoading: externalLoading = false, showLoading, hideLoading, showSuccessDialog, hideSuccessDialog, showSuccessDialogState, }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);
    const [showFullPageView, setShowFullPageView] = useState(showFullPage);
    const { resetsoftware, closeApp } = useAuth();

    const isLoading = externalLoading || internalLoading;

    // Mock function to simulate data reset - Replace with your actual Electron IPC calls
    const handleDataReset = async () => {
        // Show global loading screen
        if (showLoading) {
            showLoading("Check Your License Verification");
        }
        setInternalLoading(true);
        setShowConfirmDialog(false);

        try {
            const result = await resetsoftware()
            // console.log(result)
            if (result) {
                setTimeout(() => {
                    setInternalLoading(false);

                    if (hideLoading) {
                        hideLoading();
                    }

                    if (showSuccessDialog) {
                        showSuccessDialog("Your software has been reset successfully!");
                    }
                }, 3000);
            }
        } catch (error) {
            setInternalLoading(false);

            // Error par bhi loading hide karo
            if (hideLoading) {
                hideLoading();
            }

            // console.error('Reset failed:', error);
        }
    };

    const handleResetClick = () => {
        setShowConfirmDialog(true);
    };

    const handleSuccessClose = async () => {
        if (hideSuccessDialog) {
            hideSuccessDialog();
        }
        if (showFullPageView) {
            setShowFullPageView(false);
        }
        try {
            const result = await closeApp()
        } catch (error) {
            // console.error('Reset failed:', error);
        }
    };

    if (showFullPageView) {
        return (
            <>
                <FullPageReset
                    onReset={handleResetClick}
                    isLoading={isLoading}
                />
                <ConfirmationDialog
                    isOpen={showConfirmDialog}
                    onClose={() => setShowConfirmDialog(false)}
                    onConfirm={handleDataReset}
                    isLoading={isLoading}
                />
                <SuccessDialog
                    isOpen={showSuccessDialogState}
                    onClose={handleSuccessClose}
                    autoShow={true}
                />
            </>
        );
    }

    return (
        <>
            <div>
                <SimpleResetButton onReset={handleResetClick} isLoading={isLoading} />
            </div>

            <ConfirmationDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleDataReset}
                isLoading={isLoading}
            />
            <SuccessDialog
                isOpen={showSuccessDialogState}
                onClose={handleSuccessClose}
                autoShow={true}
            />
        </>
    );
};

export default ResetSoftware;