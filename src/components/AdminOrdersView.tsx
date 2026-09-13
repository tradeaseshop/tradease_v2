import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Eye, Clock, ShieldCheck, MapPin, Phone, Package, ChevronUp, 
  ChevronDown, DollarSign, Calendar, Truck, Filter, Trash2, Edit, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Order } from '../types';

interface AdminOrdersViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminOrdersView({
  orders,
  onUpdateOrderStatus,
  onToast,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminOrdersViewProps) {
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');

  // Expanded Order IDs row list
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Filter lists
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check Status (Wait, Paid vs Processing)
    // Note: status filter has Pending, Paid, Shipped, Delivered, Cancelled
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination math
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = (orderId: string, targetStatus: Order['status']) => {
    onUpdateOrderStatus(orderId, targetStatus);
    onToast(`Order ${orderId} has been updated to "${targetStatus}" successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Fulfillment Orders Ledger
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manage buyer shopping carts, releases escrow payouts, inspect delivery courier logs, and modify shipping status metrics.
        </p>
      </div>

      {/* Control row */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Order ID, buyer name, or region..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full justify-start md:justify-end">
          <div className="flex items-center gap-1.3 text-xs text-gray-500 dark:text-gray-400">
            <Filter className="w-3.5 h-3.5 text-[#95C93D]" />
            <span className="font-semibold" id="category">Fulfillment Status:</span>
          </div>

          <div className="flex flex-wrap gap-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800">
            {(['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#95C93D] text-slate-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {status === 'all' ? 'All Orders' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800/80">
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">Order ID</th>
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">Buyer Details</th>
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center font-mono">Date placed</th>
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Receipt Gross</th>
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center font-mono">Workflow Status</th>
                <th className="py-3.5 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Quick operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {currentItems.length > 0 ? (
                currentItems.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  
                  // Status styles
                  let statusBadgeStyle = "bg-amber-500/10 text-amber-550 border-amber-550/20";
                  if (order.status === 'Processing') statusBadgeStyle = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  else if (order.status === 'Shipped') statusBadgeStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
                  else if (order.status === 'Delivered') statusBadgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-[#95C93D] border-emerald-500/25";
                  else if (order.status === 'Cancelled') statusBadgeStyle = "bg-rose-500/10 text-rose-500 border-rose-500/20";

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all border-b border-gray-100/30">
                        {/* ID Block */}
                        <td className="py-4 px-5 font-mono text-xs font-black text-[#95C93D]">
                          {order.id}
                        </td>

                        {/* Buyer profile details */}
                        <td className="py-4 px-5">
                          <div>
                            <p className="text-xs font-bold text-gray-950 dark:text-white leading-none capitalize">{order.buyerName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1 tracking-wider">{order.buyerPhone}</p>
                          </div>
                        </td>

                        {/* Order Placement Date */}
                        <td className="py-4 px-5 text-center font-mono text-[10.5px] text-gray-500 dark:text-gray-350">
                          {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Order Cost Gross */}
                        <td className="py-4 px-5 text-center font-mono font-black text-xs text-gray-805 dark:text-white">
                          {currencySymbol}{order.totalAmount.toLocaleString()}
                        </td>

                        {/* Workflow Status badge */}
                        <td className="py-4 px-5 text-center">
                          <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                            {order.status}
                          </span>
                        </td>

                        {/* Actions drop inline selection */}
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 text-xs">
                            
                            {/* Expand receipts toggle */}
                            <button
                              onClick={() => handleToggleExpand(order.id)}
                              className="p-1 px-2.5 bg-gray-50 dark:bg-slate-950 text-gray-455 hover:text-[#95C93D] hover:bg-slate-100 border border-gray-200 dark:border-slate-805 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                            >
                              <span>Receipt</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Dropdown status setter */}
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                              className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-[#95C93D] rounded-lg focus:outline-none text-gray-700 dark:text-gray-200 font-bold"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Detail Pane */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 pl-8 border-b border-gray-105/50 font-sans">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-4 text-left"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  
                                  {/* Item items lists */}
                                  <div className="space-y-2 md:col-span-2">
                                    <h4 className="text-[11.5px] font-black uppercase text-[#95C93D] tracking-wider flex items-center gap-1.5">
                                      <Package className="w-4 h-4" />
                                      Shopping Cart Basket Content ({order.items.length})
                                    </h4>

                                    <div className="divide-y divide-gray-100 dark:divide-slate-800/50 space-y-1">
                                      {order.items.map((item, id) => (
                                        <div key={id} className="flex items-center gap-3.5 py-2">
                                          <img
                                            src={item.image}
                                            alt={item.productTitle}
                                            className="w-11 h-11 object-cover rounded-lg border border-gray-100 dark:border-slate-800"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-905 dark:text-white truncate">{item.productTitle}</p>
                                            <p className="text-[10.5px] text-gray-400 flex items-center gap-2">
                                              <span>Quantity: <strong className="font-bold text-gray-800 dark:text-white font-mono">{item.quantity}</strong></span>
                                              <span>•</span>
                                              <span>Unit Cost: <strong className="font-bold text-gray-800 dark:text-white font-mono">{currencySymbol}{item.price.toLocaleString()}</strong></span>
                                            </p>
                                          </div>
                                          <div className="text-right font-mono text-xs font-extrabold text-gray-900 dark:text-white pl-2">
                                            {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Logistics & Escrow Details */}
                                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805/80 rounded-xl p-4 space-y-3 shadow-xs">
                                    <h4 className="text-[11.5px] font-black uppercase text-[#95C93D] tracking-wider flex items-center gap-1.5">
                                      <Truck className="w-4 h-4" />
                                      Delivery Address details
                                    </h4>

                                    <div className="space-y-2 text-xs">
                                      <div className="flex items-start gap-2.5">
                                        <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-gray-800 dark:text-gray-300 font-semibold">{order.address}</p>
                                          <p className="text-gray-450 mt-0.5 font-bold">
                                            {order.city}, {order.state} State
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                                        <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                          <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Logistics Courier Profile</span>
                                          <p className="text-[10.5px] font-bold text-gray-800 dark:text-white leading-none mt-1">
                                            {order.shippingMethod || "DELIVERI Standard Courier"}
                                          </p>
                                          {order.deliveriTrackingNumber && (
                                            <p className="text-[10px] text-[#95C93D] mt-1.5 font-mono">
                                              TRACK ID: {order.deliveriTrackingNumber}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Courier Status Toggle details */}
                                      {order.deliveriStatus && (
                                        <div className="bg-slate-100 dark:bg-slate-950 p-2 border border-gray-150 dark:border-slate-805 rounded-lg flex items-center justify-between mt-1 text-[10px]">
                                          <span className="text-gray-400">Carrier State:</span>
                                          <span className="font-mono font-black text-emerald-500 uppercase">{order.deliveriStatus}</span>
                                        </div>
                                      )}
                                    </div>

                                  </div>

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-gray-400 dark:text-gray-500 mb-2">
                      <Package className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-350">No orders found</h3>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                      Adjust your search keyword or selected status badge state to locate incoming buyer logs.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Orders pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-gray-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Showing <strong className="text-gray-700 dark:text-white font-bold">{startIndex + 1}</strong> to{' '}
              <strong className="text-gray-700 dark:text-white font-bold font-bold">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </strong>{' '}
              of <strong className="text-gray-700 dark:text-white font-bold">{totalItems}</strong> entries
            </span>

            <div className="flex gap-1" id="orders-pagination-buttons">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 duration-200 rounded-lg text-gray-450 dark:text-gray-400 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-7.5 h-7.5 text-xs font-bold rounded-lg border transition-all ${
                    currentPage === i + 1
                      ? 'bg-[#95C93D] border-[#95C93D] text-slate-950 font-black'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-305 hover:bg-slate-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 duration-200 rounded-lg text-gray-450 dark:text-gray-400 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
