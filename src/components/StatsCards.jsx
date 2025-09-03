import { Calendar, DollarSign, Package, User } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function StatsCards({
  totalCustomers,
  totalRevenue,
  pendingAmount,
  totalProducts,
  lowStockProducts
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Link to={"/customers"} className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Customers</h3>
          <User className="text-blue-500" size={20} />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="text-3xl text-black font-bold">{totalCustomers}</div>
            <div className="text-gray-500 mt-1">Total Customers</div>
          </div>
        </div>
      </Link>

      <Link to={"/reports"} className="bg-white rounded-xl shadow-md p-6 border text-black">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Revenue</h3>
          <DollarSign className="text-green-500" size={20} />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DollarSign className="text-gray-500 mr-2" size={16} />
              <span>Total</span>
            </div>
            <span className="font-bold text-black">Rs.{totalRevenue.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Calendar className="text-yellow-500 mr-2" size={16} />
              <span>Pending</span>
            </div>
            <span className="font-bold text-black">Rs.{pendingAmount.toLocaleString()}</span>
          </div>
        </div>
      </Link>

      <Link to={"/products"} className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Products</h3>
          <Package className="text-purple-500" size={20} />
        </div>
        <div className="space-y-4 text-black">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Package className="text-gray-500 mr-2" size={16} />
              <span>Total</span>
            </div>
            <span className="font-bold text-black">{totalProducts}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span>Low Stock</span>
            </div>
            <span className="font-bold text-black">{lowStockProducts}</span>
          </div>
        </div>
      </Link>

      <Link to={"/invoices"} className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Suppliers</h3>
          <div className="bg-orange-100 p-2 rounded-lg">
            <Package className="text-orange-500" size={20} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-black items-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
              <span>Total</span>
            </div>
            <span className="font-bold">24</span>
          </div>

          <div className="flex justify-between text-black items-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Active</span>
            </div>
            <span className="font-bold">22</span>
          </div>
        </div>
      </Link>
    </div>
  );
}