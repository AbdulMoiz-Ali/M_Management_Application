// services/purchaseInvoiceStorage.js

class PurchaseInvoiceStorage {
    // Load all purchase invoices
    async loadPurchaseInvoices() {
        try {
            const result = await window.electronAPI.loadPurchaseInvoices();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error loading purchase invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Save new purchase invoice
    async savePurchaseInvoice(purchaseInvoiceData) {
        try {
            const result = await window.electronAPI.savePurchaseInvoice(purchaseInvoiceData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error saving purchase invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Update purchase invoice
    async updatePurchaseInvoice(purchaseInvoiceId, updateData) {
        try {
            const result = await window.electronAPI.updatePurchaseInvoice(purchaseInvoiceId, updateData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating purchase invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete purchase invoice
    async deletePurchaseInvoice(purchaseInvoiceId) {
        try {
            const result = await window.electronAPI.deletePurchaseInvoice(purchaseInvoiceId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error deleting purchase invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Get purchase invoice by ID
    async getPurchaseInvoice(purchaseInvoiceId) {
        try {
            const result = await window.electronAPI.getPurchaseInvoice(purchaseInvoiceId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting purchase invoice:', error);
            return { success: false, error: error.message };
        }
    }

    // Search purchase invoices
    async searchPurchaseInvoices(searchTerm) {
        try {
            const result = await window.electronAPI.searchPurchaseInvoices(searchTerm);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error searching purchase invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Export purchase invoices
    async exportPurchaseInvoices() {
        try {
            return await window.electronAPI.exportPurchaseInvoices();
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Export failed'
            };
        }
    }

    // Get purchase invoices by supplier
    async getPurchaseInvoicesBySupplier(supplierId) {
        try {
            const result = await window.electronAPI.getPurchaseInvoicesBySupplier(supplierId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting supplier purchase invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Get purchase invoices by date range
    async getPurchaseInvoicesByDateRange(startDate, endDate) {
        try {
            const result = await window.electronAPI.getPurchaseInvoicesByDateRange(startDate, endDate);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting purchase invoices by date range:', error);
            return { success: false, error: error.message };
        }
    }

    // Get pending purchase invoices
    async getPendingPurchaseInvoices() {
        try {
            const result = await window.electronAPI.getPendingPurchaseInvoices();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting pending purchase invoices:', error);
            return { success: false, error: error.message };
        }
    }

    // Update purchase invoice status
    async updatePurchaseInvoiceStatus(purchaseInvoiceId, status) {
        try {
            const result = await window.electronAPI.updatePurchaseInvoiceStatus(purchaseInvoiceId, status);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating purchase invoice status:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const purchaseInvoiceStorage = new PurchaseInvoiceStorage();