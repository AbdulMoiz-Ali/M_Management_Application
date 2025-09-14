
import React, { useState } from 'react';
import { X, Download, Clock, ExternalLink } from 'lucide-react';

const UpdateNotificationModal = ({ isOpen, onClose, updateInfo, onUpdate, onLater }) => {
    if (!isOpen || !updateInfo) return null;

    return (
        <div className="flex items-center justify-center min-h-screen h-full pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={onLater}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Update Available
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Version {updateInfo.version} is ready to install
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onLater}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            What's New in v{updateInfo.version}
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            {updateInfo.releaseNotes ? (
                                <p>{updateInfo.releaseNotes}</p>
                            ) : (
                                <div>
                                    <p>• Bug fixes and performance improvements</p>
                                    <p>• Enhanced user interface</p>
                                    <p>• New features and optimizations</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Current version: v{updateInfo.currentVersion}</span>
                        <span>New version: v{updateInfo.version}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={onLater}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Later</span>
                        </div>
                    </button>
                    <button
                        onClick={onUpdate}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <ExternalLink className="w-4 h-4" />
                            <span>Update Now</span>
                        </div>
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    Updates help keep your software secure and running smoothly
                </p>
            </div>
        </div>
    );
};

export default UpdateNotificationModal;
