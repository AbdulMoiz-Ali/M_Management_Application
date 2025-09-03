// licenseChecker.js - FIXED VERSION
const { app } = require('electron')
const os = require('os')
const crypto = require('crypto')
const fetch = require('node-fetch')

class LicenseChecker {
    constructor(config) {
        this.apiUrl = config.apiUrl
        this.softwareName = config.softwareName || 'NULL'
        this.deviceId = config.deviceId || null
        this.userData = config.userData || null
        this.isOnline = true
        this.lastValidationTime = null
    }

    // Update deviceId after first registration
    setDeviceId(deviceId) {
        this.deviceId = deviceId
    }

    async getPublicIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json')
            const data = await res.json()
            return data?.ip
        } catch (e) {
            return 'unknown'
        }
    }

    // Device information gather karna
    async getDeviceInfo() {
        const networkInterfaces = os.networkInterfaces()
        let macAddress = null

        // First valid MAC address dhundna
        Object.keys(networkInterfaces).forEach(interfaceName => {
            networkInterfaces[interfaceName].forEach(iface => {
                if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
                    macAddress = macAddress || iface.mac
                }
            })
        })

        // Hardware-based unique ID generate karna
        const hardwareId = this.generateHardwareId()

        // Current IP address nikalna
        const currentIP = this.getCurrentIP()

        const publicIP = await this.getPublicIP()

        return {
            deviceName: os?.hostname(),
            macAddress,
            hardwareId,
            publicdata: publicIP,
            ipAddress: currentIP,
            platform: os.platform(),
            arch: os.arch(),
            userInfo: os.userInfo().username
        }
    }

    // Hardware ID generate karna (MAC + CPU + hostname based)
    generateHardwareId() {
        const hostname = os.hostname()
        const platform = os.platform()
        const arch = os.arch()
        const cpus = os.cpus()[0]?.model || 'unknown'

        const combined = `${hostname}-${platform}-${arch}-${cpus}`
        return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32)
    }

    // Current IP address nikalna
    getCurrentIP() {
        const networkInterfaces = os.networkInterfaces()

        for (const interfaceName of Object.keys(networkInterfaces)) {
            for (const iface of networkInterfaces[interfaceName]) {
                // Skip internal and IPv6 addresses
                if (!iface.internal && iface.family === 'IPv4') {
                    return iface.address
                }
            }
        }
        return 'unknown'
    }

    // License validation API call
    async validateLicense() {
        try {
            const deviceInfo = await this.getDeviceInfo()

            // console.log('Checking license for:', {
            //     software: this.softwareName,
            //     device: deviceInfo.deviceName,
            //     ip: deviceInfo.ipAddress,
            //     deviceId: this.deviceId,
            // })

            const requestBody = {
                softwareName: this.softwareName,
                deviceName: deviceInfo.deviceName || "null",
                ipAddress: deviceInfo.ipAddress || "null",
                publicdata: deviceInfo.publicdata || "null",
                macAddress: deviceInfo.macAddress,
                hardwareId: deviceInfo.hardwareId,
                platform: deviceInfo.platform,
                arch: deviceInfo.arch,
                userInfo: deviceInfo.userInfo
            }

            // ✅ Fixed: Only add deviceId if it exists
            if (this.deviceId) {
                requestBody.deviceId = this.deviceId
            }

            if (this.userData) {
                requestBody.userData = this.userData
            }

            // console.log('Request body:', requestBody) // Debug log

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${this.softwareName}-License-Checker/1.0`
                },
                body: JSON.stringify(requestBody),
            })

            const result = await response.json()

            this.isOnline = true
            this.lastValidationTime = Date.now()

            // console.log('result:', result)

            // ✅ Fixed: Update deviceId if this is a new device
            if (result.deviceId && !this.deviceId) {
                this.setDeviceId(result.deviceId)
            }

            return {
                accessGranted: !result.isBlocked,  // ✅ Fixed: inverted logic
                isOnline: true,
                message: result.message,
                deviceId: result.deviceId,
                isNewDevice: result.isNewDevice
            }

        } catch (error) {
            console.error('License validation failed:', error.message)
            // First time validation failed
            return {
                accessGranted: true,
                isOnline: false,
                message: 'Cannot validate license - internet connection required',
                offlineMode: true
            }
        }
    }

    // App shutdown par cleanup
    cleanup() {
        // console.log('License checker cleanup completed')
    }
}

module.exports = LicenseChecker