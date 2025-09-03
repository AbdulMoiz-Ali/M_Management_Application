import { AlertCircle } from 'lucide-react';
import React from 'react';

export default function AlertsSection({ overdueInvoices, lowStockProducts }) {
  const hasAlerts = overdueInvoices > 0 || lowStockProducts > 0;
  
  if (!hasAlerts) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <AlertCircle className="text-red-500 mr-2" size={20} />
        <h3 className="font-semibold text-red-800">Attention Required</h3>
      </div>
      {overdueInvoices > 0 && (
        <p className="text-red-700 text-sm">• {overdueInvoices} overdue invoices need attention</p>
      )}
      {lowStockProducts > 0 && (
        <p className="text-red-700 text-sm">• {lowStockProducts} products are running low on stock</p>
      )}
    </div>
  );
}