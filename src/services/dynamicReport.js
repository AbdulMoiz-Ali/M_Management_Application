
export const generatePurchaseReportHTML = (data, user, itemsPerPage) => {
    const { filterLabel, pages, totals, generatedDate } = data;
    const settings = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
    }
    let pagesHTML = pages.map(page => `
    <div class="page">
        <div class="page-header">
            <h1>${settings?.martName}</h1>
            <h2>Purchase Master Qty Report - ${filterLabel}</h2>
            <div class="report-info">
                <span>Generated: ${generatedDate}</span>
                <span>Page ${page.pageNumber} of ${pages.length}</span>
                <span>Total Records: ${totals.totalRecords}</span>
            </div>
        </div>
        
        <table class="report-table">
            <thead>
                <tr>
                    <th class="sr-col">Sr</th>
                    <th class="date-col">Date</th>
                    <th class="supplier-col">Supplier</th>
                    <th class="qty-col">Master Qty</th>
                    <th class="amount-col">Amount</th>
                    <th class="status-col">Status</th>
                </tr>
            </thead>
            <tbody>
                ${page.invoices.map((purchase, index) => {
        const globalIndex = (page.pageNumber - 1) * itemsPerPage + index + 1;
        const masterQty = purchase.items?.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
        return `
                        <tr class="text-black">
                            <td class="text-center">${globalIndex}</td>
                            <td class="text-center">${new Date(purchase.date).toLocaleDateString()}</td>
                            <td class="text-left">${purchase.supplier?.name || ''}</td>
                            <td class="text-center font-bold">${masterQty || ''}</td>
                            <td class="text-center font-bold">${purchase.total || 0}</td>
                            <td class="text-center">
                                <span class="status-badge status-${purchase.status}">${purchase.status?.toUpperCase() || 'PENDING'}</span>
                            </td>
                        </tr>
                    `;
    }).join('')}
                
                ${page.pageNumber === pages.length ? `
                    <tr class="total-row text-black">
                        <td colspan="4" class="text-center font-bold">TOTAL</td>
                        <td class="text-center font-bold">${totals.totalMasterQty}</td>
                        <td class="text-center font-bold">${totals.totalAmount.toFixed(2)}</td>
                    </tr>
                ` : ''}
            </tbody>
        </table>
        
        ${page.pageNumber === pages.length ? `
            <div class="summary-section">
                <h3 class="text-black">PURCHASE SUMMARY</h3>
                <table class="summary-table text-black">
                    <tr>
                        <td class="summary-label">Total Purchases:</td>
                        <td class="summary-value">${totals.totalRecords}</td>
                        <td class="summary-label">Total Master Qty:</td>
                        <td class="summary-value">${totals.totalMasterQty}</td>
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
            <title>Purchase Report - ${filterLabel}</title>
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
export const generateNormalReportHTML = (data, user, itemsPerPage) => {
    const { filterLabel, pages, totals, generatedDate } = data;
    const settings = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
    }
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

        // Calculate grouped quantities
        const masterQty = invoice.items?.filter(item => item.unit === 'MASTER').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
        const halfQty = invoice.items?.filter(item => item.unit === 'HALF').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
        const boxQty = invoice.items?.filter(item => item.unit === 'BOX').reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

        // Create items display string with grouped quantities
        let itemsDisplay = '';
        const itemParts = [];

        if (masterQty > 0) itemParts.push(`Master: ${masterQty}`);
        if (halfQty > 0) itemParts.push(`Dozen: ${halfQty}`);
        if (boxQty > 0) itemParts.push(`Box: ${boxQty}`);

        itemsDisplay = itemParts.join('<br>');

        return `
                        <tr class="text-black">
                            <td class="text-center">${globalIndex}</td>
                            <td class="text-center">${invoice.invoiceNumber}</td>
                            <td class="text-center">${new Date(invoice.date).toLocaleDateString()}</td>
                            <td class="text-left">${invoice.customer?.name || ''}</td>
                            <td class="text-center">${invoice.customer?.phone || ''}</td>
                            <td class="text-left items-cell">${itemsDisplay}</td>
                            <td class="text-center font-bold">${invoice.totalQuantity || 0}</td>
                            <td class="text-center">${invoice.discountAmount || 0}</td>
                            <td class="text-center font-bold">${invoice.total || 0}</td>
                            <td class="text-center">
                                <span class="status-badge status-${invoice.status}">${invoice.status?.toUpperCase() || 'PENDING'}</span>
                            </td>
                        </tr>
                    `;
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
export const generateShortReportHTML = (data, user, itemsPerPage) => {
    const { filterLabel, pages, totals, generatedDate } = data;
    const settings = user || {
        martName: "MAKKAH CONFECTIONERY SUKKUR",
    }
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