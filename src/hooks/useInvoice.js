// hooks/useInvoice.js

import { useState, useEffect, useCallback } from 'react';
import { invoiceStorage } from '../services/invoiceStorage';

export function useInvoice() {
    const [allinvoice, setInvoices] = useState([]);
    const [clientinvoice, setClientInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load invoices on mount
    useEffect(() => {
        loadInvoices();
    }, []);

    // Load all invoices
    const loadInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await invoiceStorage.loadInvoices();

            if (result.success) {
                const sorted = [...(result?.data || [])].sort(
                    (a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)
                );
                setInvoices(sorted);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const openPrinterSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await invoiceStorage.openPrinterSettings();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save new invoice
    const saveInvoice = async (invoiceData) => {
        try {
            setError(null);

            const result = await invoiceStorage.saveInvoice(invoiceData);

            if (result.success) {
                await loadInvoices(); // Refresh the list
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

    const printerCheck = async () => {
        try {
            setError(null);
            const result = await invoiceStorage.printerCheck();
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
    };


    const downloadInvoice = async (invoiceData, type) => {
        try {
            setError(null);
            const result = await invoiceStorage.downloadInvoice(invoiceData, type);
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
    };

    const printInvoice = async (invoiceData, type) => {
        try {
            setError(null);
            const result = await invoiceStorage.printInvoice(invoiceData, type);

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
    };
    // Update invoice
    const updateInvoice = useCallback(async (invoiceId, updateData) => {
        try {
            setError(null);

            const result = await invoiceStorage.updateInvoice(invoiceId, updateData);

            if (result.success) {
                await loadInvoices(); // Refresh the list

                // Update selected invoice if it's the one being updated
                if (selectedInvoice && selectedInvoice.id === invoiceId) {
                    setSelectedInvoice(result.data);
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
    }, [loadInvoices, selectedInvoice]);

    // Delete invoice
    const deleteInvoice = useCallback(async (invoiceId) => {
        try {
            setError(null);

            const result = await invoiceStorage.deleteInvoice(invoiceId);

            if (result.success) {
                await loadInvoices(); // Refresh the list

                // Clear selected invoice if it's the one being deleted
                if (selectedInvoice && selectedInvoice.id === invoiceId) {
                    setSelectedInvoice(null);
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
    }, [loadInvoices, selectedInvoice]);

    // Get invoice by ID
    const getInvoice = useCallback(async (invoiceId) => {
        try {
            setError(null);

            const result = await invoiceStorage.getInvoice(invoiceId);

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

    // Search invoices
    const searchInvoices = useCallback(async (searchTerm) => {
        try {
            setError(null);

            const result = await invoiceStorage.searchInvoices(searchTerm);

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

    // Export invoices
    const exportInvoices = useCallback(async () => {
        try {
            setError(null);
            const result = await invoiceStorage.exportInvoices();

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

    // Get invoices by customer
    const getInvoicesByCustomer = useCallback(async (customerId) => {
        try {
            setError(null);

            const result = await invoiceStorage.getInvoicesByCustomer(customerId);
            if (result.success) {
                setClientInvoices(result.data)
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

    // Get invoices by date range
    const getInvoicesByDateRange = useCallback(async (startDate, endDate) => {
        try {
            setError(null);

            const result = await invoiceStorage.getInvoicesByDateRange(startDate, endDate);

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

    // Get pending invoices
    const getPendingInvoices = useCallback(async () => {
        try {
            setError(null);

            const result = await invoiceStorage.getPendingInvoices();

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

    // Update invoice status
    const updateInvoiceStatus = useCallback(async (invoiceId, status) => {
        try {
            setError(null);

            const result = await invoiceStorage.updateInvoiceStatus(invoiceId, status);

            if (result.success) {
                await loadInvoices(); // Refresh the list

                // Update selected invoice if it's the one being updated
                if (selectedInvoice && selectedInvoice.id === invoiceId) {
                    setSelectedInvoice(result.data);
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
    }, [loadInvoices, selectedInvoice]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        allinvoice,
        clientinvoice,
        selectedInvoice,
        loading,
        error,

        // Actions
        loadInvoices,
        saveInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoice,
        searchInvoices,
        exportInvoices,
        getInvoicesByCustomer,
        getInvoicesByDateRange,
        getPendingInvoices,
        updateInvoiceStatus,
        downloadInvoice,
        printerCheck,
        printInvoice,
        openPrinterSettings,

        // Utilities
        clearError,
        setSelectedInvoice
    };
}