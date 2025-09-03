
class ProductStorage {
    // Load all products
    async loadProducts() {
        try {
            const result = await window.electronAPI.loadProducts();
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error loading products:', error);
            return { success: false, error: error.message };
        }
    }

    // Create new product
    async createProduct(productData) {
        try {
            const result = await window.electronAPI?.createProduct(productData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error creating product:', error);
            return { success: false, error: error.message };
        }
    }

    // Update product
    async updateProduct(productId, updateData) {
        try {
            const result = await window.electronAPI.updateProduct(productId, updateData);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete product
    async deleteProduct(productId) {
        try {
            const result = await window.electronAPI.deleteProduct(productId);
            if (result.success) {
                return { success: true, data: result.data };
            }
            throw new Error(result.error);
        } catch (error) {
            //console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    // Export products
    async exportProducts() {
        try {
            return await window.electronAPI.exportProduct();
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Export failed' 
            };
        }
    }
}

// Export singleton instance
export const productStorage = new ProductStorage();
