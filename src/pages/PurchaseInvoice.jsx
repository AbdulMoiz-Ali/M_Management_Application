import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    Search, Plus, Trash2, Calculator, FileText, User, Package, Eye, Download,
    Printer, Save, X, Edit, Filter, Calendar, DollarSign, Users, Receipt,
    ArrowLeft, ExternalLink, ShoppingCart, Truck
} from 'lucide-react';
import { useProduct } from '../hooks/useProduct';
import { usePurchaseInvoice } from '../hooks/usePurchaseInvoice';
import SmartPrintInvoice from '../components/SmartPrintInvoice';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Pagination';
import LoadingDemo from '../components/LoadingDemo';
import useConfirmDialog from '../components/ConfirmationDialog';

const PurchaseInvoice = () => {
    const { products, updateProductStock } = useProduct();

    const { user } = useAuth();

    const setting = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
        shopAddress: "Sukkur",
        shopContactPhone: ["03042187313", "03003187980"],
        receivedBy: ["izhar udin mamon", "store manager"],
        purchaseFrom: ["Sukkur warehouse supplier", "Karachi distributor"],
    }

    // Using all purchase hook functionalities
    const {
        allPurchaseInvoices,
        loading,
        error,
        loadPurchaseInvoices,
        savePurchaseInvoice,
        deletePurchaseInvoice,
        getPurchaseInvoice,
        searchPurchaseInvoices,
        exportPurchaseInvoices,
        updatePurchaseInvoice,
        clearError,
        updatePurchaseInvoiceStatus,
        setSelectedPurchaseInvoice: setHookSelectedPurchaseInvoice
    } = usePurchaseInvoice();

    const { showConfirm, ConfirmDialog } = useConfirmDialog();

    useEffect(() => {
        loadPurchaseInvoices?.();
    }, [loadPurchaseInvoices]);

    const [currentView, setCurrentView] = useState('dashboard');

    const handleExportPurchaseInvoices = async () => {
        const result = await exportPurchaseInvoices?.();
        if (result?.success) {
            showAlert(`Purchase invoices exported successfully to: ${result?.path}`, 'success');
        } else {
            showAlert(`Export failed: ${result?.error}`, 'error');
        }
    };

    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isEditing, setIsEditing] = useState(false);
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
    // Purchase invoice creation states
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState({});
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [editingStatus, setEditingStatus] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const handleStatusEdit = (invoice) => {
        setEditingStatus(invoice?.id);
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    const handleStatusChange = async (invoiceId, newStatus) => {
        try {
            const result = await updatePurchaseInvoiceStatus?.(invoiceId, newStatus);
            showAlert(result?.success ? `Status updated to ${newStatus}` : result?.error, result?.success ? 'success' : 'error');
            setEditingStatus(null);

            if (newStatus === 'received') {
                const invoice = result?.data;
                const invoiceTotal = invoice?.total || 0;

                // Update product stock when purchase is received
                invoice?.items?.forEach(async (item) => {
                    if (item?.productId) {
                        await updateProductStock?.(item?.productId, item?.quantity, 'add');
                    }
                });
            }
        } catch (error) {
            showAlert('Failed to update status', "error")
        }
    };

    // Updated form default values
    const { register, control, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm({
        defaultValues: {
            purchaseInvoiceNumber: `PUR-${Date?.now()}`,
            date: new Date()?.toISOString()?.split('T')[0],
            supplierName: '',
            supplierPhone: '',
            supplierAddress: '',
            previousBalance: 0,
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
            const result = await searchPurchaseInvoices?.(searchTerm);
            if (result?.success) {
                // console.log('Search results:', result?.data);
            }
        }
    };

    const watchedItems = watch("items");

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

        // Set default rate based on unit type (for purchase, you might have different rates)
        const currentUnit = getValues(`items.${index}.unit`) || 'MASTER';
        const rate = currentUnit === 'MASTER' ? product?.purchasePricePerMaster || product?.pricePerMaster : product?.purchasePricePerBox || product?.pricePerBox;
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

    const calculateAmount = (index) => {
        const items = getValues("items");
        const quantity = items?.[index]?.quantity || 0;
        const unit = items?.[index]?.unit || 'MASTER';

        // Get the selected product for this item
        const selectedProductForItem = selectedProduct?.[index];
        if (selectedProductForItem) {
            let rate = 0;

            if (unit === 'MASTER') {
                rate = selectedProductForItem?.purchasePricePerMaster || selectedProductForItem?.pricePerMaster;
            } else if (unit === 'BOX') {
                rate = selectedProductForItem?.purchasePricePerBox || selectedProductForItem?.pricePerBox;
            } else if (unit === 'HALF') {
                // Dozen: Set rate as half of purchase master price
                rate = selectedProductForItem?.purchasePricePerDozen || selectedProductForItem?.pricePerDozen;
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

    const { subTotal, discount, previousBalance, total, totalQuantity } = calculateTotals();

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

    // Updated onSubmit function to save complete purchase invoice data
    const onSubmit = async (data) => {
        // Create supplier object from form data
        const supplierData = {
            id: selectedSupplier?.id || `${Date?.now()}`,
            name: data?.supplierName,
            phone: data?.supplierPhone,
            address: data?.supplierAddress,
            previousBalance: parseFloat(data?.previousBalance) || 0,
        };

        // Create purchase invoice data
        const purchaseInvoiceData = {
            id: isEditing ? editingInvoiceId?.id : Date?.now()?.toString(),
            purchaseInvoiceNumber: isEditing ? editingInvoiceId?.purchaseInvoiceNumber : data?.purchaseInvoiceNumber,
            date: data?.date,
            supplier: supplierData,
            items: data?.items?.map((item, index) => ({
                id: selectedProduct?.[index]?.id || `ITEM-${Date?.now()}-${index}`,
                productId: selectedProduct?.[index]?.id || null,
                name: item?.productName,
                quantity: item?.quantity,
                unit: item?.unit,
                rate: item?.rate,
                amount: item?.amount,
                product: selectedProduct?.[index] || null
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
            result = await updatePurchaseInvoice?.(editingInvoiceId?.id, purchaseInvoiceData);
        } else {
            if (savePurchaseInvoice && typeof savePurchaseInvoice === 'function') {
                result = await savePurchaseInvoice?.(purchaseInvoiceData);
            } else {
                showAlert('Save function not available', 'error');
            }
        }

        if (result?.success) {
            showAlert(`Purchase invoice ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            setSelectedPurchaseInvoice(purchaseInvoiceData);
            setCurrentView('preview');
        } else {
            showAlert(`Error ${isEditing ? 'updating' : 'creating'} purchase invoice: ${result?.message}`, 'error');
        }
    };

    // Updated handleNewPurchaseInvoice function to reset all states
    const handleNewPurchaseInvoice = () => {
        setIsEditing(false)
        reset({
            purchaseInvoiceNumber: `PUR-${Date?.now()}`,
            date: new Date()?.toISOString()?.split('T')[0],
            supplierName: '',
            supplierPhone: '',
            supplierAddress: '',
            previousBalance: 0,
            items: [{
                productSearch: '',
                productName: '',
                quantity: 1,
                unit: 'MASTER',
                rate: 0,
                amount: 0
            }]
        });

        setSelectedSupplier(null);
        setSelectedProduct([]);
        setSelectedPurchaseInvoice(null);
        setShowProductDropdown({});
        setCurrentView('create');
    };

    // Delete purchase invoice
    const handleDeletePurchaseInvoice = async (invoiceId) => {
        const confirmed = await showConfirm({
            title: "Delete Purchase Invoice",
            message: 'Are you sure you want to delete this purchase invoice?',
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (confirmed) {
            const result = await deletePurchaseInvoice?.(invoiceId);
            if (result?.success) {
                showAlert(`Purchase invoice deleted successfully!`, 'success');
            } else {
                showAlert(`Error deleting purchase invoice: ${result?.error}`, 'error');
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
                rate = selectedProductForItem?.purchasePricePerMaster || selectedProductForItem?.pricePerMaster;
                quantity = 1;
            } else if (newUnit === 'BOX') {
                rate = selectedProductForItem?.purchasePricePerBox || selectedProductForItem?.pricePerBox;
                quantity = 1;
            } else if (newUnit === 'HALF') {
                rate = selectedProductForItem?.purchasePricePerDozen || selectedProductForItem?.pricePerDozen;
                quantity = 1;
            }

            setValue(`items.${index}.rate`, rate);
            setValue(`items.${index}.quantity`, quantity);
        }

        // Recalculate amount after unit change
        setTimeout(() => calculateAmount(index), 0);
    };

    const handleEditPurchaseInvoice = async (invoice) => {
        setIsEditing(true);
        setEditingInvoiceId(invoice);
        const result = await getPurchaseInvoice?.(invoice?.id);
        if (result?.success) {
            const invoiceData = result?.data;

            // Set supplier data
            setSelectedSupplier(invoiceData?.supplier);

            // Set products data
            const products = invoiceData?.items?.map(item => item?.product || {
                id: item?.productId,
                name: item?.name,
                purchasePricePerMaster: item?.rate,
                purchasePricePerDozen: item?.rate,
                purchasePricePerBox: item?.rate,
                pricePerMaster: item?.rate,
                pricePerDozen: item?.rate,
                pricePerBox: item?.rate
            });
            setSelectedProduct(products);

            // Reset and populate the form
            reset({
                purchaseInvoiceNumber: invoiceData?.purchaseInvoiceNumber,
                date: invoiceData?.date?.split('T')[0],
                supplierName: invoiceData?.supplier?.name,
                supplierPhone: invoiceData?.supplier?.phone,
                supplierAddress: invoiceData?.supplier?.address,
                previousBalance: invoiceData?.supplier?.previousBalance,
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

            if (invoiceData?.discountAmount) {
                setDiscountAmount(invoiceData?.discountAmount);
            }
            setCurrentView('create');
        } else {
            showAlert('Failed to load purchase invoice data', "error");
        }
    };

    const handleViewPurchaseInvoice = (invoice) => {
        setSelectedPurchaseInvoice(invoice);
        setCurrentView('preview');
    };

    const filteredPurchaseInvoices = allPurchaseInvoices?.filter(invoice => {
        const matchesSearch = invoice?.purchaseInvoiceNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
            invoice?.supplier?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice?.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const calculateDashboardStats = () => {
        const totalInvoices = allPurchaseInvoices?.length || 0;
        const totalAmount = allPurchaseInvoices?.reduce((sum, inv) => sum + (inv?.total || 0), 0) || 0;
        const receivedInvoices = allPurchaseInvoices?.filter(inv => inv?.status === 'received')?.length || 0;
        const pendingInvoices = allPurchaseInvoices?.filter(inv => inv?.status === 'pending')?.length || 0;

        return { totalInvoices, totalAmount, receivedInvoices, pendingInvoices };
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
    const paginatedInvoices = filteredPurchaseInvoices?.slice(indexOfFirstInvoice, indexOfLastInvoice);
    const totalPages = Math.ceil(filteredPurchaseInvoices?.length / invoicesPerPage);

    const removeItem = (index) => {
        remove(index);

        setSelectedProduct(prevProducts => {
            const updatedProducts = [...prevProducts];
            updatedProducts.splice(index, 1);
            return updatedProducts;
        });

        setShowProductDropdown(prevDropdown => {
            const updated = { ...prevDropdown };
            delete updated[index];

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
        const maxBalance = selectedSupplier?.previousBalance || 0;

        if (value > maxBalance) {
            showAlert(`Amount cannot exceed supplier's previous balance of ${maxBalance}`, 'warning');
            setValue('previousBalance', maxBalance);
        } else {
            setValue('previousBalance', value);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <LoadingDemo message={"Loading Purchase Invoices..."} showBackground={false} />
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
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-green-500 dark:bg-green-600 rounded-lg">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Invoice Management</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Manage all your purchase invoices and supplier transactions</p>
                                </div>
                            </div>
                            <div className='flex gap-2 items-center'>
                                <button
                                    onClick={handleExportPurchaseInvoices}
                                    className="flex items-center px-4 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition-all duration-200"
                                >
                                    <Download size={18} className="mr-2" />
                                    <span className="font-medium">Export</span>
                                </button>
                                <button
                                    onClick={handleNewPurchaseInvoice}
                                    className="flex items-center px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-lg"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create New Purchase
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white overflow-x-auto whitespace-nowrap">{stats?.totalInvoices}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white overflow-x-auto whitespace-nowrap">{stats?.totalAmount?.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between w-full gap-4">
                                <div className='max-w-[70%]'>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Received Orders</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 overflow-x-auto whitespace-nowrap">{stats?.receivedInvoices}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Truck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 overflow-x-auto whitespace-nowrap max-w-[90%]">{stats?.pendingInvoices}</p>
                                </div>
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Invoices Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Purchase Orders</h2>
                            <div className="flex items-center space-x-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search purchases..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e?.target?.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e?.target?.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                >
                                    <option value="all">All Status</option>
                                    <option value="received">Received</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Purchase #</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Items</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedInvoices?.map((invoice) => (
                                        <tr key={invoice?.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">{invoice?.purchaseInvoiceNumber}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(invoice?.date)?.toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{invoice?.supplier?.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoice?.supplier?.address || invoice?.supplier?.phone || "No Detail Found"}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{invoice?.items?.length}</td>
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{invoice?.total}</td>
                                            <td className="py-3 px-4">
                                                {editingStatus === invoice?.id ? (
                                                    <select
                                                        value={invoice?.status}
                                                        onChange={(e) => handleStatusChange(invoice?.id, e?.target?.value)}
                                                        className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded p-1 focus:ring-1 focus:ring-green-500"
                                                        autoFocus
                                                        onBlur={() => setEditingStatus(null)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="received">Received</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                ) : (
                                                    <div className={`flex items-center rounded-full justify-center gap-2 ${invoice?.status === 'received'
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
                                                        onClick={() => handleViewPurchaseInvoice(invoice)}
                                                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                                        title="View Purchase Invoice"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <SmartPrintInvoice preview={true} selectedInvoice={invoice} onback={() => setCurrentView('dashboard')} type="purchase" />
                                                    <button
                                                        onClick={() => handleEditPurchaseInvoice(invoice)}
                                                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                        title="Edit Purchase Invoice"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePurchaseInvoice(invoice?.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                                                        title="Delete Purchase Invoice"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredPurchaseInvoices?.length === 0 && (
                                <div className="text-center py-8">
                                    <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No purchase invoices found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Create your first purchase order to get started.</p>
                                </div>
                            )}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            filteredInvoices={filteredPurchaseInvoices}
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
                                <div className="p-3 bg-green-500 dark:bg-green-600 rounded-lg">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Update' : 'Create New'} Purchase Order</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Fill in the details to create a purchase order</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date()?.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Purchase Invoice Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Calculator className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                Purchase Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Number</label>
                                    <input
                                        {...register('purchaseInvoiceNumber', { required: 'Purchase number is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                        placeholder="PUR-001"
                                    />
                                    {errors?.purchaseInvoiceNumber && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.purchaseInvoiceNumber?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        {...register('date', { required: 'Date is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                    />
                                    {errors?.date && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.date?.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Truck className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                Supplier Information
                            </h2>

                            {/* Supplier Details Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier/Shop Name</label>
                                    <input
                                        {...register('supplierName', { required: 'Supplier/Shop name is required' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                        placeholder="Enter supplier/shop name"
                                    />
                                    {errors?.supplierName && <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errors?.supplierName?.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        {...register('supplierPhone')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <input
                                        {...register('supplierAddress')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                        placeholder="Enter address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Package className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                    Purchase Items
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
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 mb-1"
                                                            placeholder="Search product..."
                                                            autoComplete="off"
                                                            onChange={(e) => handleProductSearch(e?.target?.value, index)}
                                                        />
                                                        <input
                                                            {...register(`items.${index}.productName`, { required: 'Product name is required' })}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
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
                                                                            Purchase - Master: {product?.purchasePricePerMaster || product?.pricePerMaster} | Box: {product?.purchasePricePerBox || product?.pricePerBox}  | Dozen: {product?.purchasePricePerDozen || product?.pricePerDozen}
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
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                                        onChange={(e) => {
                                                            setValue(`items.${index}.quantity`, e?.target?.value);
                                                            setTimeout(() => calculateAmount(index), 0);
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <select
                                                        {...register(`items.${index}.unit`)}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
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
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
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
                                <Calculator className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                Purchase Summary
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
                                            defaultValue=""
                                            onChange={(e) => {
                                                const value = parseFloat(e?.target?.value) || 0;
                                                if (e?.target?.value === '') {
                                                    setDiscountAmount(0);
                                                } else if (value <= subTotal) {
                                                    setDiscountAmount(value);
                                                } else {
                                                    showAlert('Discount cannot exceed subtotal amount', 'warning');
                                                    e.target.value = subTotal;
                                                    setDiscountAmount(subTotal);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
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
                                            <span className="text-green-600">{total}</span>
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
                                className="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-lg"
                            >
                                {isEditing ? 'Update Purchase' : 'Create Purchase Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Preview Purchase Invoice View
    if (currentView === 'preview' && selectedPurchaseInvoice) {
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
                <SmartPrintInvoice selectedInvoice={selectedPurchaseInvoice} onback={() => setCurrentView('dashboard')} type="purchase" />
            </div>
        );
    }

    return null;
};

export default PurchaseInvoice