const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Authentication APIs
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    logout: () => ipcRenderer.invoke('logout'),
    changePassword: (data) => ipcRenderer.invoke('change-password', data),
    sendemail: (data) => ipcRenderer.invoke('send-email-pin', data),
    changeUseremail: (data) => ipcRenderer.invoke('change-email', data),
    basicInformation: (data) => ipcRenderer.invoke('basicInformation', data),
    additionalinfo: (data) => ipcRenderer.invoke('additionalinfo', data),
    getUserInfo: () => ipcRenderer.invoke('get-user-info'),
    resetsoftware: () => ipcRenderer.invoke('reset-software'),
    closeApp: () => ipcRenderer.invoke('close-app'),
    licensecheck: () => ipcRenderer.invoke('license-check'),
    getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
    // Product APIs
    loadProducts: () => ipcRenderer.invoke('load-products'),
    createProduct: (productData) => ipcRenderer.invoke('create-product', productData),
    updateProduct: (productId, updateData) => ipcRenderer.invoke('update-product', productId, updateData),
    deleteProduct: (productId) => ipcRenderer.invoke('delete-product', productId),
    exportProduct: () => ipcRenderer.invoke('export-data-product'),

    // Customer APIs
    loadCustomers: () => ipcRenderer.invoke('load-customers'),
    createCustomer: (customerData) => ipcRenderer.invoke('create-customer', customerData),
    customerbalance: (customerId) => ipcRenderer.invoke('update-customer-balance', customerId),
    getCustomer: (customerId) => ipcRenderer.invoke('get-customer', customerId),
    updateCustomer: (customerId, updateData) => ipcRenderer.invoke('update-customer', customerId, updateData),
    deleteCustomer: (customerId) => ipcRenderer.invoke('delete-customer', customerId),
    searchCustomers: (searchTerm) => ipcRenderer.invoke('search-customers', searchTerm),
    updateCustomerBalance: (customerId, invoiceTotal) => ipcRenderer.invoke('update-Customer-PreBalance', customerId, invoiceTotal),
    exportCustomersData: () => ipcRenderer.invoke('export-customers-to-excel'),

    // Invoice APIs
    loadInvoices: () => ipcRenderer.invoke('load-invoices'),
    saveInvoice: (invoice) => ipcRenderer.invoke('save-invoice', invoice),
    updateInvoice: (invoiceId, updateData) => ipcRenderer.invoke('update-invoice', invoiceId, updateData),
    deleteInvoice: (invoiceId) => ipcRenderer.invoke('delete-invoice', invoiceId),
    getInvoice: (invoiceId) => ipcRenderer.invoke('get-invoice', invoiceId),
    searchInvoices: (searchTerm) => ipcRenderer.invoke('search-invoices', searchTerm),
    getInvoicesByCustomer: (customerId) => ipcRenderer.invoke('get-invoices-by-customer', customerId),
    getInvoicesByDateRange: (startDate, endDate) => ipcRenderer.invoke('get-invoices-by-date-range', startDate, endDate),
    getPendingInvoices: () => ipcRenderer.invoke('get-pending-invoices'),
    updateInvoiceStatus: (invoiceId, status) => ipcRenderer.invoke('update-invoice-status', invoiceId, status),
    exportInvoices: () => ipcRenderer.invoke('export-invoices'),
    printerCheck: (invoice) => ipcRenderer.invoke('check-printer-fast', invoice),
    printInvoice: (invoice, type) => ipcRenderer.invoke('super-fast-print', invoice, type),
    downloadInvoice: (invoice, type) => ipcRenderer.invoke('download-invoice-pdf-silent', invoice, type),
    openPrinterSettings: () => ipcRenderer.invoke('open-printer-settings'),

    // PurchaseInvoice APIs
    loadPurchaseInvoices: () => ipcRenderer.invoke('load-purchase-invoices'),
    savePurchaseInvoice: (purchaseInvoiceData) => ipcRenderer.invoke('save-purchase-invoice', purchaseInvoiceData),
    updatePurchaseInvoice: (purchaseInvoiceId, updateData) => ipcRenderer.invoke('update-purchase-invoice', purchaseInvoiceId, updateData),
    deletePurchaseInvoice: (purchaseInvoiceId) => ipcRenderer.invoke('delete-purchase-invoice', purchaseInvoiceId),
    getPurchaseInvoice: (purchaseInvoiceId) => ipcRenderer.invoke('get-purchase-invoice', purchaseInvoiceId),
    searchPurchaseInvoices: (searchTerm) => ipcRenderer.invoke('search-purchase-invoices', searchTerm),
    getPurchaseInvoicesBySupplier: (supplierId) => ipcRenderer.invoke('get-purchase-invoices-by-supplier', supplierId),
    getPurchaseInvoicesByDateRange: (startDate, endDate) => ipcRenderer.invoke('get-purchase-invoices-by-date-range', startDate, endDate),
    getPendingPurchaseInvoices: () => ipcRenderer.invoke('get-pending-purchase-invoices'),
    updatePurchaseInvoiceStatus: (purchaseInvoiceId, status) => ipcRenderer.invoke('update-purchase-invoice-status', purchaseInvoiceId, status),
    exportPurchaseInvoices: () => ipcRenderer.invoke('export-purchase-invoices'),

    // Settings APIs
    loadAppSettings: () => ipcRenderer.invoke('load-app-settings'),
    saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),

    // Import/Export APIs
    exportData: () => ipcRenderer.invoke('export-data'),
    importData: () => ipcRenderer.invoke('import-data'),

    // Menu event listeners 
    onExportData: (callback) => ipcRenderer.on('export-data', callback),
    onImportData: (callback) => ipcRenderer.on('import-data', callback),
    onLogout: (callback) => ipcRenderer.on('logout', callback),

    getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // Progress listener
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => {
            callback(progress);
        });
    },

    onDownloadError: (callback) => {
        ipcRenderer.on('download-error', (event, error) => {
            callback(error);
        });
    },

    onUpdaterError: (callback) => {
        ipcRenderer.on('updater-error', (event, error) => {
            callback(error);
        });
    },

    onManualInstallStarting: (callback) => {
        ipcRenderer.on('manual-install-starting', () => {
            callback();
        });
    },

    onManualInstallFailed: (callback) => {
        ipcRenderer.on('manual-install-failed', (event, error) => {
            callback(error);
        });
    },

    getModalTracking: () => ipcRenderer.invoke('get-modal-tracking'),
    saveModalTracking: (data) => ipcRenderer.invoke('save-modal-tracking', data),

    removeAllUpdateListeners: () => {
        ipcRenderer.removeAllListeners('download-progress');
        ipcRenderer.removeAllListeners('download-error');
        ipcRenderer.removeAllListeners('updater-error');
        ipcRenderer.removeAllListeners('manual-install-starting');
        ipcRenderer.removeAllListeners('manual-install-failed');
    },

    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});