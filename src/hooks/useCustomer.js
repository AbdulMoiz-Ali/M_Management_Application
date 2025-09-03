import { useState, useEffect, useCallback } from 'react';
import { customerStorage } from '../services/customerStorage';

export function useCustomer() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const invoicesPerPage = 10;

    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
    const paginatedInvoices = filteredCustomers?.slice(indexOfFirstInvoice, indexOfLastInvoice);
    const totalPages = Math.ceil(filteredCustomers?.length / invoicesPerPage);

    // Load customers on mount
    useEffect(() => {
        loadCustomers();

        // Setup event listeners
        const handleCustomerUpdated = () => {
            loadCustomers();
        };

        const handleCustomerDeleted = () => {
            loadCustomers();
        };

        // window.electronAPI?.onCustomerUpdated(handleCustomerUpdated);
        // window.electronAPI?.onCustomerDeleted(handleCustomerDeleted);

        return () => {
            window.electronAPI?.removeAllListeners('customer-updated');
            window.electronAPI?.removeAllListeners('customer-deleted');
        };
    }, []);

    // Filter customers based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.customerId.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    }, [customers, searchTerm]);

    // Load all customers
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await customerStorage.loadCustomers();
            if (result.success) {
                const sorted = [...(result?.data || [])].sort(
                    (a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)
                );
                setCustomers(sorted);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new customer
    const createCustomer = async (customerData) => {
        try {
            setError(null);

            const result = await customerStorage.createCustomer(customerData);

            if (result.success) {
                await loadCustomers(); // Refresh the list
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

    const customerbalance = async (customerId) => {
        try {
            setError(null);

            const result = await customerStorage.customerbalance(customerId);

            if (result.success) {
                await loadCustomers(); // Refresh the list
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


    // Get single customer
    const getCustomer = useCallback(async (customerId) => {
        try {
            setError(null);

            const result = await customerStorage.getCustomer(customerId);

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

    // Update customer
    const updateCustomer = useCallback(async (customerId, updateData) => {
        try {
            setError(null);

            const result = await customerStorage.updateCustomer(customerId, updateData);

            if (result.success) {
                await loadCustomers(); // Refresh the list

                // Update selected customer if it's the one being updated
                if (selectedCustomer && selectedCustomer.id === customerId) {
                    setSelectedCustomer(result.data);
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
    }, [loadCustomers, selectedCustomer]);

    // Delete customer
    const deleteCustomer = useCallback(async (customerId) => {
        try {
            setError(null);

            const result = await customerStorage.deleteCustomer(customerId);

            if (result.success) {
                await loadCustomers(); // Refresh the list

                // Clear selected customer if it's the one being deleted
                if (selectedCustomer && selectedCustomer.id === customerId) {
                    setSelectedCustomer(null);
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
    }, [loadCustomers, selectedCustomer]);

    // Search customers
    const searchCustomers = useCallback(async (term) => {
        try {
            setError(null);
            setSearchTerm(term);

            if (!term.trim()) {
                setFilteredCustomers(customers);
                return { success: true, data: customers };
            }

            const result = await customerStorage.searchCustomers(term);

            if (result.success) {
                setFilteredCustomers(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, [customers]);

    // Load customer history
    const loadCustomerHistory = useCallback(async (customerId) => {
        try {
            setError(null);

            const result = await customerStorage.loadCustomerHistory(customerId);

            if (result.success) {
                setCustomerHistory(result.data);
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

    // Select customer and load their history
    const selectCustomer = useCallback(async (customer) => {
        setSelectedCustomer(customer);
        if (customer) {
            await loadCustomerHistory(customer.customerId);
        } else {
            setCustomerHistory([]);
        }
    }, [loadCustomerHistory]);

    // Get customer statistics
    const getCustomerStats = useCallback(async () => {
        try {
            setError(null);

            const result = await customerStorage.getCustomerStats();

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

    // Export customers
    const exportCustomers = useCallback(async () => {
        try {
            setError(null);
            const result = await customerStorage.exportCustomers();

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

    const updateCustomerBalance = useCallback(async (customerId, invoiceTotal) => {
        try {
            setError(null);
            const result = await customerStorage.updateCustomerBalance(customerId, invoiceTotal);

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
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

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setFilteredCustomers(customers);
    }, [customers]);

    return {
        // State
        customers,
        filteredCustomers,
        selectedCustomer,
        customerHistory,
        loading,
        error,
        searchTerm,
        totalPages,
        currentPage,
        setCurrentPage,
        indexOfFirstInvoice,
        indexOfLastInvoice,
        paginatedInvoices,

        // Actions
        loadCustomers,
        createCustomer,
        customerbalance,
        getCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        loadCustomerHistory,
        selectCustomer,
        getCustomerStats,
        exportCustomers,
        updateCustomerBalance,

        // Utilities
        clearError,
        clearSearch,
        setSearchTerm,
        setSelectedCustomer
    };
}