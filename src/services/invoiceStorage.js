// services/invoiceStorage.js

class InvoiceStorage {
    // Load all invoices
    async loadInvoices() {
        try {
            const result = await window.electronAPI.loadInvoices();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error loading invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Save new invoice
    async saveInvoice(invoiceData) {
        try {
            const result = await window.electronAPI.saveInvoice(invoiceData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error saving invoice:', error);
            return { success: false, error: error.message };
        }
    }

    async openPrinterSettings() {
        try {
            const result = await window.electronAPI.openPrinterSettings();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error saving invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Update invoice
    async updateInvoice(invoiceId, updateData) {
        try {
            const result = await window.electronAPI.updateInvoice(invoiceId, updateData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete invoice
    async deleteInvoice(invoiceId) {
        try {
            const result = await window.electronAPI.deleteInvoice(invoiceId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error deleting invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Get invoice by ID
    async getInvoice(invoiceId) {
        try {
            const result = await window.electronAPI.getInvoice(invoiceId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Search invoices
    async searchInvoices(searchTerm) {
        try {
            const result = await window.electronAPI.searchInvoices(searchTerm);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error searching invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Export invoices
    async exportInvoices() {
        try {
            return await window.electronAPI.exportInvoices();
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Export failed'
            };
        }
    }

    // Get invoices by customer
    async getInvoicesByCustomer(customerId) {
        try {
            const result = await window.electronAPI.getInvoicesByCustomer(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting customer invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Get invoices by date range
    async getInvoicesByDateRange(startDate, endDate) {
        try {
            const result = await window.electronAPI.getInvoicesByDateRange(startDate, endDate);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting invoices by date range:', error);
            return { success: false, error: error.message };
        }
    }

    // Get pending invoices
    async getPendingInvoices() {
        try {
            const result = await window.electronAPI.getPendingInvoices();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting pending invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Update invoice status
    async updateInvoiceStatus(invoiceId, status) {
        try {
            const result = await window.electronAPI.updateInvoiceStatus(invoiceId, status);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating invoice status:', error);
            return { success: false, error: error.message };
        }
    }

    async printerCheck() {
        try {
            const result = await window.electronAPI.printerCheck();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error downloading invoice:', error);
            return { success: false, error: error.message };
        }
    }

    async downloadInvoice(invoiceData) {
        try {
            const result = await window.electronAPI.downloadInvoice(invoiceData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error downloading invoice:', error);
            return { success: false, error: error.message };
        }
    }

    async printInvoice(invoiceData) {
        try {
            const result = await window.electronAPI.printInvoice(invoiceData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error printing invoice:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const invoiceStorage = new InvoiceStorage();