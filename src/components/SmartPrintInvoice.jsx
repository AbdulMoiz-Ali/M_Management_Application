import React, { useState } from 'react';
import { Printer, AlertCircle, CheckCircle, Download, Settings, X, ArrowLeft, Eye } from 'lucide-react';
import { useInvoice } from '../hooks/useInvoice';
import { useAuth } from '../hooks/useAuth';

const SmartPrintInvoice = ({ onback, selectedInvoice, preview = false }) => {
    const [showModal, setShowModal] = useState(false);
    const [printerStatus, setPrinterStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const {
        printerCheck,
        downloadInvoice,
        printInvoice,
        openPrinterSettings
    } = useInvoice();
    const { user } = useAuth();
    // Sample invoice data

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
    };

    // Function 1: Check Printer Status
    const checkPrinterStatus = async () => {
        setIsChecking(true);
        try {
            const result = await printerCheck();
            setPrinterStatus(result);
            return result;
        } catch (error) {
            // console.error('Printer check failed:', error);
            setPrinterStatus({ hasPrinters: false, error: error.message });
            return { hasPrinters: false, error: error.message };
        } finally {
            setIsChecking(false);
        }
    };

    // Fast Print Function
    const fastPrint = async () => {
        setIsPrinting(true);
        try {
            const result = await printInvoice(selectedInvoice);

            if (result?.success) {
                showAlert(`✅ ${result.message || 'Invoice printed successfully!'}`, 'success');
                setShowModal(false);
                setPrinterStatus(null);
            } else {
                showAlert(`❌ Print failed: ${result?.error || 'Unknown error'}`, 'error');
            }

        } catch (error) {
            // console.error('Print error:', error);
            showAlert(`❌ Print failed: ${error.message}`, 'error');
        } finally {
            setIsPrinting(false);
        }
    };

    // Main Print Button Handler
    const handlePrintClick = async () => {
        // console.log('🖨️ Print button clicked');
        const status = await checkPrinterStatus();
        setShowModal(true);
    };

    // Save to PDF Function
    const handleSaveToPDF = async () => {
        setIsDownloading(true);
        setShowModal(false);

        // Show loading toast
        showAlert('🔄 Generating PDF, please wait...', 'info');

        try {
            // Validate data first
            if (!selectedInvoice) {
                throw new Error('No invoice data provided');
            }

            if (!selectedInvoice.invoiceNumber) {
                throw new Error('Invoice number is missing');
            }

            // console.log('Starting PDF download for:', selectedInvoice.invoiceNumber);

            const result = await downloadInvoice(selectedInvoice);

            // console.log('PDF result:', result);

            if (result?.success) {
                showAlert(`✅ ${result.message || 'PDF downloaded successfully!'}`, 'success');
            } else {
                showAlert(`❌ PDF Error: ${result?.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            // console.error('PDF download error:', error);
            showAlert(`❌ Error: ${error.message}`, 'error');
        } finally {
            setIsDownloading(false);
            setPrinterStatus(null);
        }
    };

    const settings = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
        shopAddress: "Sukkur",
        shopContactPhone: ["03042187313", "03003187980"],
        saleBy: ["izhar udin mamon"],
        suppliers: ["Sukkur ware house supplyer"],
    }

    const generatePrintableHTML = (invoiceData) => {
        // Helper function to calculate previous balance
        const calculatePreviousBalance = () => {
            return invoiceData.customer.previousBalance || 0;
        };

        // Helper function to calculate current bill cash received
        const calculateCashReceived = () => {
            return invoiceData.status === 'paid' ? invoiceData.total : 0;
        };

        // Helper function to calculate total payable
        const calculateTotalPayable = () => {
            const previousBalance = calculatePreviousBalance();
            const currentBill = invoiceData.total;
            const cashReceived = calculateCashReceived();
            return previousBalance + currentBill - cashReceived;
        };

        // Process items for display
        const processedItems = invoiceData.items.map(item => {
            const product = item.product;
            let packInfo = '';
            let displayQuantity = item.quantity;

            // Determine pack info based on unit type
            if (item.unit === 'MASTER') {
                packInfo = `1=${product.boxesPerMaster}X${product.piecesPerBox}`;
                displayQuantity = item.quantity; // Masters
            } else if (item.unit === 'BOX') {
                packInfo = `1X${product.piecesPerBox}`;
                displayQuantity = item.quantity; // Boxes
            } else {
                packInfo = '1'; // Individual pieces
                displayQuantity = item.quantity;
            }

            return {
                ...item,
                packInfo,
                displayQuantity,
                netPrice: item.amount // Net Price same as amount for this format
            };
        });

        const currentBill = invoiceData.total.toFixed(1);
        const subTotalBill = invoiceData.subTotal;

        return `
        <div class="max-w-4xl mx-auto bg-white print:max-w-none print:mx-0">
            <style>
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .print\\:hidden { display: none !important; }
                    .invoice-container { margin: 0; padding: 15px; }
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                }

                .invoice-container {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #000;
                    border: 2px solid #000;
                    padding: 12px;
                    margin: 0;
                    background: white;
                }
                
                .invoice-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                }
                
                .invoice-header h1 {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0 0 4px 0;
                    letter-spacing: 1px;
                }
                
                .invoice-header p {
                    margin: 1px 0;
                    font-size: 10px;
                }
                
                .invoice-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .customer-info {
                    flex: 1;
                    font-size: 10px;
                    min-height: auto;
                }
                
                .customer-info div {
                    margin-bottom: 3px;
                }
                
                .invoice-details {
                    width: 200px;
                    border: 1px solid #000;
                    padding: 6px;
                    font-size: 10px;
                    height: auto;
                    min-height: fit-content;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    padding: 1px 0;
                }
                
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000;
                    margin-bottom: 12px;
                    font-size: 9px;
                    table-layout: fixed;
                }
                
                .invoice-table th,
                .invoice-table td {
                    border: 1px solid #000;
                    padding: 4px 3px;
                    text-align: center;
                    vertical-align: middle;
                    word-wrap: break-word;
                }
                
                .invoice-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    font-size: 8px;
                }
                
                /* Fixed column widths */
                .invoice-table .sr {
                    width: 6%;
                }
                
                .invoice-table .description {
                    width: 28%;
                    text-align: left;
                    font-size: 8px;
                }
                
                .invoice-table .pack {
                    width: 10%;
                }
                
                .invoice-table .qty-col {
                    width: 8%;
                }
                
                .invoice-table .rate-col {
                    width: 12%;
                }
                
                .invoice-table .amount-col {
                    width: 14%;
                }
                
                .invoice-table .np-col {
                    width: 14%;
                }
                
                .total-row {
                    font-weight: bold;
                    background-color: #f0f0f0;
                }
                
                .invoice-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    font-size: 10px;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .footer-left {
                    width: 200px;
                    border: 1px solid #000;
                    padding: 8px;
                    font-size: 10px;
                    height: auto;
                    min-height: 90px;
                }
                
                .footer-left .detail-row {
                    margin-bottom: 4px;
                }
                
                .account-summary {
                    padding-top: 4px;
                    margin-top: 4px;
                }
                
                .total-payable {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 4px 0;
                    font-weight: bold;
                    background-color: #f0f0f0;
                }

                .footer-right {
                    width: 280px;
                    border: 1px solid #000;
                    padding: 8px;
                    font-size: 11px;
                    font-family: Arial, sans-serif;
                }
                .signature-section {
                    margin-top: 8px;
                    width: 100%;
                }

                .signature-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap:2px
                }
                .label {
                    display: inline-block;
                    white-space: nowrap; 
                }
                .signature-line {
                    flex: 1;
                    border-bottom: 1px solid #000;
                    height: 1px;
                    margin-top:8px
                }
            </style>
    
            <div class="invoice-container">
                <!-- Header -->
                <div class="invoice-header">
                    <h1>${settings.martName}</h1>
                    <p>ADDRESS:- ${settings.shopAddress}</p>
                    <p>${settings.shopContactPhone.join(', ')}</p>
                </div>
    
                <!-- Invoice Info -->
                <div class="invoice-info">
                    <div class="customer-info">
                        <div><strong>A/C Name:</strong> ${invoiceData.customer.customerId} ${invoiceData.customer.name.toUpperCase()}</div>
                        <div><strong>Address:</strong> ${invoiceData.customer.address}</div>
                        <div><strong>Contact:</strong> ${invoiceData.customer.phone}</div>
                        <div><strong>City/Area:</strong> ${invoiceData.customer.city.toUpperCase()}</div>
                        <div><strong>Sales By:</strong> ${settings.saleBy[0] || invoiceData.salesBy || ''}</div>
                        <div><strong>Supplier:</strong> ${settings.suppliers[0] || invoiceData.supplier || ''}</div>
                    </div>
    
                    <div class="invoice-details">
                        <div class="detail-row">
                            <span><strong>Date</strong></span>
                            <span>${new Date(invoiceData.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).replace(',', ' ,')}</span>
                        </div>
                        <div class="detail-row">
                            <span><strong>Sale Invoice</strong></span>
                            <span>${invoiceData.invoiceNumber.replace('INV-', '')}</span>
                        </div>
                    </div>
                </div>
    
                <!-- Items Table -->
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th rowspan="2" class="sr">Sr.</th>
                            <th rowspan="2" class="description">Description</th>
                            <th rowspan="2" class="pack">Pack</th>
                            <th colspan="3">Sale Qty</th>
                            <th rowspan="2" class="rate-col">Rate</th>
                            <th rowspan="2" class="amount-col">Discount</th>
                            <th rowspan="2" class="np-col">Amount</th>
                        </tr>
                        <tr>
                            <th class="qty-col">Master</th>
                            <th class="qty-col">Dozen</th>
                            <th class="qty-col">Box</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processedItems.map((item, index) => {
            let masterQty = '';
            let boxQty = '';
            let halfQty = '';

            if (item.unit === 'MASTER') {
                masterQty = item.quantity;
            } else if (item.unit === 'BOX') {
                boxQty = item.quantity;
            } else if (item.unit === 'HALF') {
                halfQty = '1/2';
            }

            return `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="description">${item.name.toUpperCase()}</td>
                                <td>${item.packInfo}</td>
                                <td>${masterQty}</td>
                                <td>${halfQty}</td>
                                <td>${boxQty}</td>
                                <td>${item?.rate.toFixed(2)}</td>
                                <td></td>
                                <td>${item?.netPrice.toFixed(2) || item?.amount.toFixed(2)}</td>
                            </tr>
                            `;
        }).join('')}
                        
                        <tr class="total-row">
                        <td colspan="2"><strong>Total</strong></td>
                        <td><strong>${(() => {
                const master = processedItems.filter(item => item.unit === 'MASTER')
                    .reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                const box = processedItems.filter(item => item.unit === 'BOX')
                    .reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                const half = processedItems.filter(item => item.unit === 'HALF').length
                const totalUnits = [master, box, half].filter(val => val > 0).length;
                return totalUnits > 1 ? master + box + half : "";
            })()}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item?.quantity || 0), 0) || ''}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'HALF').length || ''}</strong></td>
            <td class="qty-col"><strong>${processedItems.filter(item => item.unit === 'BOX').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || ''}</strong></td>
            <td></td>
            <td><strong>${invoiceData?.discountAmount}</strong></td>
            <td><strong>${subTotalBill.toFixed(1)}</strong></td>
            </tr>
                    </tbody>
                </table>
    
                <!-- Footer -->
                <div class="invoice-footer">
                     <div class="footer-left">
                        <div class="detail-row">
                            <span><strong>Invoice Amount</strong></span>
                            <span>${subTotalBill.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span><strong>Previous Balance</strong></span>
                            <span>${invoiceData?.customer?.previousBalance}</span>
                        </div>
    
                        <div class="account-summary">
                            <div class="detail-row total-payable">
                                <span><strong>Total Payable Value</strong></span>
                                <span>${currentBill?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
    
                   <div class="footer-right">
                   <div class="signature-section">
                   <div class="signature-row">
                       <span class="label">Customer Signatures</span>
                       <span class="signature-line"></span>
                   </div>
                   <div class="signature-row">
                       <span class="label">Receiver Name</span>
                       <span class="signature-line"></span>
                   </div>
                   <div class="signature-row">
                       <span class="label">Cell No.</span>
                       <span class="signature-line"></span>
                   </div>
                   </div>
                   </div>

                </div>
            </div>
        </div>
        `;
    };

    if (preview) {
        return (
            <>
                {
                    alert.show && (
                        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                            : alert.type === 'error'
                                ? 'bg-red-50 text-red-800 border-red-500'
                                : 'bg-blue-50 text-blue-800 border-blue-500'
                            }`}>
                            <div className="flex items-center">
                                <span className="font-medium">{alert.message}</span>
                                <button
                                    onClick={() => setAlert({ show: false, message: '', type: '' })}
                                    className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )
                }

                <button
                    onClick={handleSaveToPDF}
                    disabled={isDownloading}
                    className="p-1 text-purple-600 hover:text-purple-800"
                    title="Download PDF"
                >
                    {
                        isDownloading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            </>
                        ) : (
                            <Download className="h-4 w-4" />
                        )}

                </button >
            </>
        )
    }
    return (
        <>
            {/* Toast Alert */}
            {alert.show && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                    : alert.type === 'error'
                        ? 'bg-red-50 text-red-800 border-red-500'
                        : 'bg-blue-50 text-blue-800 border-blue-500'
                    }`}>
                    <div className="flex items-center">
                        <span className="font-medium">{alert.message}</span>
                        <button
                            onClick={() => setAlert({ show: false, message: '', type: '' })}
                            className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-screen">
                <div className="max-w-[80%] mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border dark:border-gray-700 transition-colors duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onback}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                                    <Eye className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Preview</h1>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.invoiceNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleSaveToPDF}
                                    disabled={isDownloading}
                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handlePrintClick}
                                    disabled={isChecking || isDownloading}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                                >
                                    {isChecking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Checking Printer...
                                        </>
                                    ) : isDownloading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Printer size={20} />
                                            Print Invoice
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 !text-black border  dark:border-gray-700 transition-colors duration-300">
                        <div dangerouslySetInnerHTML={{ __html: generatePrintableHTML(selectedInvoice) }} />
                    </div>
                </div>
            </div>



            {/* Smart Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setPrinterStatus(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Content */}
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-4 text-black dark:text-white">Print Invoice #{selectedInvoice.invoiceNumber}</h3>

                            {isChecking ? (
                                /* Checking State */
                                <div className="py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Checking for available printers...</p>
                                </div>
                            ) : printerStatus?.hasPrinters ? (
                                /* Printer Found */
                                <div className="py-4">
                                    <div className="flex items-center justify-center mb-4">
                                        <CheckCircle className="text-green-500" size={48} />
                                    </div>
                                    <h4 className="text-lg font-semibold text-green-700 mb-2">Printer Ready!</h4>
                                    <p className="text-gray-600 mb-4">
                                        Default Printer: <span className="font-semibold">{printerStatus.defaultPrinter}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Found {printerStatus.printers?.length || 1} printer(s) available
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={fastPrint}
                                            disabled={isPrinting}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                        >
                                            {isPrinting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Printing...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer size={18} />
                                                    Print Now
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleSaveToPDF}
                                            disabled={isDownloading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span className='ml-1'>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={18} />
                                                    Save PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* No Printer Found */
                                <div className="py-4">
                                    <div className="flex items-center justify-center mb-4">
                                        <AlertCircle className="text-orange-500" size={48} />
                                    </div>
                                    <h4 className="text-lg font-semibold text-orange-700 mb-2">No Printer Connected</h4>
                                    <p className="text-gray-600 mb-4">
                                        Please connect a printer or choose an alternative option
                                    </p>

                                    <div className="bg-orange-50 dark:bg-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
                                        <h5 className="font-semibold text-orange-800 mb-2">Quick Solutions:</h5>
                                        <ul className="text-sm text-orange-700 text-left space-y-1">
                                            <li>• Connect a USB printer</li>
                                            <li>• Install "Microsoft Print to PDF"</li>
                                            <li>• Add a network printer</li>
                                            <li>• Use PDF option below</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveToPDF}
                                            disabled={isDownloading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={18} />
                                                    Save as PDF
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => { openPrinterSettings() }}
                                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Settings size={18} />
                                            Add Printer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SmartPrintInvoice;