// import { useState, useEffect } from 'react';
// import { updateStorage } from '../services/updateStorage';

// export function useUpdate() {
//     const [updateInfo, setUpdateInfo] = useState(null);
//     const [isChecking, setIsChecking] = useState(false);
//     const [isDownloading, setIsDownloading] = useState(false);
//     const [downloadProgress, setDownloadProgress] = useState(0);
//     const [error, setError] = useState(null);
//     const [isInstalling, setIsInstalling] = useState(false);
//     const [currentVersion, setCurrentVersion] = useState('1.0.1');

//     useEffect(() => {
//         loadCurrentVersion();
//     }, []);

//     const loadCurrentVersion = async () => {
//         try {
//             const version = await updateStorage.getCurrentVersion();
//             setCurrentVersion(version);
//         } catch (err) {
//             console.error('Failed to load version:', err);
//         }
//     };

//     // Manual check for updates
//     const checkForUpdates = async () => {
//         try {
//             setError(null);
//             setIsChecking(true);

//             const result = await updateStorage.checkForUpdates();

//             if (result.success) {
//                 if (result.updateAvailable) {
//                     setUpdateInfo(result.updateInfo);
//                 } else {
//                     setUpdateInfo(null);
//                     setError("You're using the latest version! 🎉");
//                     setTimeout(() => setError(null), 3000);
//                 }
//             } else {
//                 setError(result.error);
//             }
//         } catch (err) {
//             setError('Network error: Unable to check for updates');
//         } finally {
//             setIsChecking(false);
//         }
//     };

//     // Download update
//     const downloadUpdate = async () => {
//         try {
//             setError(null);
//             setIsDownloading(true);
//             setDownloadProgress(0);

//             console.log('⬇️ Starting download...');

//             const result = await updateStorage.downloadUpdate((progress) => {
//                 setDownloadProgress(progress);
//             });

//             if (result.success && result.downloaded) {
//                 console.log('✅ Download completed');
//                 setUpdateInfo(prev => ({ ...prev, downloaded: true }));
//                 setDownloadProgress(100);
//             } else if (result.success) {
//                 console.log('⏳ Download started, waiting for completion...');
//                 // Keep downloading state, wait for events
//             } else {
//                 console.error('❌ Download failed:', result.error);
//                 setError(result.error);
//                 setIsDownloading(false);
//             }
//         } catch (err) {
//             console.error('❌ Download error:', err);
//             setError('Download error: ' + err.message);
//             setIsDownloading(false);
//         }
//     };

//     // Update your installUpdate function:
//     const installUpdate = async () => {
//         setIsInstalling(true);
//         try {
//             setError(null);
//             console.log('🚀 Installing update...');

//             // Show loading state
//             const result = await updateStorage.installUpdate();

//             if (!result.success) {
//                 setError(result.error);
//                 console.error('❌ Install failed:', result.error);
//             } else {
//                 console.log('✅ Install initiated, app should restart...');
//                 // App will restart, no need to handle response
//             }
//         } catch (err) {
//             console.error('❌ Install error:', err);
//             setError('Installation failed: ' + err.message);
//         } finally {
//             // Only reset if still mounted (app didn't restart)
//             setTimeout(() => setIsInstalling(false), 2000);
//         }
//     };

//     // Clear error
//     const clearError = () => {
//         setError(null);
//     };

//     return {
//         checkForUpdates,
//         downloadUpdate,
//         installUpdate,
//         isInstalling,
//         updateInfo,
//         isChecking,
//         isDownloading,
//         downloadProgress,
//         error,
//         clearError,
//         currentVersion
//     };
// }


import { useState, useEffect } from 'react';
import { updateStorage } from '../services/updateStorage';
import { modalTracking } from '../services/ModalTrackingStorage';

export function useUpdate() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isInstalling, setIsInstalling] = useState(false);
    const [error, setError] = useState(null);
    const [currentVersion, setCurrentVersion] = useState('1.0.2');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [hasUpdateNotification, setHasUpdateNotification] = useState(false);

    useEffect(() => {
        loadCurrentVersion();
        // Auto-check for updates on app startup (after 10 seconds)
        const startupCheck = setTimeout(() => {
            silentUpdateCheck();
        }, 10000);

        return () => clearTimeout(startupCheck);
    }, []);

    const loadCurrentVersion = async () => {
        try {
            const version = await updateStorage.getCurrentVersion();
            setCurrentVersion(version);
            // Cleanup old version tracking
            await modalTracking.clearOldVersions(version);
        } catch (err) {
            console.error('Failed to load version:', err);
        }
    };

    // Silent update check with modal tracking
    const silentUpdateCheck = async () => {
        try {
            const result = await updateStorage.checkForUpdates();

            if (result.success && result.updateAvailable) {
                const newVersion = result.updateInfo.version;

                setUpdateInfo({
                    ...result.updateInfo,
                    currentVersion: currentVersion
                });

                // Always show notification badge if update available
                setHasUpdateNotification(true);

                // Check if modal has been shown for this version
                const modalAlreadyShown = await modalTracking.hasModalBeenShown(newVersion);

                if (!modalAlreadyShown) {
                    // Show modal for the first time for this version
                    setTimeout(() => {
                        setShowNotificationModal(true);
                        modalTracking.markModalShown(newVersion);
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Silent update check failed:', err);
        }
    };

    // Manual check for updates
    const checkForUpdates = async () => {
        try {
            setError(null);
            setIsChecking(true);

            const result = await updateStorage.checkForUpdates();

            if (result.success) {
                if (result.updateAvailable) {
                    setUpdateInfo({
                        ...result.updateInfo,
                        currentVersion: currentVersion
                    });
                    setHasUpdateNotification(true);
                } else {
                    setUpdateInfo(null);
                    setHasUpdateNotification(false);
                    setError("You're using the latest version! 🎉");
                    setTimeout(() => setError(null), 3000);
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Network error: Unable to check for updates');
        } finally {
            setIsChecking(false);
        }
    };

    const downloadUpdate = async () => {
        try {
            setError(null);
            setIsDownloading(true);
            setDownloadProgress(0);

            const result = await updateStorage.downloadUpdate((progress) => {
                setDownloadProgress(progress);
            });

            if (result.success) {
                setUpdateInfo(prev => ({ ...prev, downloaded: true }));
                setDownloadProgress(100);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Download error: ' + err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const installUpdate = async () => {
        try {
            setIsInstalling(true);
            const result = await updateStorage.installUpdate();
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Installation failed: ' + err.message);
        } finally {
            setIsInstalling(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    // Handle "Update Now" - dismiss modal and navigate
    const handleUpdateNow = async () => {
        setShowNotificationModal(false);
        setHasUpdateNotification(false);

        // Navigate to settings and auto-download
        window.dispatchEvent(new CustomEvent('navigate-to-update-settings', {
            detail: { autoDownload: true }
        }));
    };

    // Handle "Later" - dismiss modal but keep notification badge
    const handleUpdateLater = async () => {
        if (updateInfo) {
            await modalTracking.markModalDismissed(updateInfo.version);
        }

        setShowNotificationModal(false);
        // Keep hasUpdateNotification = true so badge stays visible
    };

    // Manually dismiss notification (from badge click or settings)
    const dismissNotification = () => {
        setHasUpdateNotification(false);
        setShowNotificationModal(false);
    };

    // Force show modal (for testing)
    const forceShowModal = () => {
        setShowNotificationModal(true);
    };

    // Reset modal tracking (for testing)
    const resetModalTracking = async () => {
        await modalTracking.resetAllTracking();
        console.log('Modal tracking reset - modals will show again');
    };

    return {
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        updateInfo,
        isChecking,
        isDownloading,
        downloadProgress,
        isInstalling,
        error,
        clearError,
        currentVersion,
        showNotificationModal,
        hasUpdateNotification,
        dismissNotification,
        handleUpdateNow,
        handleUpdateLater,
        setShowNotificationModal,
        forceShowModal,
        resetModalTracking
    };
}
