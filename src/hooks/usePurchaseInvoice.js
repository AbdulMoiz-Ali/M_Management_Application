// hooks/usePurchaseInvoice.js

import { useState, useEffect, useCallback } from 'react';
import { purchaseInvoiceStorage } from '../services/purchaseInvoiceStorage';

export function usePurchaseInvoice() {
    const [allPurchaseInvoices, setAllPurchaseInvoices] = useState([]);
    const [supplierPurchaseInvoices, setSupplierPurchaseInvoices] = useState([]);
    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load purchase invoices on mount
    useEffect(() => {
        loadPurchaseInvoices();
    }, []);

    // Load all purchase invoices
    const loadPurchaseInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await purchaseInvoiceStorage.loadPurchaseInvoices();

            if (result.success) {
                const sorted = [...(result?.data || [])].sort(
                    (a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)
                );
                setAllPurchaseInvoices(sorted);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    // Save new purchase invoice
    const savePurchaseInvoice = async (purchaseInvoiceData) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.savePurchaseInvoice(purchaseInvoiceData);

            if (result.success) {
                await loadPurchaseInvoices(); // Refresh the list
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


    // Update purchase invoice
    const updatePurchaseInvoice = useCallback(async (purchaseInvoiceId, updateData) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.updatePurchaseInvoice(purchaseInvoiceId, updateData);

            if (result.success) {
                await loadPurchaseInvoices(); // Refresh the list

                // Update selected purchase invoice if it's the one being updated
                if (selectedPurchaseInvoice && selectedPurchaseInvoice.id === purchaseInvoiceId) {
                    setSelectedPurchaseInvoice(result.data);
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
    }, [loadPurchaseInvoices, selectedPurchaseInvoice]);

    // Delete purchase invoice
    const deletePurchaseInvoice = useCallback(async (purchaseInvoiceId) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.deletePurchaseInvoice(purchaseInvoiceId);

            if (result.success) {
                await loadPurchaseInvoices(); // Refresh the list

                // Clear selected purchase invoice if it's the one being deleted
                if (selectedPurchaseInvoice && selectedPurchaseInvoice.id === purchaseInvoiceId) {
                    setSelectedPurchaseInvoice(null);
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
    }, [loadPurchaseInvoices, selectedPurchaseInvoice]);

    // Get purchase invoice by ID
    const getPurchaseInvoice = useCallback(async (purchaseInvoiceId) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.getPurchaseInvoice(purchaseInvoiceId);

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Search purchase invoices
    const searchPurchaseInvoices = useCallback(async (searchTerm) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.searchPurchaseInvoices(searchTerm);

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Export purchase invoices
    const exportPurchaseInvoices = useCallback(async () => {
        try {
            setError(null);
            const result = await purchaseInvoiceStorage.exportPurchaseInvoices();

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

    // Get purchase invoices by supplier
    const getPurchaseInvoicesBySupplier = useCallback(async (supplierId) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.getPurchaseInvoicesBySupplier(supplierId);
            if (result.success) {
                setSupplierPurchaseInvoices(result.data)
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Get purchase invoices by date range
    const getPurchaseInvoicesByDateRange = useCallback(async (startDate, endDate) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.getPurchaseInvoicesByDateRange(startDate, endDate);

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Get pending purchase invoices
    const getPendingPurchaseInvoices = useCallback(async () => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.getPendingPurchaseInvoices();

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // Update purchase invoice status
    const updatePurchaseInvoiceStatus = useCallback(async (purchaseInvoiceId, status) => {
        try {
            setError(null);

            const result = await purchaseInvoiceStorage.updatePurchaseInvoiceStatus(purchaseInvoiceId, status);

            if (result.success) {
                await loadPurchaseInvoices(); // Refresh the list

                // Update selected purchase invoice if it's the one being updated
                if (selectedPurchaseInvoice && selectedPurchaseInvoice.id === purchaseInvoiceId) {
                    setSelectedPurchaseInvoice(result.data);
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
    }, [loadPurchaseInvoices, selectedPurchaseInvoice]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        allPurchaseInvoices,
        supplierPurchaseInvoices,
        selectedPurchaseInvoice,
        loading,
        error,

        // Actions
        loadPurchaseInvoices,
        savePurchaseInvoice,
        updatePurchaseInvoice,
        deletePurchaseInvoice,
        getPurchaseInvoice,
        searchPurchaseInvoices,
        exportPurchaseInvoices,
        getPurchaseInvoicesBySupplier,
        getPurchaseInvoicesByDateRange,
        getPendingPurchaseInvoices,
        updatePurchaseInvoiceStatus,
        // Utilities
        clearError,
        setSelectedPurchaseInvoice
    };
}