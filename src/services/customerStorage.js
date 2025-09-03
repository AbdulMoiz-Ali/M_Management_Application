class CustomerStorage {
    // Load all customers
    async loadCustomers() {
        try {
            const result = await window.electronAPI.loadCustomers();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error loading customers:', error);
            return { success: false, error: error.message };
        }
    }

    // Create new customer
    async createCustomer(customerData) {
        try {
            const result = await window.electronAPI?.createCustomer(customerData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error creating customer:', error);
            return { success: false, error: error.message };
        }
    }


    // Create new customer
    async customerbalance(customerId) {
        try {
            const result = await window.electronAPI?.customerbalance(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error creating customer:', error);
            return { success: false, error: error.message };
        }
    }


    // Get single customer
    async getCustomer(customerId) {
        try {
            const result = await window.electronAPI.getCustomer(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error getting customer:', error);
            return { success: false, error: error.message };
        }
    }

    // Update customer
    async updateCustomer(customerId, updateData) {
        try {
            const result = await window.electronAPI.updateCustomer(customerId, updateData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating customer:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete customer
    async deleteCustomer(customerId) {
        try {
            const result = await window.electronAPI.deleteCustomer(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error deleting customer:', error);
            return { success: false, error: error.message };
        }
    }

    // Search customers
    async searchCustomers(searchTerm) {
        try {
            const result = await window.electronAPI.searchCustomers(searchTerm);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error searching customers:', error);
            return { success: false, error: error.message };
        }
    }

    // Load customer history
    async loadCustomerHistory(customerId) {
        try {
            const result = await window.electronAPI.loadCustomerHistory(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error loading customer history:', error);
            return { success: false, error: error.message };
        }
    }

    // Bulk operations
    async bulkUpdateCustomers(updates) {
        try {
            const results = await Promise.all(
                updates.map(({ id, data }) => this.updateCustomer(id, data))
            );

            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                return {
                    success: false,
                    error: `${failed.length} updates failed`,
                    details: failed
                };
            }

            return { success: true, data: results.map(r => r.data) };
        } catch (error) {
            //console.error('Error in bulk update:', error);
            return { success: false, error: error.message };
        }
    }

    // Customer statistics
    async getCustomerStats() {
        try {
            const result = await this.loadCustomers();
            if (!result.success) {
                throw new Error(result.error);
            }

            const customers = result.data;
            const stats = {
                total: customers.length,
                active: customers.filter(c => c.daysOverdue === 0).length,
                overdue: customers.filter(c => c.daysOverdue > 0).length,
                totalDue: customers.reduce((sum, c) => sum + (c.totalDue || 0), 0),
                totalPaid: customers.reduce((sum, c) => sum + (c.paid || 0), 0),
                averageBalance: customers.length > 0
                    ? customers.reduce((sum, c) => sum + (c.balance || 0), 0) / customers.length
                    : 0
            };

            return { success: true, data: stats };
        } catch (error) {
            //console.error('Error calculating customer stats:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCustomerBalance(customerId, invoiceTotal) {
        try {
            return await window.electronAPI.updateCustomerBalance(customerId, invoiceTotal);
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Export failed'
            };
        }
    }

    // Export customers
    async exportCustomers() {
        try {
            return await window.electronAPI.exportCustomersData();
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Export failed'
            };
        }
    }
}

// Export singleton instance
export const customerStorage = new CustomerStorage();