import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, Search, ArrowUpRight, DollarSign, CheckCircle2, 
  XCircle, Clock, ShieldCheck, HelpCircle, Activity, Award, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Transaction, AdminVendor } from './AdminTypes';
import { Order } from '../types';
import { Withdrawal } from '../api';

interface AdminPaymentsViewProps {
  transactions: Transaction[];
  vendors: AdminVendor[];
  orders: Order[];
  withdrawals: Withdrawal[];
  commissionPercent: number;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminPaymentsView({
  transactions,
  vendors,
  orders,
  withdrawals,
  commissionPercent,
  onToast,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminPaymentsViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState<'all' | Transaction['paymentMethod']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Transaction['status']>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGateway = gatewayFilter === 'all' || t.paymentMethod === gatewayFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesGateway && matchesStatus;
  });

  // Pagination math
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Real figures, computed from actual withdrawal requests and delivered
  // orders — this used to be a set of hardcoded placeholder numbers.
  const heldBalance = withdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Approved')
    .reduce((sum, w) => sum + w.amount, 0);
  const totalPayoutsSettled = withdrawals
    .filter((w) => w.status === 'Paid')
    .reduce((sum, w) => sum + w.amount, 0);
  const deliveredRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  // Approximate using the platform's global commission rate — vendors or
  // products with a custom override (see Vendors/Catalog) will make the
  // true figure differ slightly from this estimate.
  const platformFeesAccrued = deliveredRevenue * (commissionPercent / 100);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Finances
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Verify payment transactions, track held balances, and process vendor payouts.
        </p>
      </div>

      {/* Finance Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Held balance card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805/85 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-mono">Held Balance</span>
            <span className="text-[9.5px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Secure Lock
            </span>
          </div>

          <div className="my-3">
            <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
              {currencySymbol}{heldBalance.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-gray-500 dark:text-gray-450 mt-1">
              Protected funds waiting shipping fulfillment confirmation.
            </p>
          </div>
        </div>

        {/* Clear Payout settled volumes card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805/85 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-mono">settled payouts</span>
            <span className="text-[9.5px] font-black uppercase text-emerald-505 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-505 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Settled
            </span>
          </div>

          <div className="my-3">
            <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
              {currencySymbol}{totalPayoutsSettled.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-gray-500 dark:text-gray-450 mt-1">
              Total sales capital wired securely straight to vendor accounts.
            </p>
          </div>
        </div>

        {/* Platform Commission accumulated share */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805/85 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-mono">Platform earnings</span>
            <span className="text-[9.5px] font-black uppercase text-[#95C93D] bg-[#95C93D]/10 px-2 py-0.5 rounded-full border border-[#95C93D]/25 flex items-center gap-1">
              <Activity className="w-3 h-3" /> 8.5% Cut
            </span>
          </div>

          <div className="my-3">
            <h3 className="text-2xl font-black text-gray-955 dark:text-white tracking-tight">
              {currencySymbol}{platformFeesAccrued.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-gray-500 dark:text-gray-450 mt-1">
              TradeEase platform service commissions yielded year-to-date.
            </p>
          </div>
        </div>

      </div>

      {/* Grid of vendors requiring payout settlement vs transactions ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transaction ledger table list */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">
                Live Gateway Logs
              </h2>
              <p className="text-[11px] text-gray-400">
                Incoming transaction feeds and references from Paystack.
              </p>
            </div>
          </div>

          {/* Table search row inside logs */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-405" />
              <input
                type="text"
                placeholder="Search Reference, buyer or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#95C93D] text-gray-901 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-805 text-xs text-gray-700 dark:text-gray-300 px-2.5 py-1.5 focus:ring-1 focus:ring-[#95C93D] rounded-lg focus:outline-none"
            >
              <option value="all">All States</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          {/* Small table of logs */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-black uppercase text-gray-400">Buyer</th>
                  <th className="py-2.5 px-3 font-black uppercase text-gray-400">Reference</th>
                  <th className="py-2.5 px-3 font-black uppercase text-gray-400">Gateway</th>
                  <th className="py-2.5 px-3 font-black uppercase text-gray-400 text-center">Amount</th>
                  <th className="py-2.5 px-3 font-black uppercase text-gray-400 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {currentItems.length > 0 ? (
                  currentItems.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{tx.buyerName}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{tx.email}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-gray-500">
                        {tx.reference}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-gray-850 dark:text-white">
                        {currencySymbol}{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          tx.status === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : tx.status === 'failed'
                              ? 'bg-rose-500/10 border-emerald-500/20 text-rose-500'
                              : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No matching transaction reference was found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Transactions Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100 dark:border-slate-800">
              <span className="text-gray-405">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 px-2 border border-gray-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold rounded cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 px-2 border border-gray-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold rounded cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Vendors Payout Settler lists */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-950 dark:text-white mb-1">
              Vendor Payouts
            </h2>
            <p className="text-[11px] text-gray-400 mb-3 block">
              Merchants awaiting funds release clearances.
            </p>

            <div className="divide-y divide-gray-100 dark:divide-slate-800/50 space-y-3.5">
              {withdrawals.filter((w) => w.status === 'Pending').length === 0 ? (
                <p className="text-[11px] text-gray-400 py-2">No pending withdrawal requests right now.</p>
              ) : (
                withdrawals
                  .filter((w) => w.status === 'Pending')
                  .slice(0, 3)
                  .map((w) => (
                    <div key={w.id} className="pt-3 first:pt-0 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-901 dark:text-white capitalize">{w.vendorName}</p>
                        <p className="text-[10px] text-gray-405 font-mono">{w.id}</p>
                        <span className="text-[10px] text-[#95C93D] font-extrabold block mt-1 font-mono">
                          REQUESTED: {currencySymbol}{w.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Approve or reject requests under the <strong>Vendor Withdrawals</strong> tab.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 border border-gray-100 dark:border-slate-805/70 rounded-xl">
            <h4 className="text-[10.5px] font-black uppercase text-gray-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#95C93D]" /> Payment Security
            </h4>
            <p className="text-[10px] text-gray-405 mt-2 leading-relaxed">
              Before clearing high-volume platform transfers, ensure courier delivery status indicates "Delivered" and user log feedback shows zero active disputes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
