class AuthStorage {
    constructor() {
        this.user = null;
        this.loaded = false;
    }

    async init() {
        if (!this.loaded) {
            try {
                const userInfo = await window.electronAPI?.getUserInfo();
                this.user = userInfo;
                this.loaded = true;
            } catch (error) {
                this.loaded = true;
            }
        }
    }

    async resetsoftware() {
        try {
            const result = await window.electronAPI?.resetsoftware();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async closeApp() {
        try {
            const result = await window.electronAPI?.closeApp();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(credentials) {
        try {
            const result = await window.electronAPI?.login(credentials);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async licensecheck() {
        try {

            const result = await window.electronAPI?.licensecheck();

            return {
                success: !result.error,
                accessGranted: result.accessGranted,
                message: result.message,
                deviceId: result.deviceId,
                error: result.error
            };

        } catch (error) {
            return {
                success: false,
                accessGranted: true, // Default allow on error
                error: error.message
            };
        }
    }

    async getLicenseStatus() {
        try {
            const result = await window.electronAPI?.getLicenseStatus();
            return result || { accessGranted: true };
        } catch (error) {
            return { accessGranted: true }; // Default allow
        }
    }


    //nnnnnnn


    async logout() {
        try {
            const result = await window.electronAPI?.logout();
            this.user = null;
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserInfo() {
        await this.init();
        return this.user;
    }

    async changePassword(data) {
        try {
            const result = await window.electronAPI?.changePassword(data);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendemail(data) {
        try {
            const result = await window.electronAPI?.sendemail(data);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async changeUseremail(data) {
        try {
            const result = await window.electronAPI?.changeUseremail(data);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async basicInformation(data) {
        try {
            const result = await window.electronAPI?.basicInformation(data);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async additionalinfo(data) {
        try {
            const result = await window.electronAPI?.additionalinfo(data);
            if (result.success) {
                await this.init();
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export const authStorage = new AuthStorage();