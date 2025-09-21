// Complete Invoice Report System Component
import React, { useState, useRef, useEffect } from 'react';
import {
    Download, ChevronDown, Calendar, FileText, Printer, X,
    ArrowLeft, Eye, ChevronLeft, ChevronRight, Filter,
    AlertCircle,
    Settings,
    CheckCircle
} from 'lucide-react';
import { useInvoice } from '../hooks/useInvoice';
import { useAuth } from '../hooks/useAuth';

const InvoiceReportSystem = ({ invoices, onBack }) => {
    const [filterType, setFilterType] = useState('all');
    const [reportFormat, setReportFormat] = useState('normal');
    const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [printerStatus, setPrinterStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const {
        printReport,
        generateReportPDF,
        printerCheck,
        openPrinterSettings
    } = useInvoice();
    const { user } = useAuth();
    const dropdownRef = useRef(null);
    const formatDropdownRef = useRef(null);
    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };
    const itemsPerPage = 10;

    // Filter options
    const exportOptions = [
        { label: 'Today', value: 'today', icon: Calendar, description: 'Current day invoices' },
        { label: 'This Month', value: 'month', icon: Calendar, description: 'Current month invoices' },
        { label: 'This Year', value: 'year', icon: Calendar, description: 'Current year invoices' },
        { label: 'Custom Range', value: 'custom', icon: Calendar, description: 'Select date range' },
        { label: 'All Time', value: 'all', icon: FileText, description: 'All invoices' }
    ];

    // Filter invoices based on selected filter
    const getFilteredInvoices = (type) => {
        if (!invoices || !Array.isArray(invoices)) return [];

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31);

        switch (type) {
            case 'today':
                return invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    return invoiceDate >= today && invoiceDate < tomorrow;
                });
            case 'month':
                return invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    return invoiceDate >= firstDayOfMonth && invoiceDate <= lastDayOfMonth;
                });
            case 'year':
                return invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    return invoiceDate >= firstDayOfYear && invoiceDate <= lastDayOfYear;
                });
            case 'custom':
                if (customStartDate && customEndDate) {
                    const startDate = new Date(customStartDate);
                    const endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999); // Include end date fully

                    return invoices.filter(invoice => {
                        const invoiceDate = new Date(invoice.date);
                        return invoiceDate >= startDate && invoiceDate <= endDate;
                    });
                }
                return invoices;
            default:
                return invoices;
        }
    };

    const filteredInvoices = getFilteredInvoices(filterType);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

    // Calculate totals
    const calculateTotals = (invoicesList) => {
        return {
            totalInvoices: invoicesList.length,
            totalAmount: invoicesList.reduce((sum, inv) => sum + (inv.total || 0), 0),
            totalQuantity: invoicesList.reduce((sum, inv) => sum + (inv.totalQuantity || 0), 0),
            totalDiscount: invoicesList.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0)
        };
    };

    // Generate report data
    const generateReportData = (filterType) => {
        const filtered = getFilteredInvoices(filterType);
        const totals = calculateTotals(filtered);
        const pages = [];

        for (let i = 0; i < Math.ceil(filtered.length / itemsPerPage); i++) {
            const pageInvoices = filtered.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            pages.push({
                pageNumber: i + 1,
                invoices: pageInvoices
            });
        }

        return {
            filterType,
            filterLabel: exportOptions.find(opt => opt.value === filterType)?.label || 'All',
            totalPages: pages.length,
            pages,
            totals,
            generatedDate: new Date().toLocaleDateString()
        };
    };

    const settings = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
    }
    // Generate HTML for report
    const generateNormalReportHTML = (data) => {
        const { filterLabel, pages, totals, generatedDate } = data;

        let pagesHTML = pages.map(page => `
            <div class="page">
                <div class="page-header">
                    <h1>${settings?.martName}</h1>
                    <h2>Invoice Summary Report - ${filterLabel}</h2>
                    <div class="report-info">
                        <span>Generated: ${generatedDate}</span>
                        <span>Page ${page.pageNumber} of ${pages.length}</span>
                        <span>Total Records: ${totals.totalInvoices}</span>
                    </div>
                </div>
                
                <table class="report-table">
                    <thead>
                        <tr>
                            <th class="sr-col">Sr</th>
                            <th class="invoice-col">Invoice No</th>
                            <th class="date-col">Date</th>
                            <th class="customer-col">Customer</th>
                            <th class="phone-col">Phone</th>
                            <th class="items-col">Items</th>
                            <th class="qty-col">Qty</th>
                            <th class="discount-col">Discount</th>
                            <th class="amount-col">Amount</th>
                            <th class="status-col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${page.invoices.map((invoice, index) => {
            const globalIndex = (page.pageNumber - 1) * itemsPerPage + index + 1;

            // Create main invoice row
            let invoiceRows = '';

            // First row with complete invoice data
            invoiceRows += `
                                <tr class="text-black">
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">${globalIndex}</td>
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">${invoice.invoiceNumber}</td>
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">${new Date(invoice.date).toLocaleDateString()}</td>
                                    <td class="text-left" rowspan="${invoice.items?.length || 1}">${invoice.customer?.name || ''}</td>
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">${invoice.customer?.phone || ''}</td>
                                    <td class="text-left items-cell">${invoice.items?.[0] ? `${invoice.items[0].unit.toLowerCase()}: ${invoice.items[0].quantity}` : ''}</td>
                                    <td class="text-center font-bold" rowspan="${invoice.items?.length || 1}">${invoice.totalQuantity || 0}</td>
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">${invoice.discountAmount || 0}</td>
                                    <td class="text-center font-bold" rowspan="${invoice.items?.length || 1}">${invoice.total || 0}</td>
                                    <td class="text-center" rowspan="${invoice.items?.length || 1}">
                                        <span class="status-badge status-${invoice.status}">${invoice.status?.toUpperCase() || 'PENDING'}</span>
                                    </td>
                                </tr>
                            `;

            // Additional rows for remaining items (if more than 1 item)
            if (invoice.items?.length > 1) {
                for (let i = 1; i < invoice.items.length; i++) {
                    invoiceRows += `
                                        <tr class="text-black">
                                            <td class="text-left items-cell">${invoice.items[i].unit.toLowerCase() == "half" ? "Dozen" : invoice.items[i].unit.toLowerCase()}: ${invoice.items[i].quantity}</td>
                                        </tr>
                                    `;
                }
            }

            return invoiceRows;
        }).join('')}
                        
                        ${page.pageNumber === pages.length ? `
                            <tr class="total-row text-black">
                                <td colspan="5" class="text-center font-bold">TOTAL</td>
                                <td class="text-center font-bold">-</td>
                                <td class="text-center font-bold">${totals.totalQuantity}</td>
                                <td class="text-center font-bold">${totals.totalDiscount.toFixed(2)}</td>
                                <td class="text-center font-bold">${totals.totalAmount.toFixed(2)}</td>
                                <td class="text-center font-bold">-</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
                
                ${page.pageNumber === pages.length ? `
                    <div class="summary-section">
                        <h3 class="text-black">SUMMARY</h3>
                        <table class="summary-table text-black">
                            <tr>
                                <td class="summary-label">Total Invoices:</td>
                                <td class="summary-value">${totals.totalInvoices}</td>
                                <td class="summary-label">Total Quantity:</td>
                                <td class="summary-value">${totals.totalQuantity}</td>
                            </tr>
                            <tr>
                                <td class="summary-label">Total Discount:</td>
                                <td class="summary-value">${totals.totalDiscount.toFixed(2)}</td>
                                <td class="summary-label">Total Amount:</td>
                                <td class="summary-value grand-total">${totals.totalAmount.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                ` : ''}
            </div>
            
            ${page.pageNumber < pages.length ? '<div class="page-break"></div>' : ''}
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice Report - ${filterLabel}</title>
                <style>
                    @media screen {
                        .page {
                            background: white;
                            margin: 0 auto 30px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                        }
                    }
                    
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0;
                            background: white;
                        }
                        .page {
                            margin: 0;
                            box-shadow: none;
                            border-radius: 0;
                        }
                        .page-break {
                            page-break-after: always;
                        }
                    }

                    .page {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 20mm;
                        box-sizing: border-box;
                        position: relative;
                    }
                    
                    .page-header {
                        text-align: center;
                        border-bottom: 3px solid #000;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .page-header h1 {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0 0 5px 0;
                        letter-spacing: 2px;
                        color: black;
                    }
                    
                    .page-header h2 {
                        font-size: 16px;
                        margin: 0 0 10px 0;
                        color: #666;
                    }
                    
                    .report-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #888;
                        margin-top: 10px;
                    }
                    
                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .report-table th,
                    .report-table td {
                        border: 1px solid #000;
                        padding: 6px 4px;
                        vertical-align: middle;
                    }
                    
                    .report-table th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        text-align: center;
                    }
                    
                    /* Column widths */
                    .sr-col { width: 5%; }
                    .invoice-col { width: 12%; }
                    .date-col { width: 10%; }
                    .customer-col { width: 15%; }
                    .phone-col { width: 10%; }
                    .items-col { width: 20%; }
                    .qty-col { width: 6%; }
                    .discount-col { width: 8%; }
                    .amount-col { width: 10%; }
                    .status-col { width: 8%; }
                    th {
                    color: black;
                    }
                    
                    .text-center { text-align: center; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    
                    .items-cell {
                        font-size: 9px;
                        line-height: 1.2;
                    }
                    
                    .status-badge {
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 8px;
                        font-weight: bold;
                    }
                    
                    .status-paid {
                        background-color: #d4edda;
                        color: #155724;
                    }
                    
                    .status-pending {
                        background-color: #fff3cd;
                        color: #856404;
                    }
                    
                    .status-overdue {
                        background-color: #f8d7da;
                        color: #721c24;
                    }
                    
                    .summary-section {
                        margin-top: 30px;
                        border-top: 2px solid #000;
                        padding-top: 15px;
                    }
                    
                    .summary-section h3 {
                        text-align: center;
                        font-size: 16px;
                        margin-bottom: 15px;
                    }
                    
                    .summary-table {
                        width: 60%;
                        margin: 0 auto;
                        font-size: 12px;
                    }
                    
                    .summary-table td {
                        padding: 8px 15px;
                        border: 1px solid #ccc;
                    }
                    
                    .summary-label {
                        font-weight: bold;
                        background-color: #f8f9fa;
                    }
                    
                    .summary-value {
                        text-align: right;
                        font-weight: bold;
                    }
                    
                    .grand-total {
                        background-color: #e3f2fd;
                        color: #1976d2;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                ${pagesHTML}
            </body>
            </html>
        `;
    };
    const generateShortReportHTML = (data) => {
        const { filterLabel, pages, totals, generatedDate } = data;

        let pagesHTML = pages.map(page => `
            <div class="page">
                <div class="page-header">
                    <h1>${settings?.martName}</h1>
                    <h2>Short Sale Sheet - ${filterLabel}</h2>
                    <div class="report-info">
                        <span>Generated: ${generatedDate}</span>
                        <span>Page ${page.pageNumber} of ${pages.length}</span>
                        <span>Total Records: ${totals.totalInvoices}</span>
                    </div>
                </div>
                
                <table class="report-table">
                    <thead>
                        <tr>
                            <th class="sr-col">Sr</th>
                            <th class="date-col">Date</th>
                            <th class="phone-col">Phone</th>
                            <th colspan="3" class="qty-header">Sale Qty</th>
                            <th class="total-col">Total</th>
                            <th class="status-col">Status</th>
                        </tr>
                        <tr class="sub-header">
                            <th></th>
                            <th></th>
                            <th></th>
                            <th class="qty-col">Master</th>
                            <th class="qty-col">Dozen</th>
                            <th class="qty-col">Box</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${page.invoices.map((invoice, index) => {
            const globalIndex = (page.pageNumber - 1) * itemsPerPage + index + 1;
            const masterQty = invoice.items?.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
            const halfQty = invoice.items?.filter(item => item.unit === 'HALF').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
            const boxQty = invoice.items?.filter(item => item.unit === 'BOX').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
            const totalQty = masterQty + halfQty + boxQty;

            return `
                                <tr class="text-black">
                                    <td class="text-center">${globalIndex}</td>
                                    <td class="text-center">${new Date(invoice.date).toLocaleDateString()}</td>
                                    <td class="text-center">${invoice.customer?.phone || ''}</td>
                                    <td class="text-center font-bold">${masterQty || ''}</td>
                                    <td class="text-center font-bold">${halfQty || ''}</td>
                                    <td class="text-center font-bold">${boxQty || ''}</td>
                                    <td class="text-center font-bold">${totalQty}</td>
                                    <td class="text-center">
                                        <span class="status-badge status-${invoice.status}">${invoice.status?.toUpperCase() || 'PENDING'}</span>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        
                        ${page.pageNumber === pages.length ? `
                            <tr class="total-row text-black">
                                <td colspan="3" class="text-center font-bold">TOTAL</td>
                                <td class="text-center font-bold">${pages.flatMap(p => p.invoices).reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'MASTER').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}</td>
                                <td class="text-center font-bold">${pages.flatMap(p => p.invoices).reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'HALF').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}</td>
                                <td class="text-center font-bold">${pages.flatMap(p => p.invoices).reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'BOX').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}</td>
                                <td class="text-center font-bold">${pages.flatMap(p => p.invoices).reduce((sum, inv) => {
            const masterQty = inv.items?.filter(item => item.unit === 'MASTER').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
            const halfQty = inv.items?.filter(item => item.unit === 'HALF').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
            const boxQty = inv.items?.filter(item => item.unit === 'BOX').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
            return sum + masterQty + halfQty + boxQty;
        }, 0)}</td>
                                <td class="text-center font-bold">-</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice Report - ${filterLabel}</title>
                <style>
                    @media screen {
                        .page {
                            background: white;
                            margin: 0 auto 30px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                        }
                    }
                    
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0;
                            background: white;
                        }
                        .page {
                            margin: 0;
                            box-shadow: none;
                            border-radius: 0;
                        }
                        .page-break {
                            page-break-after: always;
                        }
                    }

                    .page {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 20mm;
                        box-sizing: border-box;
                        position: relative;
                    }
                    
                    .page-header {
                        text-align: center;
                        border-bottom: 3px solid #000;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .page-header h1 {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0 0 5px 0;
                        letter-spacing: 2px;
                        color: black;
                    }
                    
                    .page-header h2 {
                        font-size: 16px;
                        margin: 0 0 10px 0;
                        color: #666;
                    }
                    
                    .report-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #888;
                        margin-top: 10px;
                    }
                    
                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .report-table th,
                    .report-table td {
                        border: 1px solid #000;
                        padding: 6px 4px;
                        vertical-align: middle;
                    }
                    
                    .report-table th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        text-align: center;
                    }
                    
                    /* Column widths */
                    .sr-col { width: 5%; }
                    .invoice-col { width: 12%; }
                    .date-col { width: 10%; }
                    .customer-col { width: 15%; }
                    .phone-col { width: 10%; }
                    .items-col { width: 20%; }
                    .qty-col { width: 6%; }
                    .discount-col { width: 8%; }
                    .amount-col { width: 10%; }
                    .status-col { width: 8%; }
                    th {
                    color: black;
                    }
                    
                    .text-center { text-align: center; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    
                    .items-cell {
                        font-size: 9px;
                        line-height: 1.2;
                    }
                    
                    .status-badge {
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 8px;
                        font-weight: bold;
                    }
                    
                    .status-paid {
                        background-color: #d4edda;
                        color: #155724;
                    }
                    
                    .status-pending {
                        background-color: #fff3cd;
                        color: #856404;
                    }
                    
                    .status-overdue {
                        background-color: #f8d7da;
                        color: #721c24;
                    }
                    
                    .summary-section {
                        margin-top: 30px;
                        border-top: 2px solid #000;
                        padding-top: 15px;
                    }
                    
                    .summary-section h3 {
                        text-align: center;
                        font-size: 16px;
                        margin-bottom: 15px;
                    }
                    
                    .summary-table {
                        width: 60%;
                        margin: 0 auto;
                        font-size: 12px;
                    }
                    
                    .summary-table td {
                        padding: 8px 15px;
                        border: 1px solid #ccc;
                    }
                    
                    .summary-label {
                        font-weight: bold;
                        background-color: #f8f9fa;
                    }
                    
                    .summary-value {
                        text-align: right;
                        font-weight: bold;
                    }
                    
                    .grand-total {
                        background-color: #e3f2fd;
                        color: #1976d2;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                ${pagesHTML}
            </body>
            </html>
        `;
    };
    const generateReportHTML = (data) => {
        if (reportFormat === 'short') {
            return generateShortReportHTML(data);
        } else {
            return generateNormalReportHTML(data);
        }
    };


    // Handle filter change
    const handleFilterChange = (newFilterType) => {
        setFilterType(newFilterType);
        setCurrentPage(1);
        setIsDropdownOpen(false);

        if (newFilterType === 'custom') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
        }
    };

    // Apply custom date filter
    const applyCustomDateFilter = () => {
        if (customStartDate && customEndDate) {
            setCurrentPage(1);
            setShowCustomDate(false);
        }
    };

    // Generate and preview report
    const handlePreview = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const data = generateReportData(filterType);
            setReportData(data);
            setShowPreview(true);
            setIsGenerating(false);
        }, 500);
    };

    // Download report as PDF
    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const data = generateReportData(filterType);
            const htmlContent = generateReportHTML(data);

            // Call electron API to generate PDF
            const result = await generateReportPDF?.(htmlContent, {
                filename: `Invoice-Report-${data.filterLabel}-${data.generatedDate.replace(/\//g, '-')}.pdf`,
                filterType: data.filterType
            });

            if (result?.success) {
                showAlert(`✅ ${result.message || 'PDF downloaded successfully!'}`, 'success');
            } else {
                showAlert(`❌ PDF Error: ${result?.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showAlert(`Download failed: ${error.message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

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

    const handlePrintClick = async () => {
        // console.log('🖨️ Print button clicked');
        const status = await checkPrinterStatus();
        setShowModal(true);
    };

    // Print report
    const handlePrint = async () => {
        if (!reportData) return;
        setIsPrinting(true);
        try {
            const htmlContent = generateReportHTML(reportData);
            const result = await printReport?.(htmlContent);

            if (result?.success) {
                showAlert(`✅ Report sent to printer successfully!'}`, 'success');
                setShowModal(false);
                setPrinterStatus(null);
            } else {
                showAlert(`❌ Report failed: ${result?.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showAlert(`❌ Print failed: ${error.message}`, 'error');
            setIsPrinting(false);
        }
    };

    const reportFormatOptions = [
        { label: 'Normal Sale Sheet', value: 'normal', description: 'Standard detailed invoice report' },
        { label: 'Short Sale Sheet', value: 'short', description: 'Simplified summary report' }
    ];

    const handleFormatChange = (newFormat) => {
        setReportFormat(newFormat);
        setIsFormatDropdownOpen(false);
        setCurrentPage(1);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) {
                setIsFormatDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (showPreview && reportData) {
        return (
            <>
                {
                    alert.show && (
                        <div className={`fixed top-4w right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${alert.type === 'success'
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
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                    {/* Preview Header */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10 transition-colors">
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Report Preview</h1>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {reportData.filterLabel} Report • {reportData.totals.totalInvoices} Invoices • {reportData.totalPages} Pages
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isGenerating}
                                        className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isGenerating ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Download PDF
                                    </button>

                                    <button
                                        onClick={handlePrintClick}
                                        className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="py-6">
                        <div
                            className="report-preview"
                            dangerouslySetInnerHTML={{ __html: generateReportHTML(reportData) }}
                        />
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
                                <h3 className="text-xl font-bold mb-4 text-black dark:text-white">Print Report</h3>

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
                                                onClick={handlePrint}
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
                                                onClick={handleDownload}
                                                disabled={isGenerating}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? (
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
                                                onClick={handleDownload}
                                                disabled={isGenerating}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? (
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
    }
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
                            <h3 className="text-xl font-bold mb-4 text-black dark:text-white">Print Report</h3>

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
                                            onClick={handlePrint}
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
                                            onClick={handleDownload}
                                            disabled={isGenerating}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                                        >
                                            {isGenerating ? (
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
                                            onClick={handleDownload}
                                            disabled={isGenerating}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                        >
                                            {isGenerating ? (
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
            <div className="min-h-screen bg-trasparent p-6 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onBack}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Reports</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Generate and download invoice reports</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Report Format Dropdown */}
                                <div className="relative" ref={formatDropdownRef}>
                                    <button
                                        onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                                        className="flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-700 border border-purple-600 dark:border-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        {reportFormatOptions.find(opt => opt.value === reportFormat)?.label}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </button>

                                    {isFormatDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                                            {reportFormatOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleFormatChange(option.value)}
                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start space-x-3 transition-colors ${reportFormat === option.value ? 'bg-purple-50 dark:bg-purple-900' : ''
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        {exportOptions.find(opt => opt.value === filterType)?.label}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                                            {exportOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleFilterChange(option.value)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                                                >
                                                    <option.icon size={16} className="text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Custom Date Range Modal */}
                    {showCustomDate && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
                                    <button
                                        onClick={() => setShowCustomDate(false)}
                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            min={customStartDate}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setShowCustomDate(false)}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={applyCustomDateFilter}
                                            disabled={!customStartDate || !customEndDate}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {(() => {
                            const totals = calculateTotals(filteredInvoices);
                            return (
                                <>
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.totalInvoices}</p>
                                            </div>
                                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.totalAmount.toFixed(2)}</p>
                                            </div>
                                            <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.totalQuantity}</p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Pages Required</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPages}</p>
                                            </div>
                                            <Eye className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={handlePreview}
                                disabled={isGenerating || filteredInvoices.length === 0}
                                className="flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGenerating ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Eye className="h-5 w-5 mr-2" />
                                )}
                                {isGenerating ? 'Generating...' : 'Preview Report'}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={isGenerating || filteredInvoices.length === 0}
                                className="flex items-center px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Download PDF
                            </button>
                            <button
                                onClick={handlePrintClick}
                                className="flex items-center px-6 py-3 bg-purple-600 dark:bg-purple-700 border border-purple-600 dark:border-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Preview - Page {currentPage} of {totalPages}
                            </h2>

                            {totalPages > 1 && (
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            {reportFormat === 'short' && (
                                // Short Sale Sheet Table
                                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">Sr</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Date</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Phone</th>
                                            <th colSpan={3} className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Sale Qty</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Qty</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Status</th>
                                        </tr>
                                        <tr className="bg-gray-50 dark:bg-gray-600">
                                            <th className="border border-gray-300 dark:border-gray-600 p-1"></th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1"></th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1"></th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1 text-xs text-gray-900 dark:text-white">Master</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1 text-xs text-gray-900 dark:text-white">Dozen</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1 text-xs text-gray-900 dark:text-white">Box</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1"></th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-1"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedInvoices.map((invoice, index) => {
                                            const globalIndex = startIndex + index + 1;
                                            const masterQty = invoice.items?.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
                                            const halfQty = invoice.items?.filter(item => item.unit === 'HALF').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
                                            const boxQty = invoice.items?.filter(item => item.unit === 'BOX').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
                                            const totalQty = masterQty + halfQty + boxQty; // Total quantity calculation

                                            return (
                                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">{globalIndex}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">{new Date(invoice.date).toLocaleDateString()}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">{invoice.customer?.phone}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white">{masterQty || ''}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white">{halfQty || ''}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white">{boxQty || ''}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white">{totalQty}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs ${invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                                                            invoice.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                                                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                                                            }`}>
                                                            {invoice.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {currentPage === totalPages && (
                                            <tr className="bg-gray-200 dark:bg-gray-600 font-bold">
                                                <td colSpan="3" className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">TOTAL</td>
                                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">
                                                    {filteredInvoices.reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'MASTER').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">
                                                    {filteredInvoices.reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'HALF').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">
                                                    {filteredInvoices.reduce((sum, inv) => sum + (inv.items?.filter(item => item.unit === 'BOX').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0)}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">
                                                    {filteredInvoices.reduce((sum, inv) => {
                                                        const masterQty = inv.items?.filter(item => item.unit === 'MASTER').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
                                                        const halfQty = inv.items?.filter(item => item.unit === 'HALF').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
                                                        const boxQty = inv.items?.filter(item => item.unit === 'BOX').reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
                                                        return sum + masterQty + halfQty + boxQty;
                                                    }, 0)}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">-</td>
                                            </tr>)}
                                    </tbody>
                                </table>
                            )}
                            {reportFormat === 'normal' && (
                                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">Sr</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Invoice No</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Date</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Customer</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Items</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Qty</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Amount</th>
                                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedInvoices.map((invoice, index) => {
                                            const globalIndex = startIndex + index + 1;
                                            return (
                                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-gray-900 dark:text-white">{globalIndex}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">{new Date(invoice.date).toLocaleDateString()}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-white">{invoice.customer?.name}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {invoice.items?.map(item => `${item.unit == "half" ? "Dozen" : item.unit}: ${item.quantity}`).join(', ')}
                                                    </td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white">{invoice.totalQuantity}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-right font-bold text-gray-900 dark:text-white">{invoice.total}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs ${invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                                                            invoice.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                                                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                                                            }`}>
                                                            {invoice.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {filteredInvoices.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No invoices found for the selected filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </>
    );
};

export default InvoiceReportSystem;