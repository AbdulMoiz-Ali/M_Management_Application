import { BarChart3, TrendingUp } from 'lucide-react';
import React from 'react';

export default function RecentActivity({ recentInvoices, lowStockProducts }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Recent Invoices</h3>
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <div className="space-y-3 text-black">
          {recentInvoices.map(invoice => (
            <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{invoice.customer}</p>
                <p className="text-sm text-gray-500">
                  INV-{invoice.id} • {invoice.date}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">Rs.{invoice.amount.toLocaleString()}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  invoice.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Inventory Alerts</h3>
          <BarChart3 className="text-orange-500" size={20} />
        </div>
        <div className="space-y-3 text-black">
          {lowStockProducts.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded font-medium ${
                product.stock < 5 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {product.stock} left
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}