const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
// Specific path specify karein
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const os = require('os');
const LicenseChecker = require('./licenseChecker');
const { autoUpdater } = require('electron-updater');
// Data storage path
const dataPath = path.join(app.getPath('userData'), 'todos.json');
const configPath = path.join(app.getPath('userData'), 'config.json');
const productsPath = path.join(app.getPath('userData'), 'products.json');
const customersPath = path.join(app.getPath('userData'), 'customers.json');
const invoicesFilePath = path.join(app.getPath('userData'), 'invoices.json');
const settingsPath = path.join(app.getPath('userData'), 'app-settings.json');
const purchaseInvoicesPath = path.join(app.getPath('userData'), 'purchaseInvoices.json');

// Global variables
let licenseChecker = null;
let periodicTimer = null;
let sessionStartTime = Date.now();
let lastSaveTime = Date.now();

// Store email PINs temporarily (in production, use a proper database)
const emailPins = new Map();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Generate random 6-digit PIN
const generatePin = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Clean up expired PINs periodically
setInterval(() => {
    const now = new Date().getTime();
    for (const [email, data] of emailPins.entries()) {
        if (now > data.expiresAt) {
            emailPins.delete(email);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Default admin credentials (Cannot be changed)
const DEFAULT_ADMIN = {
    username: process.env.NAME,
    password: process.env.PASSWORD,
    pin: process.env.PIN
};

// Default configuration
const defaultConfig = {
    user: {
        username: '',
        password: '',
        email: ''
    },
    basicInformation: {
        martName: "",
        shopAddress: "",
        shopContactPhone: [],
        saleBy: [],
        suppliers: []
    },
    isAuthenticated: false
};

// Default data
const defaultData = {
    accessGranted: true,
    deviceId: null,
    lastCheckTime: null,
    elapsedTime: 0,
    lastApiCallTime: null,
    apiCallCount: 0
};

const defaultProducts = {
    products: [],
};

const defaultCustomers = { customers: [] };

const defaultInvoices = {
    invoices: []
};


const defaultPurchaceInvoices = {
    purchaseInvoices: []
};

const defaultAppSettings = {
    theme: 'light',
    autoBackup: true,
    currency: 'PKR',
    taxEnabled: false,
    taxRate: 0,
    companyInfo: {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: 'Phone Number',
        email: 'company@email.com'
    }
};

// Generic file operations
async function loadFromFile(filePath, defaultData) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return defaultData;
    }
}

async function saveToFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Data operations
async function loadData() {
    return await loadFromFile(dataPath, defaultData);
}

async function saveData(data) {
    return await saveToFile(dataPath, data);
}

async function loadConfig() {
    return await loadFromFile(configPath, defaultConfig);
}

async function saveConfig(config) {
    return await saveToFile(configPath, config);
}


async function loadCustomers() {
    return await loadFromFile(customersPath, defaultCustomers);
}

async function saveCustomers(customers) {
    return await saveToFile(customersPath, customers);
}


async function loadProducts() {
    return await loadFromFile(productsPath, defaultProducts);
}

async function saveProducts(products) {
    return await saveToFile(productsPath, products);
}


async function loadInvoices() {
    return await loadFromFile(invoicesFilePath, defaultInvoices);
}

async function saveInvoicesData(invoices) {
    return await saveToFile(invoicesFilePath, invoices);
}

async function loadPurchaseInvoices() {
    return await loadFromFile(purchaseInvoicesPath, defaultPurchaceInvoices);
}

async function savePurchaseInvoicesData(invoices) {
    return await saveToFile(purchaseInvoicesPath, invoices);
}

//main.js for electron
// ============ LICENSE CHECKER INITIALIZATION ============
async function initializeLicenseChecker() {
    try {
        const data = await loadData();
        const config = await loadConfig();

        licenseChecker = new LicenseChecker({
            apiUrl: process?.env?.APIURL,
            softwareName: process?.env?.SN,
            deviceId: data.deviceId || null,
            userData: config
        });

        // Update elapsed time from last session
        await updateElapsedTime();

        // Start periodic checking
        await startPeriodicCheck();

        //console.log('✅ License checker initialized successfully');
        //console.log('📊 Current status:', data.accessGranted ? '🟢 UNBLOCKED' : '🔴 BLOCKED');
    } catch (error) {
        console.error('❌ Failed to initialize license checker:', error);
    }
}

// ============ TIMER MANAGEMENT ============
async function updateElapsedTime() {
    try {
        const data = await loadData();
        const now = Date.now();

        // Add time since last save to elapsed time
        if (lastSaveTime) {
            const timeSinceLastSave = now - lastSaveTime;
            data.elapsedTime = (data.elapsedTime || 0) + timeSinceLastSave;
        }

        lastSaveTime = now;
        await saveData(data);

        return data.elapsedTime;
    } catch (error) {
        console.error('Error updating elapsed time:', error);
        return 0;
    }
}

async function startPeriodicCheck() {
    try {
        if (periodicTimer) {
            clearTimeout(periodicTimer);
        }

        const data = await loadData();
        const checkInterval = 6 * 60 * 60 * 1000; // 6 hours = 21,600,000 ms


        let nextCheckTime = checkInterval;

        // Calculate time remaining
        const currentElapsed = await updateElapsedTime();

        if (currentElapsed >= checkInterval) {
            nextCheckTime = 0; // Check immediately
            //console.log('⏰ License check due immediately');
        } else {
            nextCheckTime = checkInterval - currentElapsed;
            const hours = Math.floor(nextCheckTime / (1000 * 60 * 60));
            const minutes = Math.floor((nextCheckTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((nextCheckTime % (1000 * 60)) / 1000);
            //console.log(`⏰ Next API call in: ${hours}h ${minutes}m ${seconds}s`);
        }

        // Set timer for next check
        periodicTimer = setTimeout(async () => {
            await performBackgroundCheck();
            await startPeriodicCheck(); // Restart cycle
        }, nextCheckTime);

    } catch (error) {
        console.error('Error starting periodic check:', error);
        // Retry after 10 seconds on error
        periodicTimer = setTimeout(() => startPeriodicCheck(), 10000);
    }
}

// ============ LICENSE VALIDATION ============
async function performBackgroundCheck() {
    try {
        //console.log('🔍 Performing background license check...');

        if (!licenseChecker) {
            console.error('License checker not initialized');
            return;
        }

        const result = await licenseChecker.validateLicense();
        const data = await loadData();

        //console.log('📡 API Response:', result);

        // Check if API response indicates blocking
        let shouldBlock = false;

        if (result.message && result.message.toLowerCase().includes('blocked')) {
            shouldBlock = true;
        } else if (result.isBlocked === true) {
            shouldBlock = true;
        } else if (result.accessGranted === false) {
            shouldBlock = true;
        }

        data.accessGranted = !shouldBlock;

        if (result.deviceId) {
            data.deviceId = result.deviceId;
            licenseChecker.setDeviceId(result.deviceId);
        }

        // Reset timer - check completed
        data.lastCheckTime = Date.now();
        data.lastApiCallTime = Date.now();
        data.elapsedTime = 0;
        data.apiCallCount = (data.apiCallCount || 0) + 1;
        lastSaveTime = Date.now();

        await saveData(data);

        //console.log(`✅ Background check #${data.apiCallCount} completed: ${data.accessGranted ? '🟢 UNBLOCKED' : '🔴 BLOCKED'}`);
        //console.log(`📋 Server message: "${result.message}"`);

        return result;

    } catch (error) {
        console.error('❌ Background check failed:', error);

        // ✅ OFFLINE SOFTWARE = DEFAULT UNBLOCK ON API FAILURE
        const data = await loadData();
        if (!data.accessGranted) {
            //console.log('⚠️ API failed - Switching to UNBLOCK (offline mode)');
            data.accessGranted = true; // ✅ Default UNBLOCK on API failure
            await saveData(data);
        }

        //console.log(`⚠️ Using status: ${data.accessGranted ? '🟢 UNBLOCKED (offline)' : '🔴 BLOCKED'}`);
    }
}

async function performManualCheck() {
    try {
        //console.log('🔍 Performing manual license check...');

        let data = await loadData();

        if (!licenseChecker) {
            licenseChecker = new LicenseChecker({
                apiUrl: process?.env?.APIURL,
                softwareName: process?.env?.SN,
                deviceId: data.deviceId || null
            });
        }

        const result = await licenseChecker.validateLicense();

        //console.log('📡 Manual API Response:', result);

        let shouldBlock = false;

        if (result.message && result.message.toLowerCase().includes('blocked')) {
            shouldBlock = true;
        } else if (result.isBlocked === true) {
            shouldBlock = true;
        } else if (result.accessGranted === false) {
            shouldBlock = true;
        }

        data.accessGranted = !shouldBlock;

        if (result.deviceId) {
            data.deviceId = result.deviceId;
            licenseChecker.setDeviceId(result.deviceId);
        }

        data.lastCheckTime = Date.now();
        data.lastApiCallTime = Date.now();
        data.elapsedTime = 0;
        data.apiCallCount = (data.apiCallCount || 0) + 1;
        lastSaveTime = Date.now();

        await saveData(data);

        //console.log(`✅ Manual check #${data.apiCallCount} completed: ${data.accessGranted ? '🟢 UNBLOCKED' : '🔴 BLOCKED'}`);

        return {
            success: true,
            accessGranted: data.accessGranted,
            message: result.message,
            deviceId: result.deviceId,
            isNewDevice: result.isNewDevice,
            apiCallCount: data.apiCallCount
        };

    } catch (error) {
        console.error('❌ Manual license check failed:', error);

        const data = await loadData();
        data.accessGranted = true;
        await saveData(data);

        return {
            success: false,
            accessGranted: true,
            message: 'API connection failed - running in offline mode (UNBLOCKED)',
            error: true,
            deviceId: data.deviceId
        };
    }
}

// ============ AUTO-SAVE TIMER STATE ============
setInterval(async () => {
    try {
        await updateElapsedTime();
    } catch (error) {
        console.error('Error in auto-save:', error);
    }
}, 5 * 60 * 1000); // Save every 5 seconds

// ============ IPC HANDLERS ============
ipcMain.handle('license-check', async () => {
    return await performManualCheck();
});

ipcMain.handle('get-license-status', async () => {
    try {
        const data = await loadData();
        await updateElapsedTime();
        //console.log('📊 Returning license status:', data.accessGranted ? 'UNBLOCKED' : 'BLOCKED');
        return data;
    } catch (error) {
        console.error('Error getting license status:', error);
        return { ...defaultData, accessGranted: true }; // ✅ Default UNBLOCK
    }
});

app.whenReady().then(() => {
    initializeLicenseChecker();
});


app.on('before-quit', async (event) => {
    event.preventDefault();

    try {
        //console.log('🔄 Saving state before quit...');

        if (periodicTimer) {
            clearTimeout(periodicTimer);
        }

        await updateElapsedTime();
        //console.log('✅ State saved successfully');

        app.exit(0);

    } catch (error) {
        console.error('Error during shutdown:', error);
        app.exit(1);
    }
});

process.on('SIGINT', async () => {
    await updateElapsedTime();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await updateElapsedTime();
    process.exit(0);
});

//console.log('🚀 Offline License System Started - Default Mode: UNBLOCKED');


async function clearAllData() {
    try {
        await saveProducts(defaultProducts);
        await saveCustomers(defaultCustomers);
        await saveInvoicesData(defaultInvoices);
        await savePurchaseInvoicesData(defaultPurchaceInvoices);
        await saveToFile(settingsPath, {});

        return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
// IPC Handler for reset feature
ipcMain.handle('reset-software', async () => {
    try {
        const result = await clearAllData();
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('close-app', async () => {
    try {
        const config = await loadConfig();
        config.isAuthenticated = false;
        await saveConfig(config);
        app.quit();
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Authentication IPC Handlers
ipcMain.handle('login', async (event, { username, password }) => {
    try {
        const config = await loadConfig();
        // Check default admin credentials
        if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
            config.isAuthenticated = true;
            await saveConfig(config);

            return {
                success: true,
                message: "Admin login successful",
                userType: 'admin',
                config: config
            };
        }
        // Check user custom credentials
        if (username === config.user.username &&
            password === config.user.password) {
            config.isAuthenticated = true;
            await saveConfig(config);
            return {
                success: true,
                message: "User login successful",
                userType: 'user',
                config: config
            };
        }

        return { success: false, error: 'Invalid username or password' };

    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('change-password', async (event, { newusername, newPassword, pin }) => {
    try {
        if (!newusername || !newPassword) {
            return { success: false, error: 'Username and password must not be empty.' };
        }

        const config = await loadConfig();
        const storedPinData = emailPins.get(config.user.email);

        const isDefaultPinValid = (pin === DEFAULT_ADMIN.pin);
        const isStoredPinValid = storedPinData && (pin === storedPinData.pin);

        if (!isDefaultPinValid && !isStoredPinValid) {
            return { success: false, error: 'Invalid PIN. Please enter correct 4-digit PIN.' };
        }
        emailPins.delete(config.user.email);
        config.user.username = newusername;
        config.user.password = newPassword;

        await saveConfig(config);
        return { success: true, message: 'Username & Password changed successfully' };

    } catch (error) {
        return { success: false, error: error.message };
    }
});


// Send email PIN handler
ipcMain.handle('send-email-pin', async (event, email) => {
    try {
        const pin = generatePin();
        const expiresAt = new Date().getTime() + (60 * 60 * 1000); // 1 hour expiry

        // Store PIN with expiry
        emailPins.set(email, {
            pin: pin,
            expiresAt: expiresAt,
            verified: false
        });

        // Email template
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password Change Verification PIN',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Change Verification</h2>
            <p>You have requested to change your password. Please use the following PIN to verify your identity:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${pin}</h1>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This PIN will expire in 1 hour</li>
              <li>Do not share this PIN with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            <p>Best regards,<br>Your Business Team</p>
          </div>
        `
        };

        await transporter.sendMail(mailOptions);

        return {
            success: true,
            message: 'PIN sent to your email successfully',
            expiresAt: expiresAt
        };

    } catch (error) {
        // console.error('Email send error:', error);
        return {
            success: false,
            error: 'Failed to send email. Please check your email settings.'
        };
    }
});


ipcMain.handle('change-email', async (event, { email, password }) => {

    try {
        const config = await loadConfig();
        if (password !== config.user.password) {
            return { success: false, error: 'Invalid Passward. Please enter correct Passward.' };
        }
        // Update username
        config.user.email = email;

        await saveConfig(config);
        return { success: true, message: 'Email changed successfully' };

    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('basicInformation', async (event, { martName, shopAddress }) => {
    try {
        const config = await loadConfig();
        config.basicInformation.martName = martName;
        config.basicInformation.shopAddress = shopAddress;
        await saveConfig(config);
        return { success: true, message: 'Basic Information changed successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('additionalinfo', async (event, { shopContactPhone, saleBy, suppliers }) => {
    try {
        const config = await loadConfig();
        config.basicInformation.shopContactPhone = shopContactPhone;
        config.basicInformation.saleBy = saleBy;
        config.basicInformation.suppliers = suppliers;

        await saveConfig(config);
        return { success: true, message: 'Basic Information changed successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-user-info', async () => {
    try {
        const config = await loadConfig();
        return {
            username: config.user.username || 'user',
            isAuthenticated: config.isAuthenticated,
            email: config.user.email,
            martName: config.basicInformation.martName,
            shopAddress: config.basicInformation.shopAddress,
            shopContactPhone: config.basicInformation.shopContactPhone,
            saleBy: config.basicInformation.saleBy,
            suppliers: config.basicInformation.suppliers,
        };
    } catch (error) {
        return {
            username: 'user',
            isAuthenticated: false,
        };
    }
});

ipcMain.handle('logout', async () => {
    try {
        const config = await loadConfig();
        config.isAuthenticated = false;
        await saveConfig(config);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


// IPC Handlers
ipcMain.handle('load-todos', async () => {
    const data = await loadData();
    return data.todos || [];
});

ipcMain.handle('save-todos', async (event, todos) => {
    const data = await loadData();
    data.todos = todos;
    return await saveData(data);
});

ipcMain.handle('load-settings', async () => {
    const data = await loadData();
    return data.settings || defaultData.settings;
});

ipcMain.handle('save-settings', async (event, settings) => {
    const data = await loadData();
    data.settings = settings;
    return await saveData(data);
});

// Product IPC Handlers
ipcMain.handle('load-products', async () => {
    try {
        const data = await loadProducts();
        return { success: true, data: data.products };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-product', async (event, productData) => {
    try {
        const data = await loadProducts();
        const newProduct = {
            id: Date.now().toString(),
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.products.push(newProduct);
        const result = await saveProducts(data);

        if (result.success) {
            return { success: true, data: newProduct };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-product', async (event, productId, updateData) => {
    try {
        const data = await loadProducts();
        const productIndex = data.products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return { success: false, error: 'Product not found' };
        }

        data.products[productIndex] = {
            ...data.products[productIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const result = await saveProducts(data);

        if (result.success) {
            return { success: true, data: data.products[productIndex] };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-product', async (event, productId) => {
    try {
        const data = await loadProducts();
        const productIndex = data.products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return { success: false, error: 'Product not found' };
        }

        const deletedProduct = data.products[productIndex];
        data.products.splice(productIndex, 1);

        const result = await saveProducts(data);

        if (result.success) {
            return { success: true, data: deletedProduct };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('export-data-product', async () => {
    try {
        const data = await loadProducts();
        const result = await dialog.showSaveDialog({
            title: 'Export Product Data',
            defaultPath: `products-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');

            // Updated headers for new structure
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Unit Price (Rs)', key: 'unitPrice', width: 15 },
                { header: 'Stock', key: 'stock', width: 10 },
                { header: 'Half per Master', key: 'halfMaster', width: 15 },
                { header: 'Boxes per Master', key: 'boxesPerMaster', width: 18 },
                { header: 'Price per Box (Rs)', key: 'pricePerBox', width: 18 },
                { header: 'Price per Master (Rs)', key: 'pricePerMaster', width: 20 },
                { header: 'Discount %', key: 'discount', width: 15 }
            ];

            // Add rows with updated calculation
            data?.products?.forEach(product => {
                const autoMaster = product.pricePerBox * product.boxesPerMaster;
                const discount = autoMaster > 0
                    ? Math.round((1 - product.pricePerMaster / autoMaster) * 100)
                    : 0;

                worksheet.addRow({
                    ...product,
                    discount: discount
                });
            });

            // Apply styles
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9E1F2' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            });

            await workbook.xlsx.writeFile(result.filePath);
            return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
// Customer IPC Handlers

// CREATE - Add new customer
ipcMain.handle('create-customer', async (event, customerData) => {
    try {
        const data = await loadCustomers();
        const newCustomer = {
            id: Date.now().toString(),
            customerId: generateCustomerId(data.customers),
            ...customerData,
            calculatedBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.customers.push(newCustomer);
        const result = await saveCustomers(data);

        if (result.success) {
            return { success: true, data: newCustomer };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// READ - Get all customers
ipcMain.handle('load-customers', async () => {
    try {
        const data = await loadCustomers();
        return { success: true, data: data.customers };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// READ - Get single customer by ID
ipcMain.handle('get-customer', async (event, customerId) => {
    try {
        const data = await loadCustomers();
        const customer = data.customers.find(c => c.id === customerId);

        if (customer) {
            return { success: true, data: customer };
        }
        return { success: false, error: 'Customer not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// UPDATE - Update existing customer
ipcMain.handle('update-customer', async (event, customerId, updateData) => {
    try {
        const data = await loadCustomers();
        const customerIndex = data.customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return { success: false, error: 'Customer not found' };
        }

        data.customers[customerIndex] = {
            ...data.customers[customerIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const result = await saveCustomers(data);

        if (result.success) {
            return { success: true, data: data.customers[customerIndex] };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Calculate and update customer balance automatically
ipcMain.handle('update-customer-balance', async (_, customerId) => {
    try {
        const customersData = await loadCustomers();
        const invoicesData = await loadInvoices();

        const customer = customersData.customers.find(c => c.id === customerId);
        if (!customer) {
            return { success: false, error: 'Customer not found' };
        }

        const customerInvoices = invoicesData.invoices.filter(invoice =>
            invoice.customer.id === customerId || invoice.customer.customerId === customerId
        );

        // Calculate from pending invoices
        const pendingInvoices = customerInvoices.filter(
            inv => inv.status === 'pending'
        );

        const calculatedBalance = pendingInvoices.reduce(
            (sum, inv) => sum + (inv.total),
            0
        );

        // Update only calculatedBalance
        customer.calculatedBalance = calculatedBalance;
        customer.updatedAt = new Date().toISOString();

        const result = await saveCustomers(customersData);
        return result.success
            ? { success: true, data: customer }
            : result;

    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-Customer-PreBalance', async (_, customerId, invoiceTotal) => {
    try {
        const customersData = await loadCustomers();

        const customerIndex = customersData.customers?.findIndex(cust => cust?.id === customerId);
        if (customerIndex === -1) {
            return { success: false, error: 'Customer not found' };
        }

        const currentBalance = parseFloat(customersData?.customers[customerIndex]?.previousBalance) || 0;
        const newBalance = currentBalance - invoiceTotal;

        customersData.customers[customerIndex].previousBalance = Math.max(0, newBalance);
        customersData.customers[customerIndex].updatedAt = new Date().toISOString();

        const result = await saveCustomers(customersData);
        return result.success
            ? { success: true, data: result }
            : result;

    } catch (error) {
        return { success: false, error: error.message };
    }
});


// DELETE - Remove customer
ipcMain.handle('delete-customer', async (event, customerId) => {
    try {
        const data = await loadCustomers();
        const customerIndex = data.customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return { success: false, error: 'Customer not found' };
        }

        const deletedCustomer = data.customers[customerIndex];
        data.customers.splice(customerIndex, 1);

        const result = await saveCustomers(data);

        if (result.success) {
            return { success: true, data: deletedCustomer };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// SEARCH - Search customers
ipcMain.handle('search-customers', async (event, searchTerm) => {
    try {
        const data = await loadCustomers();
        const filteredCustomers = data.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customerId.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return { success: true, data: filteredCustomers };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Export Customers to Excel
ipcMain.handle('export-customers-to-excel', async () => {
    try {
        const result = await loadCustomers();
        if (!result || !Array.isArray(result.customers)) {
            return { success: false, error: 'Customer data not found or invalid.' };
        }

        const customers = result.customers;

        const dialogResult = await dialog.showSaveDialog({
            title: 'Export Customers to Excel',
            defaultPath: `customers-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
        });

        if (dialogResult.canceled || !dialogResult.filePath) {
            return { success: false, canceled: true };
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customers');

        // Define columns
        worksheet.columns = [
            { header: 'Customer ID', key: 'customerId', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'Total Due', key: 'totalDue', width: 12 },
            { header: 'Paid', key: 'paid', width: 12 },
            { header: 'Balance', key: 'balance', width: 12 },
            { header: 'Days Overdue', key: 'daysOverdue', width: 15 },
            { header: 'Created At', key: 'createdAt', width: 20 },
            { header: 'Updated At', key: 'updatedAt', width: 20 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Add customer rows
        customers.forEach(customer => {
            worksheet.addRow(customer);
        });

        // Style the header row
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFECECEC' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });
        // Save the Excel file
        await workbook.xlsx.writeFile(dialogResult.filePath);

        return { success: true, path: dialogResult.filePath };
    } catch (error) {
        // console.error('Export Customers Error:', error);
        return { success: false, error: error.message };
    }
});

// Helper function to generate unique customer ID
function generateCustomerId(customers) {
    const customerCount = customers.length;
    const newId = `${String(customerCount + 1).padStart(4, '0')}`;

    const existingIds = customers.map(c => c.customerId);
    if (existingIds.includes(newId)) {
        const maxNum = Math.max(...existingIds.map(id => parseInt(id.split('-')[1]) || 0));
        return `${String(maxNum + 1).padStart(4, '0')}`;
    }

    return newId;
}

// Invoice IPC Handlers
ipcMain.handle('load-invoices', async () => {
    try {
        const data = await loadInvoices();
        return { success: true, data: data.invoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-invoice', async (event, invoiceData) => {
    try {
        const data = await loadInvoices();

        // Check if invoice already exists (for updates)
        const existingIndex = data.invoices.findIndex(inv => inv.id === invoiceData.id);

        if (existingIndex !== -1) {
            // Update existing invoice
            data.invoices[existingIndex] = {
                ...invoiceData,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Create new invoice
            const newInvoice = {
                ...invoiceData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data.invoices.push(newInvoice);
        }

        const result = await saveInvoicesData(data);

        if (result.success) {
            const savedInvoice = existingIndex !== -1 ? data.invoices[existingIndex] : data.invoices[data.invoices.length - 1];
            return { success: true, data: savedInvoice };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-invoice', async (event, invoiceId, updateData) => {
    try {
        const data = await loadInvoices();
        const invoiceIndex = data.invoices.findIndex(inv => inv.id === invoiceId);

        if (invoiceIndex === -1) {
            return { success: false, error: 'Invoice not found' };
        }

        data.invoices[invoiceIndex] = {
            ...data.invoices[invoiceIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const result = await saveInvoicesData(data);

        if (result.success) {
            return { success: true, data: data.invoices[invoiceIndex] };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-invoice', async (event, invoiceId) => {
    try {
        const data = await loadInvoices();
        const invoiceIndex = data.invoices.findIndex(inv => inv.id === invoiceId);

        if (invoiceIndex === -1) {
            return { success: false, error: 'Invoice not found' };
        }

        const deletedInvoice = data.invoices[invoiceIndex];
        data.invoices.splice(invoiceIndex, 1);

        const result = await saveInvoicesData(data);

        if (result.success) {
            return { success: true, data: deletedInvoice };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-invoice', async (event, invoiceId) => {
    try {
        const data = await loadInvoices();
        const invoice = data.invoices.find(inv => inv.id === invoiceId);

        if (!invoice) {
            return { success: false, error: 'Invoice not found' };
        }

        return { success: true, data: invoice };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('search-invoices', async (event, searchTerm) => {
    try {
        const data = await loadInvoices();
        const filteredInvoices = data.invoices.filter(invoice =>
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer.phone.includes(searchTerm) ||
            invoice.salesBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return { success: true, data: filteredInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-invoices-by-customer', async (event, customerId) => {
    try {
        const data = await loadInvoices();
        const customerInvoices = data.invoices.filter(invoice =>
            invoice.customer.id === customerId || invoice.customer.customerId === customerId
        );

        return { success: true, data: customerInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-invoices-by-date-range', async (event, startDate, endDate) => {
    try {
        const data = await loadInvoices();
        const filteredInvoices = data.invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return invoiceDate >= start && invoiceDate <= end;
        });

        return { success: true, data: filteredInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-pending-invoices', async () => {
    try {
        const data = await loadInvoices();
        const pendingInvoices = data.invoices.filter(invoice =>
            invoice.status === 'pending'
        );

        return { success: true, data: pendingInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-invoice-status', async (event, invoiceId, status) => {
    try {
        const invoiceData = await loadInvoices();
        const productData = await loadProducts();

        const invoiceIndex = invoiceData.invoices.findIndex(inv => inv.id === invoiceId);

        if (invoiceIndex === -1) {
            return { success: false, error: 'Invoice not found' };
        }

        const invoice = invoiceData.invoices[invoiceIndex];

        invoice.status = status;
        invoice.updatedAt = new Date().toISOString();

        if (status === 'paid') {
            for (const item of invoice.items) {
                const productIndex = productData.products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    const product = productData.products[productIndex];
                    let stockToDeduct = 0;
                    if (item.unit === 'MASTER') {
                        stockToDeduct = parseInt(item.quantity);
                        product.stock = Math.max(0, (product.stock || 0) - stockToDeduct);
                        product.updatedAt = new Date().toISOString();
                        await saveProducts(productData);
                    }
                }
            }
        } else if (status === 'pending') {
            for (const item of invoice.items) {
                const productIndex = productData.products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    const product = productData.products[productIndex];
                    let stockToAdd = 0;
                    if (item.unit === 'MASTER') {
                        stockToAdd = parseInt(item.quantity);
                        product.stock = (product.stock || 0) + stockToAdd;
                        product.updatedAt = new Date().toISOString();
                        await saveProducts(productData);
                    }
                }
            }

        }

        const result = await saveInvoicesData(invoiceData);

        if (result.success) {
            return { success: true, data: invoice };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('export-invoices', async () => {
    try {
        const data = await loadInvoices();
        const result = await dialog.showSaveDialog({
            title: 'Export Invoice Data',
            defaultPath: `invoices-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Invoices');

            // Add headers
            worksheet.columns = [
                { header: 'Invoice ID', key: 'id', width: 20 },
                { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Customer Name', key: 'customerName', width: 25 },
                { header: 'Customer Phone', key: 'customerPhone', width: 15 },
                { header: 'Customer City', key: 'customerCity', width: 15 },
                { header: 'Sales By', key: 'salesBy', width: 20 },
                { header: 'Supplier', key: 'supplier', width: 20 },
                { header: 'Sub Total', key: 'subTotal', width: 15 },
                { header: 'Discount Rate', key: 'discount', width: 12 },
                { header: 'Discount Amount', key: 'discountAmount', width: 15 },
                { header: 'Total Amount', key: 'total', width: 15 },
                { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            // Add rows with invoice data
            data?.invoices?.forEach(invoice => {
                worksheet.addRow({
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    date: invoice.date,
                    customerName: invoice.customer.name,
                    customerPhone: invoice.customer.phone,
                    customerCity: invoice.customer.city,
                    salesBy: invoice.salesBy,
                    supplier: invoice.supplier,
                    subTotal: invoice.subTotal,
                    discount: invoice.discount,
                    discountAmount: invoice.discountAmount,
                    total: invoice.total,
                    totalQuantity: invoice.totalQuantity,
                    status: invoice.status,
                    createdAt: invoice.createdAt
                });
            });

            // Apply styles to header row
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9E1F2' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Center align all cells
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            });

            // Save the Excel file
            await workbook.xlsx.writeFile(result.filePath);
            return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// API 1: Smart Printer Check (Fast Check)
ipcMain.handle('check-printer-fast', async (event) => {
    // console.log('🔍 Fast printer check started...');

    let tempWindow = null;

    try {
        // Create temporary hidden window for printer check
        tempWindow = new BrowserWindow({
            width: 100,
            height: 100,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Get printers quickly
        const printers = await tempWindow.webContents.getPrintersAsync();
        tempWindow.close();
        tempWindow = null;

        if (printers.length === 0) {
            // console.log('❌ No printers found');
            return {
                success: false,
                hasPrinters: false,
                error: 'No printers found',
                suggestion: 'Please connect a printer or install PDF printer',
                printers: []
            };
        }

        const defaultPrinter = printers.find(p => p.isDefault) || printers[0];

        // console.log('✅ Printers found:', printers.length);
        // console.log('📌 Default printer:', defaultPrinter?.name);

        return {
            success: true,
            hasPrinters: true,
            printers: printers.map(p => ({
                name: p.name,
                displayName: p.displayName,
                description: p.description,
                status: p.status,
                isDefault: p.isDefault
            })),
            defaultPrinter: defaultPrinter?.name,
            totalCount: printers.length
        };

    } catch (error) {
        // console.error('❌ Printer check failed:', error);

        if (tempWindow && !tempWindow.isDestroyed()) {
            tempWindow.close();
        }

        return {
            success: false,
            hasPrinters: false,
            error: error.message,
            printers: []
        };
    }
});

// API 2: Super Fast Print (After printer confirmed)
ipcMain.handle('super-fast-print', async (event, invoiceData, type) => {
    // console.log('⚡ Super fast print started for invoice:', invoiceData?.invoiceNumber);
    const config = await loadConfig();
    const setting = await config?.basicInformation || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
        shopAddress: "Sukkur",
        shopContactPhone: ["03042187313", "03003187980"],
        saleBy: ["izhar udin mamon"],
        supplers: ["Sukkur ware house supplyer"],
    };

    let printWindow = null;

    try {
        // Validate input
        if (!invoiceData || !invoiceData.invoiceNumber) {
            throw new Error('Invalid invoice data provided');
        }

        // Generate HTML content
        const htmlContent = generatePrintableHTML(invoiceData, setting, type);
        if (!htmlContent) {
            throw new Error('Failed to generate printable content');
        }

        // Create hidden print window
        printWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            show: false, // Hidden for speed
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false
            }
        });

        // Load content quickly
        const dataURL = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await printWindow.loadURL(dataURL);

        // Minimal wait time for rendering
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get default printer (should be available from previous check)
        const printers = await printWindow.webContents.getPrintersAsync();
        const defaultPrinter = printers.find(p => p.isDefault) || printers[0];

        if (!defaultPrinter) {
            throw new Error('Default printer not found');
        }

        // console.log('🖨️ Printing to:', defaultPrinter.name);

        // Super fast print (silent mode)
        await new Promise((resolve, reject) => {
            printWindow.webContents.print({
                silent: true, // No dialog for speed
                printBackground: true,
                deviceName: defaultPrinter.name,
                color: true,
                copies: 1,
                margins: {
                    marginType: 'custom',
                    top: 0.4,
                    bottom: 0.4,
                    left: 0.4,
                    right: 0.4
                }
            }, (success, failureReason) => {
                if (success) {
                    // console.log('✅ Print job sent successfully');
                    resolve();
                } else {
                    // console.error('❌ Print failed:', failureReason);
                    reject(new Error(failureReason || 'Print operation failed'));
                }
            });
        });

        // Close window immediately after print
        if (printWindow && !printWindow.isDestroyed()) {
            printWindow.close();
        }

        // console.log('⚡ Super fast print completed!');

        return {
            success: true,
            message: `Invoice printed successfully to ${defaultPrinter.name}!`,
            printer: defaultPrinter.name,
            invoiceNumber: type === 'sales' ? invoiceData?.invoiceNumber : invoiceData?.purchaseInvoiceNumber,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        // console.error('❌ Super fast print failed:', error);

        if (printWindow && !printWindow.isDestroyed()) {
            printWindow.close();
        }

        return {
            success: false,
            error: error.message,
            invoiceNumber: type === 'sales' ? invoiceData?.invoiceNumber : invoiceData?.purchaseInvoiceNumber
        };
    }
});

// API 3: Smart Print with Modal Logic (Combines both above)
ipcMain.handle('smart-print-with-modal', async (event, invoiceData) => {
    // console.log('🧠 Smart print with modal logic started...');

    try {
        // Step 1: Fast printer check
        const printerCheck = await new Promise(async (resolve) => {
            try {
                const tempWindow = new BrowserWindow({
                    width: 100,
                    height: 100,
                    show: false,
                    webPreferences: { nodeIntegration: false, contextIsolation: true }
                });

                const printers = await tempWindow.webContents.getPrintersAsync();
                tempWindow.close();

                resolve({
                    hasPrinters: printers.length > 0,
                    printers: printers,
                    defaultPrinter: printers.find(p => p.isDefault) || printers[0]
                });
            } catch (error) {
                resolve({ hasPrinters: false, error: error.message });
            }
        });

        // Step 2: Return status for modal decision
        if (printerCheck.hasPrinters) {
            return {
                success: true,
                action: 'show_print_modal',
                printerStatus: {
                    hasPrinters: true,
                    defaultPrinter: printerCheck.defaultPrinter?.name,
                    totalPrinters: printerCheck.printers.length,
                    printers: printerCheck.printers.map(p => ({
                        name: p.name,
                        isDefault: p.isDefault,
                        status: p.status
                    }))
                }
            };
        } else {
            return {
                success: true,
                action: 'show_no_printer_modal',
                printerStatus: {
                    hasPrinters: false,
                    error: printerCheck.error || 'No printers found',
                    suggestion: 'Connect a printer or save as PDF'
                }
            };
        }

    } catch (error) {
        return {
            success: false,
            error: error.message,
            action: 'show_error'
        };
    }
});

// Alternative: Simple auto-download without showing window
ipcMain.handle('download-invoice-pdf-silent', async (event, invoiceData, type) => {
    let pdfWindow = null;
    const config = await loadConfig();
    const setting = await config?.basicInformation || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
        shopAddress: "Sukkur",
        shopContactPhone: ["03042187313", "03003187980"],
        saleBy: ["izhar udin mamon"],
        supplers: ["Sukkur ware house supplyer"],
    };
    try {
        const htmlContent = generatePrintableHTML(invoiceData, setting, type);

        // Create hidden window
        pdfWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            show: false, // Hidden window
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false
            }
        });

        // Load content
        const dataURL = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await pdfWindow.loadURL(dataURL);

        // Wait for loading
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate PDF
        const pdfBuffer = await pdfWindow.webContents.printToPDF({
            format: 'A4',
            printBackground: true,
            landscape: true
        });

        // Close window
        pdfWindow.close();
        pdfWindow = null;

        // Save file
        const { dialog } = require('electron');
        const fs = require('fs');

        const { filePath, canceled } = await dialog.showSaveDialog({
            title: 'Save Invoice PDF',
            defaultPath: `Invoice_${type === 'sales' ? invoiceData?.invoiceNumber : invoiceData?.purchaseInvoiceNumber}.pdf`,
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (!canceled && filePath) {
            fs.writeFileSync(filePath, pdfBuffer);
            return { success: true, path: filePath };
        }

        return { success: false, error: 'Save cancelled' };

    } catch (error) {
        if (pdfWindow) pdfWindow.close();
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-printer-settings', async () => {
    await shell.openExternal('ms-settings:printers');
});


// Improved HTML generation function
function generateSalesInvoiceHTML(invoiceData, settings) {
    try {
        // console.log('Generating HTML for invoice:', invoiceData?.invoiceNumber);
        // Process items for display
        const processedItems = invoiceData?.items?.map(item => {
            const product = item.product;
            let packInfo = '';
            let displayQuantity = item.quantity;

            // Determine pack info based on unit type
            if (item.unit === 'MASTER') {
                packInfo = `1=${product.boxesPerMaster}X${product.unitPrice}`;
                displayQuantity = item.quantity; // Masters
            } else if (item.unit === 'BOX') {
                packInfo = `1X${product.unitPrice}`;
                displayQuantity = item.quantity; // Boxes
            } else {
                packInfo = '1'; // Individual pieces
                displayQuantity = item.quantity;
            }

            return {
                ...item,
                packInfo,
                displayQuantity,
                netPrice: item.amount // Net Price same as amount for this format
            };
        });

        const currentBill = invoiceData?.total.toFixed(1);
        const subTotalBill = invoiceData.subTotal;
        // Generate items HTML
        const content = `
        <div class="max-w-4xl mx-auto bg-white print:max-w-none print:mx-0">
            <style>
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .print\\:hidden { display: none !important; }
                    .invoice-container { margin: 0; padding: 15px; }
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                }

                .invoice-container {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #000;
                    border: 2px solid #000;
                    padding: 12px;
                    margin: 0;
                    background: white;
                }
                
                .invoice-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                }
                
                .invoice-header h1 {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0 0 4px 0;
                    letter-spacing: 1px;
                }
                
                .invoice-header p {
                    margin: 1px 0;
                    font-size: 10px;
                }
                
                .invoice-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .customer-info {
                    flex: 1;
                    font-size: 10px;
                    min-height: auto;
                }
                
                .customer-info div {
                    margin-bottom: 3px;
                }
                
                .invoice-details {
                    width: 200px;
                    border: 1px solid #000;
                    padding: 6px;
                    font-size: 10px;
                    height: auto;
                    min-height: fit-content;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    padding: 1px 0;
                }
                
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000;
                    margin-bottom: 12px;
                    font-size: 9px;
                    table-layout: fixed;
                }
                
                .invoice-table th,
                .invoice-table td {
                    border: 1px solid #000;
                    padding: 4px 3px;
                    text-align: center;
                    vertical-align: middle;
                    word-wrap: break-word;
                }
                
                .invoice-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    font-size: 8px;
                }
                
                /* Fixed column widths */
                .invoice-table .sr {
                    width: 6%;
                }
                
                .invoice-table .description {
                    width: 28%;
                    text-align: left;
                    font-size: 8px;
                }
                
                .invoice-table .pack {
                    width: 10%;
                }
                
                .invoice-table .qty-col {
                    width: 8%;
                }
                
                .invoice-table .rate-col {
                    width: 12%;
                }
                
                .invoice-table .amount-col {
                    width: 14%;
                }
                
                .invoice-table .np-col {
                    width: 14%;
                }
                
                .total-row {
                    font-weight: bold;
                    background-color: #f0f0f0;
                }
                
                .invoice-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    font-size: 10px;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .footer-left {
                    width: 200px;
                    border: 1px solid #000;
                    padding: 8px;
                    font-size: 10px;
                    height: auto;
                    min-height: 90px;
                }
                
                .footer-left .detail-row {
                    margin-bottom: 4px;
                }
                
                .account-summary {
                    padding-top: 4px;
                    margin-top: 4px;
                }
                
                .total-payable {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 4px 0;
                    font-weight: bold;
                    background-color: #f0f0f0;
                }

                .footer-right {
                    width: 280px;
                    border: 1px solid #000;
                    padding: 8px;
                    font-size: 11px;
                    font-family: Arial, sans-serif;
                }
                .signature-section {
                    margin-top: 8px;
                    width: 100%;
                }

                .signature-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap:2px
                }
                .label {
                    display: inline-block;
                    white-space: nowrap; 
                }
                .signature-line {
                    flex: 1;
                    border-bottom: 1px solid #000;
                    height: 1px;
                    margin-top:8px
                }
            </style>
    
            <div class="invoice-container">
                <!-- Header -->
                <div class="invoice-header">
                    <h1>${settings.martName}</h1>
                    <p>ADDRESS:- ${settings.shopAddress}</p>
                    <p>${settings.shopContactPhone.join(', ')}</p>
                </div>
    
                <!-- Invoice Info -->
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th rowspan="2" class="sr">Sr.</th>
                            <th rowspan="2" class="description">Description</th>
                            <th rowspan="2" class="pack">Pack</th>
                            <th colspan="3">Sale Qty</th>
                            <th rowspan="2" class="rate-col">Rate</th>
                            <th rowspan="2" class="amount-col">Discount</th>
                            <th rowspan="2" class="np-col">Amount</th>
                        </tr>
                        <tr>
                            <th class="qty-col">Master</th>
                            <th class="qty-col">Dozen</th>
                            <th class="qty-col">Box</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processedItems.map((item, index) => {
            let masterQty = '';
            let boxQty = '';
            let halfQty = '';

            if (item.unit === 'MASTER') {
                masterQty = item.quantity;
            } else if (item.unit === 'BOX') {
                boxQty = item.quantity;
            } else if (item.unit === 'HALF') {
                halfQty = '1/2';
            }

            return `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="description">${item.name.toUpperCase()}</td>
                                <td>${item.packInfo}</td>
                                <td>${masterQty}</td>
                                <td>${halfQty}</td>
                                <td>${boxQty}</td>
                                <td>${item?.rate.toFixed(2)}</td>
                                <td></td>
                                <td>${item?.netPrice.toFixed(2) || item?.amount.toFixed(2)}</td>
                            </tr>
                            `;
        }).join('')}
                        
                        <tr class="total-row">
                        <td colspan="2"><strong>Total</strong></td>
                        <td><strong>${(() => {
                const master = processedItems.filter(item => item.unit === 'MASTER')
                    .reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                const box = processedItems.filter(item => item.unit === 'BOX')
                    .reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                const half = processedItems.filter(item => item.unit === 'HALF').length;
                const totalUnits = [master, box, half].filter(val => val > 0).length;
                return totalUnits > 1 ? master + box + half : "";
            })()}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item?.quantity || 0), 0) || ''}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'HALF').length || ''}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'BOX').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || ''}</strong></td>
            <td></td>
            <td><strong>${invoiceData?.discountAmount}</strong></td>
            <td><strong>${subTotalBill.toFixed(1)}</strong></td>
            </tr>
                    </tbody>
                </table>
    
                <!-- Footer -->
                <div class="invoice-footer">
                     <div class="footer-left">
                        <div class="detail-row">
                            <span><strong>Invoice Amount</strong></span>
                            <span>${subTotalBill.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span><strong>Previous Balance</strong></span>
                            <span>${invoiceData?.customer?.previousBalance}</span>
                        </div>
    
                        <div class="account-summary">
                            <div class="detail-row total-payable">
                                <span><strong>Total Payable Value</strong></span>
                                <span>${currentBill?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
    
                   <div class="footer-right">
                   <div class="signature-section">
                   <div class="signature-row">
                       <span class="label">Customer Signatures</span>
                       <span class="signature-line"></span>
                   </div>
                   <div class="signature-row">
                       <span class="label">Receiver Name</span>
                       <span class="signature-line"></span>
                   </div>
                   <div class="signature-row">
                       <span class="label">Cell No.</span>
                       <span class="signature-line"></span>
                   </div>
                   </div>
                   </div>

                </div>
            </div>
        </div>
        `

        const fullHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Invoice ${invoiceData?.invoiceNumber || 'Unknown'}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: Arial, sans-serif; 
                        font-size: 12px;
                        line-height: 1.4;
                        color: #333;
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    
                    
                    @media print { 
                        body { 
                            margin: 0 !important; 
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        @page {
                            margin: 0.5in;
                            size: A4;
                        }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `;

        // console.log('HTML generated successfully, length:', fullHTML?.length);
        return fullHTML;

    } catch (error) {
        // console.error('Error generating HTML:', error);
        return null;
    }
}


function generatePurchaseInvoiceHTML(invoiceData, settings) {
    const processedItems = invoiceData.items.map(item => {
        const product = item.product;
        let packInfo = '';

        if (item.unit === 'MASTER') {
            packInfo = product ? `1=${product.boxesPerMaster || 24}X${product.piecesPerBox || 12}` : '1=24X12';
        } else if (item.unit === 'BOX') {
            packInfo = product ? `1X${product.unitPrice || 12}` : '1X12';
        } else if (item.unit === 'HALF') {
            packInfo = '1/2 Box';
        } else {
            packInfo = '1';
        }

        return {
            ...item,
            packInfo,
            netPrice: item.amount
        };
    });

    const currentBill = invoiceData.total.toFixed(1);
    const subTotalBill = invoiceData.subTotal;

    const content = `
    <div class="max-w-4xl mx-auto bg-white print:max-w-none print:mx-0">
        <style>
            @media print {
                body { 
                    margin: 0; 
                    padding: 0; 
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .print\\:hidden { display: none !important; }
                .invoice-container { margin: 0; padding: 15px; }
                @page {
                    margin: 0.5in;
                    size: A4;
                }
            }

            .invoice-container {
                font-family: Arial, sans-serif;
                font-size: 11px;
                line-height: 1.3;
                color: #000;
                border: 2px solid #000;
                padding: 12px;
                margin: 0;
                background: white;
            }
            
            .invoice-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
                margin-bottom: 12px;
            }
            
            .invoice-header h1 {
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 4px 0;
                letter-spacing: 1px;
            }
            
            .invoice-header p {
                margin: 1px 0;
                font-size: 10px;
            }
            
            .invoice-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                gap: 15px;
                align-items: flex-start;
            }
            
            .supplier-info {
                flex: 1;
                font-size: 10px;
                min-height: auto;
            }
            
            .supplier-info div {
                margin-bottom: 3px;
            }
            
            .invoice-details {
                width: 200px;
                border: 1px solid #000;
                padding: 6px;
                font-size: 10px;
                height: auto;
                min-height: fit-content;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
                padding: 1px 0;
            }
            
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 12px;
                font-size: 9px;
                table-layout: fixed;
            }
            
            .invoice-table th,
            .invoice-table td {
                border: 1px solid #000;
                padding: 4px 3px;
                text-align: center;
                vertical-align: middle;
                word-wrap: break-word;
            }
            
            .invoice-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 8px;
            }
            
            .invoice-table .sr {
                width: 8%;
            }
            
            .invoice-table .description {
                width: 35%;
                text-align: left;
                font-size: 8px;
            }
            
            .invoice-table .unit-col {
                width: 12%;
            }
            
            .invoice-table .qty-col {
                width: 10%;
            }
            
            .invoice-table .rate-col {
                width: 15%;
            }
            
            .invoice-table .amount-col {
                width: 20%;
            }
            
            .total-row {
                font-weight: bold;
                background-color: #f0f0f0;
            }
            
            .invoice-footer {
                display: flex;
                justify-content: space-between;
                margin-top: 12px;
                font-size: 10px;
                gap: 15px;
                align-items: flex-start;
            }
            
            .footer-left {
                width: 250px;
                border: 1px solid #000;
                padding: 8px;
                font-size: 10px;
                height: auto;
                min-height: 90px;
            }
            
            .footer-left .detail-row {
                margin-bottom: 4px;
            }
            
            .account-summary {
                padding-top: 4px;
                margin-top: 4px;
            }
            
            .total-payable {
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 4px 0;
                font-weight: bold;
                background-color: #f0f0f0;
            }

            .footer-right {
                width: 250px;
                border: 1px solid #000;
                padding: 8px;
                font-size: 11px;
                font-family: Arial, sans-serif;
            }
            
            .signature-section {
                margin-top: 8px;
                width: 100%;
            }

            .signature-row {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                gap: 2px;
            }
            
            .label {
                display: inline-block;
                white-space: nowrap; 
            }
            
            .signature-line {
                flex: 1;
                border-bottom: 1px solid #000;
                height: 1px;
                margin-top: 8px;
            }
        </style>

        <div class="invoice-container">
            <div class="invoice-header">
                <h1>${settings.martName}</h1>
                <p>ADDRESS:- ${settings.shopAddress}</p>
                <p>${settings.shopContactPhone.join(', ')}</p>
            </div>

            <div class="invoice-info">
                <div class="supplier-info">
                    <div><strong>Supplier Name:</strong> ${invoiceData.supplier.name.toUpperCase()}</div>
                    <div><strong>Address:</strong> ${invoiceData.supplier.address || 'N/A'}</div>
                    <div><strong>Contact:</strong> ${invoiceData.supplier.phone || 'N/A'}</div>
                    <div><strong>Status:</strong> ${invoiceData.status.toUpperCase()}</div>
                </div>

                <div class="invoice-details">
                    <div class="detail-row">
                        <span><strong>Date</strong></span>
                        <span>${new Date(invoiceData.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).replace(',', ' ,')}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Purchase Invoice</strong></span>
                        <span>${invoiceData?.purchaseInvoiceNumber?.replace('PUR-', '')}</span>
                    </div>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th class="sr">Sr.</th>
                        <th class="description">Product Description</th>
                        <th class="unit-col">Unit</th>
                        <th class="qty-col">Quantity</th>
                        <th class="rate-col">Rate</th>
                        <th class="amount-col">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${processedItems?.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="description">${item.name.toUpperCase()}</td>
                            <td>${item?.unit}</td>
                            <td>${item?.quantity}</td>
                            <td>${item?.rate}</td>
                            <td>${item?.amount}</td>
                        </tr>
                    `)?.join('')}
                    
                    <tr class="total-row">
                        <td colspan="4"><strong>Total</strong></td>
                        <td><strong>${invoiceData?.totalQuantity}</strong></td>
                        <td><strong>${subTotalBill}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div class="invoice-footer">
                 <div class="footer-left">
                    <div class="detail-row">
                        <span><strong>Subtotal</strong></span>
                        <span>Rs. ${subTotalBill}</span>
                    </div>
                    ${invoiceData.discountAmount > 0 ? `
                    <div class="detail-row">
                        <span><strong>Discount</strong></span>
                        <span>Rs. ${invoiceData.discountAmount}</span>
                    </div>
                    ` : ''}
                    ${invoiceData.supplier.previousBalance > 0 ? `
                    <div class="detail-row">
                        <span><strong>Previous Balance</strong></span>
                        <span>Rs. ${invoiceData.supplier.previousBalance}</span>
                    </div>
                    ` : ''}

                    <div class="account-summary">
                        <div class="detail-row total-payable">
                            <span><strong>Total Amount</strong></span>
                            <span>Rs. ${currentBill}</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 8px; font-size: 9px;">
                        <strong>In Words:</strong> ${invoiceData.amountInWords || 'Amount in words'}
                    </div>
                </div>

               <div class="footer-right">
               <div class="signature-section">
               <div class="signature-row">
                   <span class="label">Supplier Signature</span>
                   <span class="signature-line"></span>
               </div>
               <div class="signature-row">
                   <span class="label">Received By</span>
                   <span class="signature-line"></span>
               </div>
               <div class="signature-row">
                   <span class="label">Date</span>
                   <span class="signature-line"></span>
               </div>
               </div>
               </div>

            </div>
        </div>
    </div>
    `;

    const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceData?.purchaseInvoiceNumber || 'Unknown'}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
                padding: 0;
                margin: 0;
            }
            
            
            @media print { 
                body { 
                    margin: 0 !important; 
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                @page {
                    margin: 0.5in;
                    size: A4;
                }
            }
        </style>
    </head>
    <body>${content}</body>
    </html>
`;

    // console.log('HTML generated successfully, length:', fullHTML?.length);
    return fullHTML;
}

function generatePrintableHTML(invoiceData, settings, invoiceType = 'sales') {
    try {
        if (invoiceType === 'sales') {
            return generateSalesInvoiceHTML(invoiceData, settings);
        } else if (invoiceType === 'purchase') {
            return generatePurchaseInvoiceHTML(invoiceData, settings);
        } else {
            throw new Error(`Unsupported invoice type: ${invoiceType}`);
        }
    } catch (error) {
        // console.error('Error generating HTML:', error);
        return null;
    }
}

// Settings IPC Handlers
ipcMain.handle('load-app-settings', async () => {
    try {
        const data = await loadFromFile(settingsPath, defaultAppSettings);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-app-settings', async (event, settings) => {
    try {
        const result = await saveToFile(settingsPath, settings);
        if (result.success) {
            return { success: true, message: 'Settings saved successfully' };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Export/Import IPC Handlers
ipcMain.handle('export-data', async () => {
    try {
        const data = await loadProducts();
        const result = await dialog?.showSavDialog({
            title: 'Export TODO Data',
            defaultPath: `todos-backup-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ]
        });

        if (!result.canceled) {
            await fs.writeFile(result.filePath, JSON.stringify(data, null, 2));
            return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('import-data', async () => {
    try {
        const result = await dialog.showOpenDialog({
            title: 'Import Data',
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ],
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const data = await fs.readFile(result.filePaths[0], 'utf8');
            const importedData = JSON.parse(data);

            // Save imported data
            if (importedData.products) await saveToFile(productsPath, importedData.products);
            if (importedData.customers) await saveToFile(customersPath, importedData.customers);
            if (importedData.invoices) await saveToFile(invoicesFilePath, importedData.invoices);
            if (importedData.invoices) await saveToFile(purchaseInvoicesPath, importedData.purchaseInvoices);
            if (importedData.settings) await saveToFile(settingsPath, importedData.settings);

            return { success: true, message: 'Data imported successfully' };
        }
        return { success: false, error: 'Import cancelled' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


// Purchase Invoice IPC Handlers (Add to your main.js or handlers file)

ipcMain.handle('load-purchase-invoices', async () => {
    try {
        const data = await loadPurchaseInvoices();
        return { success: true, data: data.purchaseInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-purchase-invoice', async (event, purchaseInvoiceData) => {
    try {
        const data = await loadPurchaseInvoices();

        // Check if purchase invoice already exists (for updates)
        const existingIndex = data.purchaseInvoices.findIndex(inv => inv.id === purchaseInvoiceData.id);

        if (existingIndex !== -1) {
            // Update existing purchase invoice
            data.purchaseInvoices[existingIndex] = {
                ...purchaseInvoiceData,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Create new purchase invoice
            const newPurchaseInvoice = {
                ...purchaseInvoiceData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data.purchaseInvoices.push(newPurchaseInvoice);
        }

        const result = await savePurchaseInvoicesData(data);

        if (result.success) {
            const savedPurchaseInvoice = existingIndex !== -1 ? data.purchaseInvoices[existingIndex] : data.purchaseInvoices[data.purchaseInvoices.length - 1];
            return { success: true, data: savedPurchaseInvoice };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-purchase-invoice', async (event, purchaseInvoiceId, updateData) => {
    try {
        const data = await loadPurchaseInvoices();
        const purchaseInvoiceIndex = data.purchaseInvoices.findIndex(inv => inv.id === purchaseInvoiceId);

        if (purchaseInvoiceIndex === -1) {
            return { success: false, error: 'Purchase invoice not found' };
        }

        data.purchaseInvoices[purchaseInvoiceIndex] = {
            ...data.purchaseInvoices[purchaseInvoiceIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const result = await savePurchaseInvoicesData(data);

        if (result.success) {
            return { success: true, data: data.purchaseInvoices[purchaseInvoiceIndex] };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-purchase-invoice', async (event, purchaseInvoiceId) => {
    try {
        const data = await loadPurchaseInvoices();
        const purchaseInvoiceIndex = data.purchaseInvoices.findIndex(inv => inv.id === purchaseInvoiceId);

        if (purchaseInvoiceIndex === -1) {
            return { success: false, error: 'Purchase invoice not found' };
        }

        const deletedPurchaseInvoice = data.purchaseInvoices[purchaseInvoiceIndex];
        data.purchaseInvoices.splice(purchaseInvoiceIndex, 1);

        const result = await savePurchaseInvoicesData(data);

        if (result.success) {
            return { success: true, data: deletedPurchaseInvoice };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-purchase-invoice', async (event, purchaseInvoiceId) => {
    try {
        const data = await loadPurchaseInvoices();
        const purchaseInvoice = data.purchaseInvoices.find(inv => inv.id === purchaseInvoiceId);

        if (!purchaseInvoice) {
            return { success: false, error: 'Purchase invoice not found' };
        }

        return { success: true, data: purchaseInvoice };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('search-purchase-invoices', async (event, searchTerm) => {
    try {
        const data = await loadPurchaseInvoices();
        const filteredPurchaseInvoices = data.purchaseInvoices.filter(purchaseInvoice =>
            purchaseInvoice.purchaseInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchaseInvoice.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchaseInvoice.supplier.phone.includes(searchTerm) ||
            purchaseInvoice.receivedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchaseInvoice.status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return { success: true, data: filteredPurchaseInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-purchase-invoices-by-supplier', async (event, supplierId) => {
    try {
        const data = await loadPurchaseInvoices();
        const supplierPurchaseInvoices = data.purchaseInvoices.filter(purchaseInvoice =>
            purchaseInvoice.supplier.id === supplierId || purchaseInvoice.supplier.supplierId === supplierId
        );

        return { success: true, data: supplierPurchaseInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-purchase-invoices-by-date-range', async (event, startDate, endDate) => {
    try {
        const data = await loadPurchaseInvoices();
        const filteredPurchaseInvoices = data.purchaseInvoices.filter(purchaseInvoice => {
            const purchaseInvoiceDate = new Date(purchaseInvoice.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return purchaseInvoiceDate >= start && purchaseInvoiceDate <= end;
        });

        return { success: true, data: filteredPurchaseInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-pending-purchase-invoices', async () => {
    try {
        const data = await loadPurchaseInvoices();
        const pendingPurchaseInvoices = data.purchaseInvoices.filter(purchaseInvoice =>
            purchaseInvoice.status === 'pending'
        );

        return { success: true, data: pendingPurchaseInvoices };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-purchase-invoice-status', async (event, purchaseInvoiceId, status) => {
    try {
        const data = await loadPurchaseInvoices();
        const purchaseInvoiceIndex = data.purchaseInvoices.findIndex(inv => inv.id === purchaseInvoiceId);

        if (purchaseInvoiceIndex === -1) {
            return { success: false, error: 'Purchase invoice not found' };
        }

        data.purchaseInvoices[purchaseInvoiceIndex].status = status;
        data.purchaseInvoices[purchaseInvoiceIndex].updatedAt = new Date().toISOString();

        const result = await savePurchaseInvoicesData(data);

        if (result.success) {
            return { success: true, data: data.purchaseInvoices[purchaseInvoiceIndex] };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('export-purchase-invoices', async () => {
    try {
        const data = await loadPurchaseInvoices();
        const result = await dialog.showSaveDialog({
            title: 'Export Purchase Invoice Data',
            defaultPath: `purchase-invoices-${new Date().toISOString().split('T')[0]}.xlsx`,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Purchase Invoices');

            // Updated headers according to actual data structure
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 20 },
                { header: 'Purchase Invoice No', key: 'purchaseInvoiceNumber', width: 25 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Supplier Name', key: 'supplierName', width: 25 },
                { header: 'Supplier Phone', key: 'supplierPhone', width: 15 },
                { header: 'Supplier Address', key: 'supplierAddress', width: 25 },
                { header: 'Previous Balance', key: 'previousBalance', width: 15 },
                { header: 'Sub Total', key: 'subTotal', width: 15 },
                { header: 'Discount %', key: 'discount', width: 12 },
                { header: 'Discount Amount', key: 'discountAmount', width: 15 },
                { header: 'Total Amount', key: 'total', width: 15 },
                { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
                { header: 'Amount in Words', key: 'amountInWords', width: 30 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Created At', key: 'createdAt', width: 20 },
                { header: 'Updated At', key: 'updatedAt', width: 20 }
            ];

            // Add rows with corrected data mapping
            data?.purchaseInvoices?.forEach(invoice => {
                worksheet.addRow({
                    id: invoice.id,
                    purchaseInvoiceNumber: invoice.purchaseInvoiceNumber,
                    date: invoice.date,
                    supplierName: invoice.supplier?.name || 'N/A',
                    supplierPhone: invoice.supplier?.phone || 'N/A',
                    supplierAddress: invoice.supplier?.address || 'N/A',
                    previousBalance: invoice.supplier?.previousBalance || 0,
                    subTotal: invoice.subTotal,
                    discount: invoice.discount,
                    discountAmount: invoice.discountAmount,
                    total: invoice.total,
                    totalQuantity: invoice.totalQuantity,
                    amountInWords: invoice.amountInWords,
                    status: invoice.status,
                    createdAt: new Date(invoice.createdAt).toLocaleString(),
                    updatedAt: new Date(invoice.updatedAt).toLocaleString()
                });
            });

            // Style header row
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9E1F2' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Center align all cells
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            });

            await workbook.xlsx.writeFile(result.filePath);
            return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Additional handlers for download and print
ipcMain.handle('download-purchase-invoice', async (event, purchaseInvoiceData) => {
    try {
        // Your download logic here
        return { success: true, data: 'Download completed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('print-purchase-invoice', async (event, purchaseInvoiceData) => {
    try {
        // Your print logic here
        return { success: true, data: 'Print completed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        show: false
    });
    // Load app
    // if (process.env.NODE_ENV === 'development') {
    if (false) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        // mainWindow.webContents.openDevTools();
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Create application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Export Data',
                    click: () => mainWindow.webContents.send('export-data')
                },
                {
                    label: 'Import Data',
                    click: () => mainWindow.webContents.send('import-data')
                },
                { type: 'separator' },
                {
                    label: 'Logout',
                    click: () => mainWindow.webContents.send('logout')
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Invoice Management System',
                            detail: 'Version 1.0.0\nBuilt with Electron and React'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow()
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
        const config = await loadConfig();
        config.isAuthenticated = false;
        await saveConfig(config);
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});