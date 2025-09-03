import { useEffect, useState } from "react";
import { useProduct } from "../hooks/useProduct";
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle, DollarSign, TrendingUp, Filter, X, Save, BarChart2, Download } from 'lucide-react';
import Pagination from "../components/Pagination";
import LoadingDemo from "../components/LoadingDemo";

const ProductManagement = () => {
    // Using custom hook
    const {
        products = [],
        loading,
        error,
        createProduct,
        updateProduct,
        deleteProduct,
        exportProducts,
        clearError,
    } = useProduct();

    // Local state
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStats, setShowStats] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const invoicesPerPage = 10;

    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;

    // Initial form state
    const initialFormState = {
        name: "",
        unitPrice: "",
        boxesPerMaster: "",
        piecesPerBox: "",
        pricePerBox: "",
        pricePerMaster: "",
    };

    const [data, setData] = useState(initialFormState);
    const [calculated, setCalculated] = useState({
        autoPriceperBox: 0,
        autoPriceperMaster: 0,
    });

    // Initialize filtered products
    useEffect(() => {
        setFilteredProducts(products);
    }, [products]);

    // Calculate whenever relevant fields change
    useEffect(() => {
        const unitPrice = parseFloat(data?.unitPrice) || 0;
        const piecesPerBox = parseInt(data?.piecesPerBox) || 0;
        const boxesPerMaster = parseInt(data?.boxesPerMaster) || 0;

        const autoBoxPrice = unitPrice * piecesPerBox;
        const autoMasterPrice = autoBoxPrice * boxesPerMaster;

        setCalculated({
            autoPriceperBox: autoBoxPrice,
            autoPriceperMaster: autoMasterPrice
        });

        // Auto-fill if fields are empty
        if (!data?.pricePerBox) {
            setData(prev => ({ ...prev, pricePerBox: autoBoxPrice.toString() }));
        }
        if (!data?.pricePerMaster) {
            setData(prev => ({ ...prev, pricePerMaster: autoMasterPrice.toString() }));
        }
    }, [data?.unitPrice, data?.piecesPerBox, data?.boxesPerMaster]);

    // Stats calculation
    const stats = {
        total: products?.length || 0,
        averagePrice: products?.length > 0 ?
            products?.reduce((sum, product) => sum + (product?.unitPrice || 0), 0) / products?.length : 0,
        totalValue: products?.reduce((sum, product) => sum + (product?.pricePerMaster || 0), 0) || 0
    };

    // Filter products based on search
    useEffect(() => {
        const filtered = products?.filter(product =>
            product?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
        ) || [];
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const handleChange = (e) => {
        const { name, value } = e?.target || {};
        setData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setData(initialFormState);
        setEditingProduct(null);
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        const productData = {
            name: data?.name,
            unitPrice: parseFloat(data?.unitPrice || 0),
            boxesPerMaster: parseInt(data?.boxesPerMaster || 0),
            piecesPerBox: parseInt(data?.piecesPerBox || 0),
            pricePerBox: parseFloat(data?.pricePerBox || 0),
            pricePerMaster: parseFloat(data?.pricePerMaster || 0)
        };

        let result;
        if (editingProduct?.id) {
            result = await updateProduct(editingProduct?.id, productData);
            showAlert(result?.success ? 'Product updated successfully!' : result?.error, result?.success ? 'success' : 'error');
        } else {
            result = await createProduct(productData);
            showAlert(result?.success ? 'Product added successfully!' : result?.error, result?.success ? 'success' : 'error');
        }

        if (result?.success) {
            setShowModal(false);
            resetForm();
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setData({
            name: product?.name || "",
            unitPrice: product?.unitPrice?.toString() || "",
            boxesPerMaster: product?.boxesPerMaster?.toString() || "",
            piecesPerBox: product?.piecesPerBox?.toString() || "",
            pricePerBox: product?.pricePerBox?.toString() || "",
            pricePerMaster: product?.pricePerMaster?.toString() || ""
        });
        setShowModal(true);
    };

    const handleDelete = async (product) => {
        if (window.confirm(`Are you sure you want to delete ${product?.name}?`)) {
            const result = await deleteProduct(product?.id);
            showAlert(result?.success ? 'Product deleted successfully!' : result?.error, result?.success ? 'success' : 'error');
        }
    };

    const handleExport = async () => {
        try {
            const result = await exportProducts();

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

    if (loading) {
        return (
            <LoadingDemo message={"Loading Products.."} showBackground={false} />
        );
    }

    const paginatedInvoices = filteredProducts?.slice(indexOfFirstInvoice, indexOfLastInvoice) || [];
    const totalPages = Math.ceil((filteredProducts?.length || 0) / invoicesPerPage);

    return (
        <div className="min-h-screen">
            {/* Alert Notification */}
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

            {/* Error Banner */}
            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mx-4 mt-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle size={20} className="mr-2" />
                            <span>{error}</span>
                        </div>
                        <button className="p-1 hover:bg-red-200 dark:hover:bg-red-800/50 rounded">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Product Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">Manage your inventory and pricing with ease</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-400 hover:shadow-md transition-all duration-200"
                        >
                            <BarChart2 size={18} className="mr-2" />
                            <span className="font-medium">Analytics</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200"
                        >
                            <Download size={18} className="mr-2" />
                            <span className="font-medium">Export</span>
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            <Plus size={18} className="mr-2" />
                            <span className="font-medium">Add Product</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {showStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl mr-4">
                                    <Package size={24} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Products</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white  overflow-x-auto whitespace-nowrap max-w-[90%]">{stats?.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-xl mr-4">
                                    <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Avg. Unit Price</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white  overflow-x-auto whitespace-nowrap max-w-[90%]">Rs. {stats?.averagePrice?.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl mr-4">
                                    <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Value</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white  overflow-x-auto whitespace-nowrap max-w-[90%]">Rs. {stats?.totalValue?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Filter */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e?.target?.value || '')}
                            className="w-full pl-12 pr-4 py-3 text-black dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    {filteredProducts?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sr.</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price/Box</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price/Master</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Discount</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {paginatedInvoices?.map((product, index) => {
                                        const autoMasterPrice = (product?.unitPrice || 0) * (product?.piecesPerBox || 0) * (product?.boxesPerMaster || 0);
                                        const discountPercentage = autoMasterPrice > 0
                                            ? Math.round((1 - (product?.pricePerMaster || 0) / autoMasterPrice) * 100)
                                            : 0;
                                        return (
                                            <tr key={product?.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col gap-0">
                                                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                                            {product?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            . {product?.unitPrice}/= 1x{product?.boxesPerMaster} {product?.piecesPerBox}.P RP.{product?.pricePerBox}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                                        Rs. {product?.unitPrice?.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                                                        Rs. {product?.pricePerBox?.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                                                        Rs. {product?.pricePerMaster?.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {discountPercentage > 0 && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                                                            {discountPercentage}% OFF
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200"
                                                            title="Edit Product"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product)}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            <div className="px-6 py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    filteredInvoices={filteredProducts}
                                    indexOfFirstInvoice={indexOfFirstInvoice}
                                    indexOfLastInvoice={indexOfLastInvoice}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
                                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {searchTerm ? 'No matching products found' : 'No products yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
                            </p>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                <Plus size={20} className="mr-2" />
                                Add Your First Product
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
                            setShowModal(false);
                            resetForm();
                        }}></div>

                        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform transition-all sm:max-w-3xl sm:w-full border border-white/20 dark:border-gray-700/20">
                            <div className="px-8 pt-6 pb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={data?.name || ""}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border text-black dark:text-white bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Unit Price */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Unit Price (Rs.) *</label>
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                value={data?.unitPrice || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                min="0"
                                                placeholder="0"
                                                required
                                            />
                                        </div>

                                        {/* Boxes per Master */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Boxes per Master *</label>
                                            <input
                                                type="number"
                                                name="boxesPerMaster"
                                                value={data?.boxesPerMaster || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                min="1"
                                                placeholder="24"
                                                required
                                            />
                                        </div>

                                        {/* Pieces per Box */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pieces per Box *</label>
                                            <input
                                                type="number"
                                                name="piecesPerBox"
                                                value={data?.piecesPerBox || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 text-black dark:text-white bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                min="1"
                                                placeholder="48"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Price per Box */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Price per Box (Rs.)
                                                <span
                                                    onClick={() => setData(prev => ({
                                                        ...prev,
                                                        pricePerBox: calculated?.autoPriceperBox?.toString()
                                                    }))}
                                                    className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-normal cursor-pointer hover:underline"
                                                >
                                                    Auto: Rs. {calculated?.autoPriceperBox?.toFixed(2)}
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                name="pricePerBox"
                                                value={data?.pricePerBox || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 text-black dark:text-white bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                min="0"
                                                placeholder={calculated?.autoPriceperBox?.toFixed(2)}
                                            />
                                        </div>

                                        {/* Price per Master */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Price per Master (Rs.)
                                                <span
                                                    onClick={() => setData(prev => ({
                                                        ...prev,
                                                        pricePerMaster: calculated?.autoPriceperMaster?.toFixed(2)
                                                    }))}
                                                    className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-normal cursor-pointer hover:underline"
                                                >
                                                    Auto: Rs. {calculated?.autoPriceperMaster?.toFixed(2)}
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                name="pricePerMaster"
                                                value={data?.pricePerMaster || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 text-black dark:text-white border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                min="0"
                                                placeholder={calculated?.autoPriceperMaster?.toFixed(2)}
                                            />
                                        </div>
                                    </div>

                                    {/* Calculation Preview */}
                                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                        <h4 className="font-semibold mb-3 gap-2 text-gray-800 dark:text-gray-200 flex items-center">
                                            <BarChart2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                                            Price Calculation Preview
                                            {data?.pricePerMaster && calculated?.autoPriceperMaster > 0 && (
                                                <p className="font-medium text-green-700 dark:text-green-400">
                                                    (Discount: {Math.round((1 - (data?.pricePerMaster || 0) / (calculated?.autoPriceperMaster || 1)) * 100)}% off)
                                                </p>
                                            )}
                                        </h4>
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div className="col-span-2 font-medium text-gray-600 dark:text-gray-400">Calculation</div>
                                            <div className="font-medium text-right text-gray-600 dark:text-gray-400">Value</div>
                                            <div className="font-medium text-right text-gray-600 dark:text-gray-400">Result</div>

                                            <div className="col-span-2 text-gray-600 dark:text-gray-300">Unit Price × Pieces per Box</div>
                                            <div className="text-right text-gray-600 dark:text-gray-300">
                                                Rs. {parseFloat(data?.unitPrice || 0)?.toFixed(2)} × {parseInt(data?.piecesPerBox || 0)}
                                            </div>
                                            <div className="text-right font-medium text-blue-600 dark:text-blue-400">
                                                Rs. {calculated?.autoPriceperBox?.toFixed(2)}
                                            </div>

                                            <div className="col-span-2 text-gray-600 dark:text-gray-300">Price per Box × Boxes per Master</div>
                                            <div className="text-right text-gray-600 dark:text-gray-300">
                                                Rs. {parseFloat(data?.pricePerBox || calculated?.autoPriceperBox || 0)?.toFixed(2)} × {parseInt(data?.boxesPerMaster || 0)}
                                            </div>
                                            <div className="text-right font-medium text-indigo-600 dark:text-indigo-400">
                                                Rs. {calculated?.autoPriceperMaster?.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Buttons */}
                                    <div className="flex justify-end space-x-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForm();
                                            }}
                                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            {editingProduct ? 'Update Product' : 'Add Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductManagement;