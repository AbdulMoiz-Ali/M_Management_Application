
import { useState, useEffect, useCallback } from 'react';
import { productStorage } from '../services/productStorage';

export function useProduct() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Load all products
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await productStorage.loadProducts();
            if (result.success) {
                const sorted = [...result?.data]?.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt));
                setProducts(sorted);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new product
    const createProduct = async (productData) => {
        try {
            setError(null);

            const result = await productStorage.createProduct(productData);

            if (result.success) {
                await loadProducts(); // Refresh the list
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Update product
    const updateProduct = useCallback(async (productId, updateData) => {
        try {
            setError(null);

            const result = await productStorage.updateProduct(productId, updateData);

            if (result.success) {
                await loadProducts(); // Refresh the list

                // Update selected product if it's the one being updated
                if (selectedProduct && selectedProduct.id === productId) {
                    setSelectedProduct(result.data);
                }

                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, [loadProducts, selectedProduct]);

    // Delete product
    const deleteProduct = useCallback(async (productId) => {
        try {
            setError(null);

            const result = await productStorage.deleteProduct(productId);

            if (result.success) {
                await loadProducts(); // Refresh the list

                // Clear selected product if it's the one being deleted
                if (selectedProduct && selectedProduct.id === productId) {
                    setSelectedProduct(null);
                }

                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, [loadProducts, selectedProduct]);

    // Export products
    // useProduct.jsx
    const exportProducts = useCallback(async () => {
        try {
            setError(null);
            const result = await productStorage.exportProducts();

            if (result.success) {
                return {
                    success: true,
                    path: result.path
                };
            } else if (result.canceled) {
                return {
                    success: false,
                    error: 'Export canceled by user'
                };
            } else {
                setError(result.error);
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (err) {
            setError(err.message);
            return {
                success: false,
                error: err.message
            };
        }
    }, []);
    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        products,
        selectedProduct,
        loading,
        error,
        // Actions
        loadProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        exportProducts,
        // Utilities
        clearError,
        setSelectedProduct
    };
}