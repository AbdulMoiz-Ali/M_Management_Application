import { useState } from "react";
import Pagination from "./Pagination";
import { Eye, FileText } from "lucide-react";


function Customerhistory({ invoicesCustomerloading, invoicesCustomer, handleViewInvoice }) {
    const [currentPage, setCurrentPage] = useState(1);
    const invoicesPerPage = 10;

    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
    const paginatedInvoices = invoicesCustomer.slice(indexOfFirstInvoice, indexOfLastInvoice);
    const totalPages = Math.ceil(invoicesCustomer.length / invoicesPerPage);
    return (
        <div className="dark:bg-gray-800 bg-white shadow-lg rounded-xl border dark:border-gray-700 border-gray-200">
            <div className="px-6 py-4 border-b dark:border-gray-700 border-gray-200">
                <h3 className="text-lg font-semibold dark:text-white text-gray-900">Purchase History</h3>
            </div>
            {invoicesCustomerloading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-700 border-gray-200">
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Invoice #</th>
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Date</th>
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Items</th>
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium dark:text-gray-300 text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInvoices?.map((invoice) => (
                                <tr key={invoice.id} className="border-b dark:border-gray-700 border-gray-100 dark:hover:bg-gray-700 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-blue-500">{invoice.invoiceNumber}</td>
                                    <td className="py-3 px-4 dark:text-gray-300 text-gray-600">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 dark:text-gray-300 text-gray-600">{invoice.items.length}</td>
                                    <td className="py-3 px-4 font-medium dark:text-gray-200 text-gray-900">{invoice.total.toFixed(2)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => handleViewInvoice(invoice)}
                                            className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                                            title="View Invoice"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedInvoices.length === 0 && (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 dark:text-gray-500 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium dark:text-white text-gray-900 mb-2">No invoices found</h3>
                            <p className="dark:text-gray-400 text-gray-500">Create your first invoice to get started.</p>
                        </div>
                    )}

                </div>
            )}
            <div className="px-6 py-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    filteredInvoices={paginatedInvoices}
                    indexOfFirstInvoice={indexOfFirstInvoice}
                    indexOfLastInvoice={indexOfLastInvoice}
                />
            </div>

        </div>
    )
}


export default Customerhistory