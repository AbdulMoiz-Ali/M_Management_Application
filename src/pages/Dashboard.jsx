import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Settings
} from 'lucide-react';
import { useCustomer } from '../hooks/useCustomer';
import { useProduct } from '../hooks/useProduct';
import { useAuth } from '../hooks/useAuth';
import { useInvoice } from '../hooks/useInvoice';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { customers } = useCustomer();
  const { products } = useProduct();
  const { user } = useAuth();
  const { allinvoice } = useInvoice();
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers?.length || 0;
    const totalProducts = products?.length || 0;
    const totalInvoices = allinvoice?.length || 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let totalRevenue = 0;
    let previousRevenue = 0;
    let monthlyRevenue = 0;
    let previousMonthlyRevenue = 0;
    let pendingAmount = 0;
    let previousPendingAmount = 0;

    allinvoice?.forEach((invoice) => {
      const invoiceDate = new Date(invoice?.createdAt || invoice?.date || now);
      const total = invoice?.total || 0;

      totalRevenue += total;

      if (invoice?.status === 'pending') {
        pendingAmount += total;
      }

      // Monthly Revenue
      if (
        invoiceDate?.getMonth() === currentMonth &&
        invoiceDate?.getFullYear() === currentYear
      ) {
        monthlyRevenue += total;
      }

      if (
        invoiceDate?.getMonth() === lastMonth &&
        invoiceDate?.getFullYear() === lastMonthYear
      ) {
        previousMonthlyRevenue += total;

        if (invoice?.status === 'pending') {
          previousPendingAmount += total;
        }

        previousRevenue += total;
      }
    });

    const getTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0; // Changed from "New" to 100
      const trend = ((current - previous) / previous) * 100;
      if (trend > 500) return 500;
      if (trend < -500) return -500;
      return Number(trend.toFixed(2));
    };

    return {
      totalCustomers,
      totalProducts,
      totalInvoices,
      totalRevenue,
      previousRevenue,
      revenueTrend: getTrend(totalRevenue, previousRevenue),

      pendingAmount,
      previousPendingAmount,
      pendingTrend: getTrend(pendingAmount, previousPendingAmount),

      monthlyRevenue,
      previousMonthlyRevenue,
      monthlyTrend: getTrend(monthlyRevenue, previousMonthlyRevenue),

      customerTrend: getTrend(totalCustomers, customers?.filter(c => {
        const d = new Date(c?.createdAt);
        return d?.getMonth() === lastMonth && d?.getFullYear() === lastMonthYear;
      }).length || 0),

      productTrend: getTrend(totalProducts, products?.filter(p => {
        const d = new Date(p?.createdAt);
        return d?.getMonth() === lastMonth && d?.getFullYear() === lastMonthYear;
      }).length || 0),

      invoiceTrend: getTrend(totalInvoices, allinvoice?.filter(inv => {
        const d = new Date(inv?.createdAt || inv?.date);
        return d?.getMonth() === lastMonth && d?.getFullYear() === lastMonthYear;
      }).length || 0)
    };
  }, [customers, products, allinvoice]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getRecentInvoices = () => {
    if (!allinvoice) return [];

    return [...allinvoice]
      .sort((a, b) => new Date(b?.createdAt || b?.date || 0) - new Date(a?.createdAt || a?.date || 0));
  };

  const getTopSellingProducts = () => {
    if (!allinvoice || !products) return [];

    const salesMap = {};

    allinvoice?.forEach((invoice) => {
      const itemMap = {};

      invoice?.items?.forEach((item) => {
        if (!itemMap[item?.productId]) {
          itemMap[item?.productId] = 0;
        }
        itemMap[item?.productId] += item?.quantity || 0;
      });

      Object.entries(itemMap).forEach(([productId, qty]) => {
        salesMap[productId] = (salesMap[productId] || 0) + qty;
      });
    });

    const productsWithSales = products?.map((product) => ({
      ...product,
      sold: salesMap[product?.id] || 0,
    })) || [];

    return productsWithSales
      .sort((a, b) => (b?.sold || 0) - (a?.sold || 0))
      .slice(0, 10);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, bgColor }) => {
    const containerRef = useRef(null);
    const valueRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
      if (valueRef.current && containerRef.current) {
        setShouldScroll(valueRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    }, [value]);

    return (
      <div className="bg-white relative dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start space-x-4">
          <div className={`${bgColor} p-3 rounded-lg shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>

            <div className="flex items-center justify-between">
              <div
                ref={containerRef}
                className="overflow-hidden relative h-[2.5rem] max-w-full group cursor-default"
              >
                <div
                  ref={valueRef}
                  className={`text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap inline-block transition-all`}
                  style={
                    shouldScroll
                      ? {
                        animation: "scroll-left 10s linear infinite",
                        animationPlayState: "running",
                      }
                      : {}
                  }
                >
                  {value}
                </div>
              </div>

              {trend !== undefined && (
                <div className={`flex items-center ${trend > 0 || trend === "New" ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 || trend === "New" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="text-sm font-medium ml-1">
                    {trend === "New" ? "New" : `${Math.abs(trend)}%`}
                  </span>
                </div>
              )}
            </div>

            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <style jsx="true">{`
          @keyframes scroll-left {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
  
          .group:hover div[style*="scroll-left"] {
            animation-play-state: paused !important;
          }
        `}</style>
      </div>
    );
  };

  const QuickActionCard = ({ icon: Icon, title, description, color, onClick, to }) => (
    <Link
      to={to}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
    >
      <div className="flex items-center space-x-4">
        <div className={`${color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.username || 'User'}!
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your business today
            </p>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="w-16 h-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle="Active customers"
          trend={stats?.customerTrend}
          color="text-blue-600"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={Package}
          title="Products"
          value={stats?.totalProducts || 0}
          trend={stats?.productTrend}
          subtitle="In inventory"
          color="text-green-600"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={FileText}
          title="Total Invoices"
          value={stats?.totalInvoices || 0}
          subtitle="All time"
          trend={stats?.invoiceTrend}
          color="text-purple-600"
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          subtitle="All time earnings"
          trend={stats?.revenueTrend}
          color="text-yellow-600"
          bgColor="bg-yellow-500"
        />
        <StatCard
          icon={Clock}
          title="Pending Amount"
          value={formatCurrency(stats?.pendingAmount)}
          subtitle="Awaiting payment"
          color="text-orange-600"
          bgColor="bg-orange-500"
          trend={stats?.pendingTrend}
        />
        <StatCard
          icon={Calendar}
          title="This Month"
          value={formatCurrency(stats?.monthlyRevenue)}
          subtitle="Current month revenue"
          trend={stats?.monthlyTrend}
          color="text-indigo-600"
          bgColor="bg-indigo-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={FileText}
            title="New Invoice"
            description="Create a new invoice"
            color="bg-blue-500"
            to={"invoices"}
          />
          <QuickActionCard
            icon={Users}
            title="Add Customer"
            description="Register new customer"
            color="bg-green-500"
            to={"customers"}
          />
          <QuickActionCard
            icon={Package}
            title="Add Product"
            description="Add new product"
            color="bg-purple-500"
            to={"products"}
          />
          <QuickActionCard
            icon={Settings}
            title="Settings"
            description="Detailed analytics"
            color="bg-indigo-500"
            to={"settings"}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
            {getRecentInvoices()?.length > 3 && (
              <button onClick={() => setShowAllInvoices(!showAllInvoices)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                {showAllInvoices ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          <div className={`space-y-4 ${showAllInvoices && 'overflow-y-auto max-h-80'} pr-1`}>
            {getRecentInvoices()?.length > 0 ? (
              <>
                {
                  (showAllInvoices ? getRecentInvoices() : getRecentInvoices()?.slice(0, 3))?.map((invoice) => (
                    <div key={invoice?.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{invoice?.invoiceNumber}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{invoice?.customer?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice?.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${invoice?.status === 'paid'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : invoice?.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                          {invoice?.status}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
            {getTopSellingProducts()?.length > 3 && (
              <button onClick={() => setShowAllProducts(!showAllProducts)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                {showAllProducts ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          <div className={`space-y-4  ${showAllProducts && 'overflow-y-auto max-h-80'} pr-1`}>
            {getTopSellingProducts()?.length > 0 ? (
              <>
                {(showAllProducts ? getTopSellingProducts() : getTopSellingProducts()?.slice(0, 3))?.map((product) => (
                  <div
                    key={product?.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {product?.boxesPerMaster} boxes/master
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product?.pricePerMaster)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Sold: {product?.sold}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No products yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Paid Invoices</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {allinvoice?.filter(inv => inv?.status === 'paid')?.length || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Pending Invoices</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {allinvoice?.filter(inv => inv?.status === 'pending')?.length || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Growth Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.revenueTrend >= 0 ? '+' : ''}
              {stats?.revenueTrend?.toFixed ? stats.revenueTrend.toFixed(2) : '0.00'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;