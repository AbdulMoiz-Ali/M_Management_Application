class UpdateStorage {
    constructor() {
        this.loaded = false;
        this.currentVersion = '1.0.1';
        this.updateInfo = null;
    }

    async init() {
        if (this.loaded) return;
        
        try {
            // Load current version from electron
            const version = await window.electronAPI?.getCurrentVersion();
            this.currentVersion = version || '1.0.1';
            this.loaded = true;
        } catch (error) {
            console.error('UpdateStorage init failed:', error);
            this.loaded = true;
        }
    }

    async getCurrentVersion() {
        await this.init();
        return this.currentVersion;
    }

    async checkForUpdates() {
        try {
            await this.init();
            const result = await window.electronAPI?.checkForUpdates();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async downloadUpdate(progressCallback) {
        try {
            // Listen for progress updates
            const handleProgress = (progress) => {
                if (progressCallback) {
                    progressCallback(progress);
                }
            };

            // Set up progress listener
            window.electronAPI?.onDownloadProgress?.(handleProgress);

            const result = await window.electronAPI?.downloadUpdate();
            
            // Clean up listener
            window.electronAPI?.removeDownloadProgressListener?.(handleProgress);
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async installUpdate() {
        try {
            const result = await window.electronAPI?.installUpdate();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export const updateStorage = new UpdateStorage();

