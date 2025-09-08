import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    Search, Plus, Trash2, Calculator, FileText, User, Package, Eye, Download,
    Printer, Save, X, Edit, Filter, Calendar, DollarSign, Users, Receipt,
    ArrowLeft, ExternalLink
} from 'lucide-react';
import { useCustomer } from '../hooks/useCustomer';
import { useProduct } from '../hooks/useProduct';
import { useInvoice } from '../hooks/useInvoice';
import { useAuth } from '../hooks/useAuth';
import SmartPrintInvoice from '../components/SmartPrintInvoice';
import Pagination from '../components/Pagination';
import LoadingDemo from '../components/LoadingDemo';
import useConfirmDialog from '../components/ConfirmationDialog';

const InvoiceManagement = () => {
    const {
        customers,
        updateCustomerBalance
    } = useCustomer();
    const { products } = useProduct();

    const { user } = useAuth();

    const { showConfirm, ConfirmDialog } = useConfirmDialog();

    const setting = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
        shopAddress: "Sukkur",
        shopContactPhone: ["03042187313", "03003187980"],
        saleBy: ["izhar udin mamon"],
        suppliers: ["Sukkur ware house supplyer"],
    }

    // Using all hook functionalities
    const {
        allinvoice,
        loading,
        error,
        loadInvoices,
        saveInvoice,
        deleteInvoice,
        getInvoice,
        searchInvoices,
        exportInvoices,
        updateInvoice,
        clearError,
        downloadInvoice,
        printInvoice,
        updateInvoiceStatus,
        setSelectedInvoice: setHookSelectedInvoice
    } = useInvoice();

    useEffect(() => {
        loadInvoices?.();
    }, [loadInvoices]);

    const [currentView, setCurrentView] = useState('dashboard');

    const handleExportInvoices = async () => {
        const result = await exportInvoices?.();
        if (result?.success) {
            showAlert(`Invoices exported successfully to: ${result?.path}`, 'success');
        } else {
            showAlert(`Export failed: ${result?.error}`, 'error');
        }
    };

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isEditing, setIsEditing] = useState(false);
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
    // Invoice creation states
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState({});
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [editingStatus, setEditingStatus] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const handleStatusEdit = (invoice) => {
        setEditingStatus(invoice?.id);
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    const updateCustomerPreviousBalance = async (customerId, invoiceTotal) => {
        try {
            const updateResult = await updateCustomerBalance?.(customerId, invoiceTotal);

            if (updateResult?.success) {
                setTimeout(() => {
                    showAlert(`Customer balance updated`, 'success');
                }, 2000);

            }
        } catch (error) {
            console.error('Error updating customer balance:', error);
        }
    };

    const handleStatusChange = async (invoiceId, newStatus) => {
        try {
            const result = await updateInvoiceStatus?.(invoiceId, newStatus);
            showAlert(result?.success ? `Status updated to ${newStatus}` : result?.error, result?.success ? 'success' : 'error');
            setEditingStatus(null);
            if (newStatus === 'paid') {
                const invoice = result?.data;
                const customerId = invoice?.customer?.id;
                const invoiceTotal = invoice?.customer?.previousBalance || 0;

                await updateCustomerPreviousBalance(customerId, invoiceTotal);
            }
        } catch (error) {
            showAlert('Failed to update status', "error")
        }
    };

    // Updated form default values
    const { register, control, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm({
        defaultValues: {
            invoiceNumber: `INV-${Date?.now()}`,
            date: new Date()?.toISOString()?.split('T')[0],
            customerSearch: '',
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            customerCity: '',
            previousBalance: 0,
            salesBy: '',
            supplier: '',
            items: [{
                productSearch: '',
                productName: '',
                quantity: 1,
                unit: 'MASTER',
                rate: 0,
                amount: 0
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Handle search functionality
    useEffect(() => {
        if (searchTerm?.trim()) {
            handleSearch();
        }
    }, [searchTerm]);

    const handleSearch = async () => {
        if (searchTerm?.trim()) {
            const result = await searchInvoices?.(searchTerm);
            if (result?.success) {
                // console.log('Search results:', result?.data);
            }
        }
    };

    const watchedItems = watch("items");
    const customerSearch = watch("customer");

    // Filter products based on search
    const handleProductSearch = (value, index) => {
        if (value?.length > 0) {
            const filtered = products?.filter(product =>
                product?.name?.toLowerCase()?.includes(value?.toLowerCase())
            );
            setFilteredProducts(filtered);
            setShowProductDropdown({ ...showProductDropdown, [index]: true });
        } else {
            setShowProductDropdown({ ...showProductDropdown, [index]: false });
        }
    };

    const selectProduct = (product, index) => {
        setValue(`items.${index}.productSearch`, product?.name);
        setValue(`items.${index}.productName`, product?.name);
        setValue(`items.${index}.productId`, product?.id);

        // Set default rate based on unit type
        const currentUnit = getValues(`items.${index}.unit`) || 'MASTER';
        const rate = currentUnit === 'MASTER' ? product?.pricePerMaster : product?.pricePerBox;
        setValue(`items.${index}.rate`, rate);

        // Store product data for later use
        setSelectedProduct((prevSelectedProduct) => {
            const updatedProducts = [...prevSelectedProduct];
            updatedProducts[index] = product;
            return updatedProducts;
        });

        calculateAmount(index);
        setShowProductDropdown({ ...showProductDropdown, [index]: false });
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);

        // Form values set
        setValue('customerName', customer?.name);
        setValue('customerPhone', customer?.phone);
        setValue('customerAddress', customer?.address);
        setValue('customerCity', customer?.city);
        setValue('previousBalance', customer?.previousBalance);
        setValue('customerSearch', customer?.name);

        // Dropdown hide
        setShowCustomerDropdown(false);
        setFilteredCustomers([]);
    };

    const calculateAmount = (index) => {
        const items = getValues("items");
        const quantity = items?.[index]?.quantity || 0;
        const unit = items?.[index]?.unit || 'MASTER';

        // Get the selected product for this item
        const selectedProductForItem = selectedProduct?.[index];
        if (selectedProductForItem) {
            let rate = 0;

            if (unit === 'MASTER') {
                rate = selectedProductForItem?.pricePerMaster;
            } else if (unit === 'BOX') {
                rate = selectedProductForItem?.pricePerBox;
            } else if (unit === 'HALF') {
                // rate = selectedProductForItem?.pricePerBox;
                // const halfBoxes = (selectedProductForItem?.boxesPerMaster || 24) / 2;
                // const amount = rate * halfBoxes;
                // const amount = selectedProductForItem?.pricePerMaster / 2;
                // setValue(`items.${index}.amount`, amount);
                // return;
                rate = selectedProductForItem?.pricePerMaster / 2;
            }

            setValue(`items.${index}.rate`, rate);
            const amount = quantity * rate;
            setValue(`items.${index}.amount`, amount);
        } else {
            // Manual calculation if no product selected
            const rate = items?.[index]?.rate || 0;
            const amount = quantity * rate;
            setValue(`items.${index}.amount`, amount);
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        const items = watchedItems || [];
        const subTotal = Math.round(items?.reduce((sum, item) => {
            const amount = parseFloat(item?.amount) || 0;
            return sum + amount;
        }, 0) * 100) / 100;

        const discount = Math.round(parseFloat(discountAmount) * 100) / 100;

        const invoiceTotal = Math.round((subTotal - discount) * 100) / 100;

        const previousBalance = Math.round(parseFloat(watch('previousBalance') || 0) * 100) / 100;
        const total = Math.round((invoiceTotal + previousBalance) * 100) / 100;

        const totalQuantity = items?.reduce((sum, item) => {
            const quantity = parseFloat(item?.quantity) || 0;
            return sum + quantity;
        }, 0);

        return {
            subTotal,
            discount,
            invoiceTotal,
            previousBalance,
            total,
            totalQuantity
        };
    };

    const { subTotal, discount, invoiceTotal, previousBalance, total, totalQuantity } = calculateTotals();

    // Convert number to words
    const numberToWords = (num) => {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        if (num === 0) return 'zero';

        let result = '';
        let crore = Math.floor(num / 10000000);
        let lakh = Math.floor((num % 10000000) / 100000);
        let thousand = Math.floor((num % 100000) / 1000);
        let hundred = Math.floor((num % 1000) / 100);
        let remainder = num % 100;

        if (crore > 0) {
            result += numberToWords(crore) + ' crore ';
        }
        if (lakh > 0) {
            result += numberToWords(lakh) + ' lakh ';
        }
        if (thousand > 0) {
            result += numberToWords(thousand) + ' thousand ';
        }
        if (hundred > 0) {
            result += ones[hundred] + ' hundred ';
        }
        if (remainder >= 20) {
            result += tens[Math.floor(remainder / 10)] + ' ';
            if (remainder % 10 > 0) {
                result += ones[remainder % 10] + ' ';
            }
        } else if (remainder >= 10) {
            result += teens[remainder - 10] + ' ';
        } else if (remainder > 0) {
            result += ones[remainder] + ' ';
        }

        return result.trim();
    };

    // Updated onSubmit function to save complete invoice data
    const onSubmit = async (data) => {
        // Create customer object from form data
        const customerData = {
            id: selectedCustomer?.id || `${Date?.now()}`,
            customerId: selectedCustomer?.customerId || `${Date?.now()}`,
            name: data?.customerName,
            phone: data?.customerPhone,
            address: data?.customerAddress,
            city: data?.customerCity,
            email: selectedCustomer?.email || '',
            state: selectedCustomer?.state || '',
            zipCode: selectedCustomer?.zipCode || '',
            country: selectedCustomer?.country || '',
            previousBalance: parseFloat(data?.previousBalance) || 0,
        };

        // Create invoice data
        const invoiceData = {
            id: isEditing ? editingInvoiceId?.id : Date?.now()?.toString(),
            invoiceNumber: isEditing ? editingInvoiceId?.invoiceNumber : data?.invoiceNumber,
            date: data?.date,
            customer: customerData,
            salesBy: data?.salesBy,
            supplier: data?.supplier,
            items: data?.items?.map((item, index) => ({
                id: selectedProduct?.[index]?.id || `ITEM-${Date?.now()}-${index}`,
                productId: selectedProduct?.[index]?.id || null,
                name: item?.productName,
                quantity: item?.quantity,
                unit: item?.unit,
                rate: item?.rate,
                amount: item?.amount,
                product: selectedProduct?.[index] || null // Store complete product data
            })),
            subTotal: Math.round(subTotal * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            discountAmount: Math.round(discountAmount * 100) / 100,
            total: Math.round(total * 100) / 100,
            totalQuantity,
            amountInWords: numberToWords(Math.floor(total)) + ' only',
            createdAt: new Date()?.toISOString(),
            status: isEditing ? editingInvoiceId?.status : 'pending'
        };

        let result
        if (isEditing) {
            result = await updateInvoice?.(editingInvoiceId?.id, invoiceData);
        } else {
            if (saveInvoice && typeof saveInvoice === 'function') {
                result = await saveInvoice?.(invoiceData);
            } else {
                showAlert('Save function not available', 'error');
            }
        }

        if (result?.success) {
            showAlert(`Invoice ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            setSelectedInvoice(invoiceData);
            setCurrentView('preview');
        } else {
            showAlert(`Error ${isEditing ? 'updating' : 'creating'} invoice: ${result?.message}`, 'error');
        }
    };

    // Updated handleNewInvoice function to reset all states
    const handleNewInvoice = () => {
        setIsEditing(false)
        reset({
            invoiceNumber: `INV-${Date?.now()}`,
            date: new Date()?.toISOString()?.split('T')[0],
            customerSearch: '',
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            customerCity: '',
            previousBalance: 0,
            salesBy: '',
            supplier: '',
            items: [{
                productSearch: '',
                productName: '',
                quantity: 1,
                unit: 'MASTER',
                rate: 0,
                amount: 0
            }]
        });

        setSelectedCustomer(null);
        setSelectedProduct([]);
        setSelectedInvoice(null);
        setShowCustomerDropdown(false);
        setShowProductDropdown({});
        setCurrentView('create');
    };

    // Delete invoice
    const handleDeleteInvoice = async (invoiceId) => {
        const confirmed = await showConfirm({
            title: "Delete Invoice",
            message: 'Are you sure you want to delete this invoice?',
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (confirmed) {
            const result = await deleteInvoice?.(invoiceId);
            if (result?.success) {
                showAlert(`Invoice deleted successfully!`, 'success');
            } else {
                showAlert(`Error deleting invoice: ${result?.error}`, 'error');
            }
        }
    };

    // Handle unit change in items
    const handleUnitChange = (index, newUnit) => {
        setValue(`items.${index}.unit`, newUnit);

        // Update rate based on selected product and new unit
        const selectedProductForItem = selectedProduct?.[index];
        if (selectedProductForItem) {
            let rate = 0;
            let quantity = 1;

            if (newUnit === 'MASTER') {
                rate = selectedProductForItem?.pricePerMaster;
                quantity = 1;
            } else if (newUnit === 'BOX') {
                rate = selectedProductForItem?.pricePerBox;
                quantity = 1;
            } else if (newUnit === 'HALF') {
                rate = selectedProductForItem?.pricePerBox;
                quantity = 1;
            }

            setValue(`items.${index}.rate`, rate);
            setValue(`items.${index}.quantity`, quantity);
        }

        // Recalculate amount after unit change
        setTimeout(() => calculateAmount(index), 0);
    };

    // Debounced search function
    const handleCustomerSearch = (searchValue) => {
        if (!searchValue || searchValue?.length === 0) {
            setShowCustomerDropdown(false);
            setFilteredCustomers([]);
            return;
        }

        if (selectedCustomer && selectedCustomer?.name === searchValue) {
            setShowCustomerDropdown(false);
            return;
        }

        const filtered = customers?.filter(customer =>
            customer?.name?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
            customer?.customerId?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
            customer?.phone?.includes(searchValue)
        );

        setFilteredCustomers(filtered);
        setShowCustomerDropdown(filtered?.length > 0);
    };

    const customerSearchValue = watch('customerSearch');
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleCustomerSearch(customerSearchValue);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [customerSearchValue, customers, selectedCustomer]);

    const handleInputChange = (e) => {
        const value = e?.target?.value;
        setValue('customerSearch', value);
        if (!value) {
            setSelectedCustomer(null);
            clearCustomerForm();
        }
    };

    const clearCustomerForm = () => {
        setValue('customerName', '');
        setValue('customerPhone', '');
        setValue('customerAddress', '');
        setValue('customerCity', '');
        setValue('previousBalance', 0);
    };

    const clearCustomerSearch = () => {
        setValue('customerSearch', '');
        setValue('customerName', '');
        setValue('customerPhone', '');
        setValue('customerAddress', '');
        setValue('customerCity', '');
        setValue('previousBalance', 0);
        setSelectedCustomer(null);
        setShowCustomerDropdown(false);
        setFilteredCustomers([]);
    };

    const handleEditInvoice = async (invoice) => {
        setIsEditing(true);
        setEditingInvoiceId(invoice);
        const result = await getInvoice?.(invoice?.id);
        if (result?.success) {
            const invoiceData = result?.data;

            // Set customer data
            setSelectedCustomer(invoiceData?.customer);

            // Set products data
            const products = invoiceData?.items?.map(item => item?.product || {
                id: item?.productId,
                name: item?.name,
                pricePerMaster: item?.rate,
                pricePerBox: item?.rate
            });
            setSelectedProduct(products);

            // Reset and populate the form
            reset({
                invoiceNumber: invoiceData?.invoiceNumber,
                date: invoiceData?.date?.split('T')[0], // Format date if needed
                customerSearch: invoiceData?.customer?.name,
                customerName: invoiceData?.customer?.name,
                customerPhone: invoiceData?.customer?.phone,
                customerAddress: invoiceData?.customer?.address,
                customerCity: invoiceData?.customer?.city,
                previousBalance: invoiceData?.customer?.previousBalance,
                salesBy: invoiceData?.salesBy,
                supplier: invoiceData?.supplier,
                items: invoiceData?.items?.map(item => ({
                    productSearch: item?.name,
                    productName: item?.name,
                    productId: item?.productId,
                    quantity: item?.quantity,
                    unit: item?.unit,
                    rate: item?.rate,
                    amount: item?.amount
                }))
            });

            // Set GST rate if available
            if (invoiceData?.discountAmount) {
                setDiscountAmount(invoiceData?.discountAmount);
            }
            setCurrentView('create');
        } else {
            showAlert('Failed to load invoice data', "error");
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setCurrentView('preview');
    };

    const filteredInvoices = allinvoice?.filter(invoice => {
        const matchesSearch = invoice?.invoiceNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
            invoice?.customer?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice?.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const calculateDashboardStats = () => {
        const totalInvoices = allinvoice?.length || 0;
        const totalAmount = allinvoice?.reduce((sum, inv) => sum + (inv?.total || 0), 0) || 0;
        const paidInvoices = allinvoice?.filter(inv => inv?.status === 'paid')?.length || 0;
        const pendingInvoices = allinvoice?.filter(inv => inv?.status === 'pending')?.length || 0;

        return { totalInvoices, totalAmount, paidInvoices, pendingInvoices };
    };

    // Real-time calculation updates
    useEffect(() => {
        // Recalculate all amounts when items change
        watchedItems?.forEach((_, index) => {
            calculateAmount(index);
        });
    }, [watchedItems, selectedProduct]);

    const stats = calculateDashboardStats();

    const [currentPage, setCurrentPage] = useState(1);
    const invoicesPerPage = 10;

    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
    const paginatedInvoices = filteredInvoices?.slice(indexOfFirstInvoice, indexOfLastInvoice);
    const totalPages = Math.ceil(filteredInvoices?.length / invoicesPerPage);

    const removeItem = (index) => {
        // Form field remove karein
        remove(index);

        // selectedProduct array se bhi remove karein
        setSelectedProduct(prevProducts => {
            const updatedProducts = [...prevProducts];
            updatedProducts.splice(index, 1);
            return updatedProducts;
        });

        // showProductDropdown state se bhi clean karein
        setShowProductDropdown(prevDropdown => {
            const updated = { ...prevDropdown };
            delete updated[index];

            // Re-index remaining dropdowns
            const newDropdown = {};
            Object.keys(updated).forEach(key => {
                const keyIndex = parseInt(key);
                if (keyIndex > index) {
                    newDropdown[keyIndex - 1] = updated[key];
                } else if (keyIndex < index) {
                    newDropdown[key] = updated[key];
                }
            });

            return newDropdown;
        });
    };

    const handlePreviousBalanceChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        const maxBalance = selectedCustomer?.previousBalance || 0;

        if (value > maxBalance) {
            showAlert(`Amount cannot exceed customer's previous balance of ${maxBalance}`, 'warning');
            setValue('previousBalance', maxBalance);
        } else {
            setValue('previousBalance', value);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <LoadingDemo message={"Loading Invoices..."} showBackground={false} />
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                <div className="flex justify-between">
                    <span>Error: {error}</span>
                    <button onClick={clearError} className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100">
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Dashboard View
    if (currentView === 'dashboard') {
        return (
            <div className="min-h-screen  p-4">
                {alert?.show && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert?.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                        : alert?.type === 'error'
                            ? 'bg-red-50 text-red-800 border-red-500'
                            : 'bg-blue-50 text-blue-800 border-blue-500'
                        }`}>
                        <div className="flex items-center">
                            <span className="font-medium">{alert?.message}</span>
                            <button
                                onClick={() => setAlert({ show: false, message: '', type: '' })}
                                className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-blue-500 dark:bg-blue-600 rounded-lg">
                                    <Receipt className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Management System</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Manage all your invoices in one place</p>
                                </div>
                            </div>
                            <div className='flex gap-2 items-center'>
                                <button
                                    onClick={handleExportInvoices}
                                    className="flex items-center px-4 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition-all duration-200"
                                >
                                    <Download size={18} className="mr-2" />
                                    <span className="font-medium">Export</span>
                                </button>
                                <button
                                    onClick={handleNewInvoice}
                                    className="flex items-center px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create New Invoice
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white overflow-x-auto whitespace-nowrap">{stats?.totalInvoices}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white overflow-x-auto whitespace-nowrap">{stats?.totalAmount?.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Invoices</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 overflow-x-auto whitespace-nowrap">{stats?.paidInvoices}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invoices</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 overflow-x-auto whitespace-nowrap max-w-[90%]">{stats?.pendingInvoices}</p>
                                </div>
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Invoices</h2>
                            <div className="flex items-center space-x-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search invoices..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e?.target?.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e?.target?.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                    <option value="all">All Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Invoice #</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Customer</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Items</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedInvoices?.map((invoice) => (
                                        <tr key={invoice?.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">{invoice?.invoiceNumber}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(invoice?.date)?.toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{invoice?.customer?.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoice?.customer?.customerId}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{invoice?.items?.length}</td>
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{invoice?.total}</td>
                                            <td className="py-3 px-4">
                                                {editingStatus === invoice?.id ? (
                                                    <select
                                                        value={invoice?.status}
                                                        onChange={(e) => handleStatusChange(invoice?.id, e?.target?.value)}
                                                        className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-1 focus:ring-1 focus:ring-blue-500"
                                                        autoFocus
                                                        onBlur={() => setEditingStatus(null)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="paid">Paid</option>
                                                    </select>
                                                ) : (
                                                    <div className={`flex items-center rounded-full justify-center gap-2 ${invoice?.status === 'paid'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                        invoice?.status === 'pending'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                        }`}>
                                                        <span className="px-2 py-1 text-xs font-medium">
                                                            {invoice?.status?.charAt(0)?.toUpperCase() + invoice?.status?.slice(1)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleStatusEdit(invoice)}
                                                            title="Edit status"
                                                            className="hover:opacity-75"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                        title="View Invoice"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <SmartPrintInvoice preview={true} selectedInvoice={invoice} onback={() => setCurrentView('dashboard')} />
                                                    <button
                                                        onClick={() => handleEditInvoice(invoice)}
                                                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInvoice(invoice?.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredInvoices?.length === 0 && (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Create your first invoice to get started.</p>
                                </div>
                            )}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            filteredInvoices={filteredInvoices}
                            indexOfFirstInvoice={indexOfFirstInvoice}
                            indexOfLastInvoice={indexOfLastInvoice}
                        />

                    </div>
                </div>
                <ConfirmDialog />
            </div>
        );
    }

    if (currentView === 'create') {
        return (
            <div className="min-h-screen p-4">
                {alert?.show && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert?.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                        : alert?.type === 'error'
                            ? 'bg-red-50 text-red-800 border-red-500'
                            : 'bg-blue-50 text-blue-800 border-blue-500'
                        }`}>
                        <div className="flex items-center">
                            <span className="font-medium">{alert?.message}</span>
                            <button
                                onClick={() => setAlert({ show: false, message: '', type: '' })}
                                className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="p-3 bg-blue-500 dark:bg-blue-600 rounded-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Update' : 'Create New'} Invoice</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Fill in the details to create a new invoice</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date()?.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Invoice Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Calculator className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                                Invoice Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                                    <input
                                        {...register('invoiceNumber', { required: 'Invoice number is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="INV-001"
                                    />
                                    {errors?.invoiceNumber && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.invoiceNumber?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        {...register('date', { required: 'Date is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    {errors?.date && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.date?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales By</label>
                                    <select
                                        {...register('salesBy')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    >
                                        <option value="">Select Sales Person</option>
                                        {setting?.saleBy?.map((person, index) => (
                                            <option key={index} value={person}>{person}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                                    <select
                                        {...register('supplier')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    >
                                        <option value="">Select Supplier</option>
                                        {setting?.suppliers?.map((supplier, index) => (
                                            <option key={index} value={supplier}>{supplier}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Customer Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                                Customer Information
                            </h2>

                            <div className="relative mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Customer</label>
                                <input
                                    {...register('customerSearch')}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="Search customer by name or ID..."
                                    autoComplete="off"
                                />
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={clearCustomerSearch}
                                        className="absolute right-4 top-[50%] text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}

                                {showCustomerDropdown && filteredCustomers?.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {filteredCustomers?.map((customer) => (
                                            <div
                                                key={customer?.id}
                                                onClick={() => selectCustomer(customer)}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900 dark:text-gray-200">{customer?.name}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{customer?.customerId} - {customer?.address}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Customer Details Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                                    <input
                                        {...register('customerName', { required: 'Customer name is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter customer name"
                                    />
                                    {errors?.customerName && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.customerName?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        {...register('customerPhone', { required: 'Phone is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter phone number"
                                    />
                                    {errors?.customerPhone && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.customerPhone?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <input
                                        {...register('customerAddress', { required: 'Address is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter address"
                                    />
                                    {errors?.customerAddress && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.customerAddress?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                    <input
                                        {...register('customerCity', { required: 'City is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter city"
                                    />
                                    {errors?.customerCity && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.customerCity?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previous Balance</label>
                                    <input
                                        type="number"
                                        {...register('previousBalance', {
                                            min: { value: 0, message: 'Previous balance cannot be negative' },
                                            validate: (value) => {
                                                const maxBalance = selectedCustomer?.previousBalance || 0;
                                                if (parseFloat(value) > maxBalance) {
                                                    return `Amount cannot exceed customer's previous balance of ${maxBalance}`;
                                                }
                                                return true;
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter previous balance"
                                        onChange={handlePreviousBalanceChange}
                                        max={selectedCustomer?.previousBalance || 0}
                                        defaultValue={selectedCustomer?.previousBalance || 0}
                                    />
                                    {errors?.previousBalance && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.previousBalance?.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Package className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                                    Invoice Items
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => append({
                                        productSearch: '',
                                        productName: '',
                                        quantity: 1,
                                        unit: 'MASTER',
                                        rate: 0,
                                        amount: 0
                                    })}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </button>
                            </div>

                            <div>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-8">Sr.</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Product</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-24">Quantity</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-24">Unit</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-24">Rate</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-24">Amount</th>
                                            <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-12">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields?.map((field, index) => (
                                            <tr key={field?.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                                                <td className="py-2 px-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-200">{index + 1}</span>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="relative">
                                                        <input
                                                            {...register(`items.${index}.productSearch`)}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 mb-1"
                                                            placeholder="Search product..."
                                                            autoComplete="off"
                                                            onChange={(e) => handleProductSearch(e?.target?.value, index)}
                                                        />
                                                        <input
                                                            {...register(`items.${index}.productName`, { required: 'Product name is required' })}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                            placeholder="Product name"
                                                        />
                                                        {showProductDropdown?.[index] && filteredProducts?.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                                {filteredProducts?.map((product) => (
                                                                    <div
                                                                        key={product?.id}
                                                                        onClick={() => selectProduct(product, index)}
                                                                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm last:border-b-0"
                                                                    >
                                                                        <div className="font-medium text-gray-900 dark:text-gray-200">{product?.name}</div>
                                                                        <div className="text-xs text-gray-600 dark:text-gray-200/50">
                                                                            Master: {product?.pricePerMaster} | Box: {product?.pricePerBox}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        min="0"
                                                        step="any"
                                                        type="number"
                                                        {...register(`items.${index}.quantity`, {
                                                            required: 'Quantity is required',
                                                            min: { value: 0, message: 'Minimum quantity is 1' }
                                                        })}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                        onChange={(e) => {
                                                            setValue(`items.${index}.quantity`, e?.target?.value);
                                                            setTimeout(() => calculateAmount(index), 0);
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <select
                                                        {...register(`items.${index}.unit`)}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                        onChange={(e) => handleUnitChange(index, e?.target?.value)}
                                                    >
                                                        <option value="MASTER">MASTER</option>
                                                        <option value="BOX">BOX</option>
                                                        <option value="HALF">Dozen</option>
                                                    </select>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`items.${index}.rate`, {
                                                            required: 'Rate is required',
                                                            min: { value: 0.01, message: 'Rate must be greater than 0' }
                                                        })}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                        min="0.01"
                                                        onChange={(e) => {
                                                            setValue(`items.${index}.rate`, e?.target?.value);
                                                            setTimeout(() => calculateAmount(index), 0);
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`items.${index}.amount`)}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none"
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    {fields?.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="p-1 text-red-600 hover:text-red-800"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Calculator className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                                Invoice Summary
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Discount Amount (Rs.)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={subTotal}
                                            defaultValue="" // Use defaultValue instead of value
                                            onChange={(e) => {
                                                const value = parseFloat(e?.target?.value) || 0;
                                                if (e?.target?.value === '') {
                                                    setDiscountAmount(0);
                                                } else if (value <= subTotal) {
                                                    setDiscountAmount(value);
                                                } else {
                                                    showAlert('Discount cannot exceed subtotal amount', 'warning');
                                                    e.target.value = subTotal; // Reset input to max value
                                                    setDiscountAmount(subTotal);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-white">Total Quantity:</span>
                                            <span className="font-medium">{totalQuantity}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-white">Subtotal:</span>
                                            <span className="font-medium">{subTotal}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-white">Discount:</span>
                                            <span className="font-medium text-red-600">-{discount?.toFixed(2)}</span>
                                        </div>
                                        {previousBalance > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-white">Previous Balance:</span>
                                                <span className="font-medium text-orange-600">{previousBalance?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <hr className="my-2" />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Final Total:</span>
                                            <span className="text-blue-600">{total}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-white mt-2">
                                            <strong>In Words:</strong> {numberToWords(Math.floor(total))} only
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setCurrentView('dashboard')}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-lg"
                            >
                                {isEditing ? 'Update Invoice' : 'Create Invoice'}
                            </button>
                        </div>
                    </form>
                </div >
            </div >
        );
    }

    // Preview Invoice View
    if (currentView === 'preview' && selectedInvoice) {
        return (
            <div className="min-h-screen">
                {alert?.show && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert?.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                        : alert?.type === 'error'
                            ? 'bg-red-50 text-red-800 border-red-500'
                            : 'bg-blue-50 text-blue-800 border-blue-500'
                        }`}>
                        <div className="flex items-center">
                            <span className="font-medium">{alert?.message}</span>
                            <button
                                onClick={() => setAlert({ show: false, message: '', type: '' })}
                                className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <SmartPrintInvoice selectedInvoice={selectedInvoice} onback={() => setCurrentView('dashboard')} />

            </div>
        );
    }

    return null;
};

export default InvoiceManagement;