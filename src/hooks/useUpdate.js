import { useState, useEffect } from 'react';
import { updateStorage } from '../services/updateStorage';

export function useUpdate() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [currentVersion, setCurrentVersion] = useState('1.0.1');

    useEffect(() => {
        loadCurrentVersion();
    }, []);

    const loadCurrentVersion = async () => {
        try {
            const version = await updateStorage.getCurrentVersion();
            setCurrentVersion(version);
        } catch (err) {
            console.error('Failed to load version:', err);
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
                    setUpdateInfo(result.updateInfo);
                } else {
                    setUpdateInfo(null);
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

    // Download update
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

    // Install update
    const installUpdate = async () => {
        try {
            const result = await updateStorage.installUpdate();
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Installation failed: ' + err.message);
        }
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    return {
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
    };
}