import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {
    Search,
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    DollarSign,
    Eye,
    Edit,
    Trash2,
    X,
    ChevronRight,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Plus,
    Save,
    ArrowLeft,
    Download,
    Info
} from 'lucide-react';
import { useCustomer } from '../hooks/useCustomer';
import { useInvoice } from '../hooks/useInvoice';
import SmartPrintInvoice from '../components/SmartPrintInvoice';
import Customerhistory from '../components/Customerhistory';
import Pagination from '../components/Pagination';
import LoadingDemo from '../components/LoadingDemo';
import useConfirmDialog from '../components/ConfirmationDialog';

const CustomerManagement = () => {
    const {
        customers,
        filteredCustomers,
        selectedCustomer,
        customerHistory,
        loading,
        error,
        searchTerm,
        totalPages,
        setCurrentPage,
        currentPage,
        indexOfFirstInvoice,
        indexOfLastInvoice,
        paginatedInvoices,
        createCustomer,
        customerbalance,
        updateCustomer,
        deleteCustomer,
        selectCustomer,
        searchCustomers,
        exportCustomers,
        clearError,
        setSearchTerm
    } = useCustomer();

    const { showConfirm, ConfirmDialog } = useConfirmDialog();

    const {
        clientinvoice,
        getInvoicesByCustomer
    } = useInvoice();

    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [invoicesCustomer, setInvoicesCustomer] = useState([]);
    const [invoicesCustomerloading, setInvoicesCustomerloading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    useEffect(() => {
        setInvoicesCustomer(clientinvoice)
    }, [clientinvoice, activeTab])

    // React Hook Form setup
    const methods = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            notes: '',
            previousBalance: 0,
        },
        mode: 'onChange'
    });

    const { handleSubmit, reset, formState: { errors, isSubmitting } } = methods;

    // Handle errors from the hook
    useEffect(() => {
        if (error) {
            showAlert(error, 'error');
            clearError?.();
        }
    }, [error, showAlert, clearError]);

    const resetForm = () => {
        reset({
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            notes: '',
            previousBalance: 0,
        });
        setEditingCustomer(null);
    };

    const onSubmit = async (data) => {
        try {
            let result;
            if (editingCustomer) {
                result = await updateCustomer?.(editingCustomer?.id, data);
                if (result?.success) {
                    showAlert('Customer updated successfully', 'success');
                }
            } else {
                result = await createCustomer?.(data);
                if (result?.success) {
                    showAlert('Customer created successfully', 'success');
                }
            }

            if (result?.success) {
                setShowModal(false);
                resetForm();
            } else {
                showAlert(result?.error || 'Error saving customer', 'error');
            }
        } catch (error) {
            showAlert('Error saving customer', 'error');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        reset({
            name: customer?.name || '',
            email: customer?.email || '',
            phone: customer?.phone || '',
            address: customer?.address || '',
            city: customer?.city || '',
            notes: customer?.notes || '',
            previousBalance: customer?.previousBalance || 0,
        });
        setShowModal(true);
        selectCustomer?.(null)
    };

    const handleDelete = async (customer) => {
        const confirmed = await showConfirm({
            title: "Delete Customer",
            message: `Are you sure you want to delete "${customer?.name}"?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (confirmed) {
            const result = await deleteCustomer?.(customer?.id);
            if (result?.success) {
                showAlert('Customer deleted successfully', 'success');
            } else {
                showAlert(result?.error, 'error');
            }
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setActiveTab('preview');
    };

    const handleViewDetails = async (customer) => {
        try {
            await selectCustomer?.(customer);
            await getInvoicesByCustomer?.(customer?.id);
            const result = await customerbalance?.(customer?.id);
        } catch {
            // console.log("error ln:174")
        } finally {
            setInvoicesCustomerloading(false);
            setActiveTab('details');
        }
    };

    const calc = {
        pending: invoicesCustomer?.filter(inv => inv?.status === "pending")
            ?.reduce((sum, inv) => sum + (inv?.total || 0), 0) || 0,
        paid: invoicesCustomer?.filter(inv => inv?.status === "paid")
            ?.reduce((sum, inv) => (sum + (inv?.total || 0)), 0) || 0,
        total: invoicesCustomer?.reduce((sum, inv) => sum + (inv?.total || 0), 0) || 0
    };

    const handleExport = async () => {
        try {
            const result = await exportCustomers?.();

            if (result?.success) {
                showAlert(`Products exported to Excel successfully!`, 'success');
            } else if (result?.canceled) {
                showAlert('Export was canceled', 'info');
            } else {
                showAlert(`Export failed: ${result?.error}`, 'error');
            }
        } catch (error) {
            showAlert(`Export error: ${error?.message}`, 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString)?.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <LoadingDemo message={"Loading customers..."} showBackground={false} />
        );
    }

    const getInitials = (name) => {
        if (!name) return '';
        const words = name?.trim()?.split(' ')?.filter(Boolean);

        if (words?.length === 1) {
            return words?.[0]?.[0]?.toUpperCase() || '';
        } else {
            return (words?.[0]?.[0] + words?.[1]?.[0])?.toUpperCase() || '';
        }
    };

    // Customer Details View
    if (selectedCustomer) {
        return (
            <div className="px-6 py-4 min-h-screen">
                {!(activeTab === 'preview' && selectedInvoice) &&
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <button
                                    onClick={() => selectCustomer?.(null)}
                                    className="mr-4 p-2 dark:text-gray-400 dark:hover:text-gray-300 text-gray-400 hover:text-gray-600 dark:hover:bg-gray-800 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold dark:text-white text-gray-900">{selectedCustomer?.name}</h1>
                                    <p className="dark:text-gray-400 text-gray-600">Customer ID: {selectedCustomer?.customerId}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleEdit(selectedCustomer)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Customer
                                </button>
                            </div>
                        </div>

                        <div className="border-b dark:border-gray-700 border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                                        ? 'dark:border-blue-400 dark:text-blue-400 border-blue-500 text-blue-600'
                                        : 'border-transparent dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                                        ? 'dark:border-blue-400 dark:text-blue-400 border-blue-500 text-blue-600'
                                        : 'border-transparent dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Purchase History
                                </button>
                            </nav>
                        </div>
                    </>
                }

                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="dark:bg-gray-800 bg-white shadow-lg rounded-xl p-6 border dark:border-gray-700 border-gray-200">
                            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-700 border-gray-200">
                                Contact Information
                            </h3>

                            {(!selectedCustomer?.email && !selectedCustomer?.phone && !selectedCustomer?.address) ? (
                                <div className="flex flex-col items-center justify-center text-center py-6">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
                                        <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium break-all">
                                        Customer hasn't provided any contact details yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedCustomer?.email && (
                                        <div className="flex items-center">
                                            <Mail className="h-5 w-5 dark:text-gray-400 text-gray-400 mr-3" />
                                            <span className="dark:text-gray-300 text-gray-900">{selectedCustomer?.email}</span>
                                        </div>
                                    )}

                                    {selectedCustomer?.phone && (
                                        <div className="flex items-center">
                                            <Phone className="h-5 w-5 dark:text-gray-400 text-gray-400 mr-3" />
                                            <span className="dark:text-gray-300 text-gray-900">{selectedCustomer?.phone}</span>
                                        </div>
                                    )}

                                    {selectedCustomer?.address && (
                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 dark:text-gray-400 text-gray-400 mr-3 mt-0.5" />
                                            <div>
                                                <div className="dark:text-gray-300 text-gray-900">{selectedCustomer?.address}</div>
                                                {selectedCustomer?.city && (
                                                    <div className="dark:text-gray-300 text-gray-900">{selectedCustomer?.city}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="dark:bg-gray-800 bg-white shadow-lg rounded-xl p-6 border dark:border-gray-700 border-gray-200">
                            <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-5 pb-2 border-b dark:border-gray-700 border-gray-200">Financial Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="dark:text-gray-400 text-gray-600 font-medium">Pending Amount:</span>
                                    <span className="font-semibold text-amber-500">Rs. {calc?.pending}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="dark:text-gray-400 text-gray-600 font-medium">Amount Paid:</span>
                                    <span className="font-semibold text-green-500">Rs. {calc?.paid}</span>
                                </div>
                                <div className="py-3 border-t dark:border-gray-700 border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="dark:text-gray-400 text-gray-600 font-medium">Balance:</span>
                                        <div className="text-right">
                                            <div className="text-sm dark:text-gray-500 text-gray-500 mb-1">Pending Amount (Manual) + Pending Amount</div>
                                            <div className={`text-lg font-semibold ${(selectedCustomer?.previousBalance + selectedCustomer?.calculatedBalance) < 0
                                                ? 'text-red-500'
                                                : 'dark:text-gray-200 text-gray-800'
                                                }`}>
                                                Rs. {(selectedCustomer?.previousBalance || 0) + (selectedCustomer?.calculatedBalance || 0)}
                                            </div>
                                            <div className="text-xs dark:text-gray-500 text-gray-400 mt-1">
                                                (Rs. {selectedCustomer?.previousBalance || 0} + Rs. {selectedCustomer?.calculatedBalance || 0})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700 border-gray-200">
                                    <span className="dark:text-gray-400 text-gray-600 font-medium">Total Purchases:</span>
                                    <span className="font-semibold text-blue-500">Rs. {calc?.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="dark:bg-gray-800 bg-white shadow-lg rounded-xl p-6 lg:col-span-2 border dark:border-gray-700 border-gray-200">
                            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-700 border-gray-200">Additional Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-400 text-gray-700">Customer Since</label>
                                    <p className="mt-1 dark:text-gray-300 text-gray-900">{formatDate(selectedCustomer?.createdAt)}</p>
                                </div>
                                {selectedCustomer?.notes && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium dark:text-gray-400 text-gray-700">Notes</label>
                                        <p className="mt-1 dark:text-gray-300 text-gray-900">{selectedCustomer?.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && <Customerhistory invoicesCustomer={invoicesCustomer} invoicesCustomerloading={invoicesCustomerloading} handleViewInvoice={handleViewInvoice} />}
                {(activeTab === 'preview' && selectedInvoice) && (
                    <>
                        <SmartPrintInvoice selectedInvoice={selectedInvoice} onback={() => { setActiveTab("history") }} />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="px-6 py-4">
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white text-gray-900">Customer Management</h1>
                    <p className="dark:text-gray-400 text-gray-600">Manage your customer information and track their purchase history</p>
                </div>
                <div className='flex justify-center items-center gap-3'>
                    <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border border-transparent rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Download size={18} className="mr-2" />
                        <span className="font-medium">Export</span>
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Customer
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative rounded-xl shadow-sm max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 dark:text-gray-400 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 rounded-xl text-black shadow-sm"
                        placeholder="Search customers by name, email, phone, or customer ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm?.(e?.target?.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="dark:bg-gray-800 bg-white shadow-xl overflow-hidden rounded-xl border dark:border-gray-700 border-gray-200">
                {filteredCustomers?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y dark:divide-gray-700 divide-gray-200">
                            <thead className="dark:bg-gray-700 bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-300 text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-300 text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-300 text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-300 text-gray-500 uppercase tracking-wider">
                                        Financial
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium dark:text-gray-300 text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="dark:bg-gray-800 bg-white divide-y dark:divide-gray-700 divide-gray-200">
                                {paginatedInvoices?.map((customer) => (
                                    <tr key={customer?.id} className="dark:hover:bg-gray-700 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {getInitials(customer?.name)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium dark:text-white text-gray-900">{customer?.name}</div>
                                                    <div className="text-xs dark:text-gray-400 text-gray-500">ID: {customer?.customerId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm dark:text-gray-300 text-gray-900">{customer?.email}</div>
                                            {customer?.phone && (
                                                <div className="text-xs dark:text-gray-400 text-gray-500">{customer?.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer?.city ? (
                                                <div className="text-sm dark:text-gray-300 text-gray-900">{customer?.city}</div>
                                            ) : (
                                                <span className="text-sm dark:text-gray-400 text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm dark:text-gray-300 text-gray-900">
                                                <div>Previous Balance: <span className="font-medium text-green-500">Rs. {customer?.previousBalance}</span></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(customer)}
                                                    className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-1 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="text-green-500 hover:text-green-700 dark:hover:text-green-400 p-1 rounded transition-colors"
                                                    title="Edit Customer"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer)}
                                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition-colors"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-6 py-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                filteredInvoices={filteredCustomers}
                                indexOfFirstInvoice={indexOfFirstInvoice}
                                indexOfLastInvoice={indexOfLastInvoice}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 dark:text-gray-500 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium dark:text-white text-gray-900">No customers found</h3>
                        <p className="mt-1 text-sm dark:text-gray-400 text-gray-500">
                            {searchTerm
                                ? 'No customers match your search criteria.'
                                : 'Start by adding your first customer.'
                            }
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Customer
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Customer Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-80"
                            onClick={() => setShowModal(false)}
                        ></div>


                        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <FormProvider {...methods}>
                                    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name *</label>
                                                <input
                                                    {...methods.register('name', {
                                                        required: 'Customer name is required',
                                                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                                    })}
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Enter customer name"
                                                />
                                                {errors?.name && (
                                                    <p className="mt-1 text-sm text-red-600">{errors?.name?.message}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                                <input
                                                    {...methods.register('email')}
                                                    type="email"
                                                    placeholder="customer@example.com"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            {/* Phone */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                                <input
                                                    type="tel"
                                                    {...methods.register('phone')}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            {/* Address */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                                <input
                                                    {...methods.register('address')}
                                                    type="text"
                                                    placeholder="123 Business Street"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            {/* City */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                                <input
                                                    {...methods.register('city')}
                                                    placeholder="Karachi"
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Previous Balance</label>
                                                <input
                                                    {...methods.register('previousBalance', {
                                                        valueAsNumber: true,
                                                        min: { value: 0, message: 'Amount must be positive' }
                                                    })}
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                                <textarea
                                                    {...methods.register('notes')}
                                                    rows={3}
                                                    placeholder="Add any additional notes about this customer..."
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    resetForm();
                                                }}
                                                className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-base font-medium text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {editingCustomer ? 'Update Customer' : 'Add Customer'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </FormProvider>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog />
        </div>
    );
};

export default CustomerManagement;