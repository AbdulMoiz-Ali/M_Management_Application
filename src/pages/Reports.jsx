import { Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const Reports = () => {
    // State management
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    
    // Calculate total revenue when invoices change
    useEffect(() => {
        const revenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        setTotalRevenue(revenue);
    }, [invoices]);

    // Handle export functionality
    const handleExport = () => {
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Sales Overview</h3>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-gray-500">Sales chart will appear here</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue by Customer</h3>
                    <div className="space-y-3">
                        {customers.slice(0, 5).map(customer => {
                            const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
                            const customerRevenue = customerInvoices.reduce(
                                (sum, inv) => sum + (inv.status === 'paid' ? inv.total : 0),
                                0
                            );

                            return (
                                <div key={customer.id} className="flex items-center">
                                    <div className="w-32 truncate text-gray-800">{customer.name}</div>
                                    <div className="flex-1 mx-2">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{
                                                    width: `${Math.min(100, totalRevenue > 0 ? (customerRevenue / totalRevenue * 100) : 0)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="w-20 text-right text-gray-800">Rs.{customerRevenue.toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Payments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-black">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 font-medium">Payment ID</th>
                                <th className="text-left py-2 font-medium">Invoice</th>
                                <th className="text-left py-2 font-medium">Amount</th>
                                <th className="text-left py-2 font-medium">Date</th>
                                <th className="text-left py-2 font-medium">Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.slice(0, 10).map(payment => {
                                const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                                return (
                                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3">PAY-{payment.id}</td>
                                        <td className="py-3">
                                            {invoice ? `INV-${invoice.id}` : 'N/A'}
                                        </td>
                                        <td className="py-3">Rs.{payment.amount.toLocaleString()}</td>
                                        <td className="py-3">{payment.date}</td>
                                        <td className="py-3">{payment.method}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {payments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No payment records found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;