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
  printInvoice: (invoice) => ipcRenderer.invoke('super-fast-print', invoice),
  downloadInvoice: (invoice) => ipcRenderer.invoke('download-invoice-pdf-silent', invoice),
  openPrinterSettings: () => ipcRenderer.invoke('open-printer-settings'),

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

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});