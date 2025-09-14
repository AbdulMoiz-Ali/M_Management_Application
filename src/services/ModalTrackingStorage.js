class ModalTrackingService {
    constructor() {
        this.storageKey = 'update-modal-tracking';
        this.init();
    }

    async init() {
        try {
            // Get tracking data from electron storage
            const trackingData = await window.electronAPI?.getModalTracking?.() || {};
            this.trackingData = trackingData;
        } catch (error) {
            console.log('Using fallback tracking storage');
            this.trackingData = {};
        }
    }

    // Check if modal has been shown for this version
    hasModalBeenShown(version) {
        return this.trackingData[version] === 'shown' || this.trackingData[version] === 'dismissed';
    }

    // Mark modal as shown for this version
    async markModalShown(version) {
        this.trackingData[version] = 'shown';
        await this.saveTracking();
    }

    // Mark modal as dismissed for this version
    async markModalDismissed(version) {
        this.trackingData[version] = 'dismissed';
        await this.saveTracking();
    }

    // Check if user clicked "Later" for this version
    hasUserClickedLater(version) {
        return this.trackingData[version] === 'dismissed';
    }

    // Clear tracking for older versions (cleanup)
    async clearOldVersions(currentVersion) {
        // Keep only current and newer versions
        const versionNumbers = Object.keys(this.trackingData);
        const currentVersionNum = this.parseVersion(currentVersion);

        for (const version of versionNumbers) {
            const versionNum = this.parseVersion(version);
            if (versionNum < currentVersionNum) {
                delete this.trackingData[version];
            }
        }

        await this.saveTracking();
    }

    // Parse version string to comparable number
    parseVersion(version) {
        const parts = version.replace('v', '').split('.');
        return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2] || 0);
    }

    // Save tracking data to electron storage
    async saveTracking() {
        try {
            await window.electronAPI?.saveModalTracking?.(this.trackingData);
        } catch (error) {
            console.log('Tracking save failed, using memory only');
        }
    }

    // Reset all tracking (for testing)
    async resetAllTracking() {
        this.trackingData = {};
        await this.saveTracking();
    }
}

export const modalTracking = new ModalTrackingService();
