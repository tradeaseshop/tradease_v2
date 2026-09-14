import React, { useState } from 'react';
import { Banknote, Search, CheckCircle, XCircle, Send } from 'lucide-react';
import { Withdrawal } from '../api';

interface AdminWithdrawalsViewProps {
  withdrawals: Withdrawal[];
  onUpdateStatus: (id: string, status: 'Approved' | 'Rejected' | 'Paid', notes?: string) => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

const STATUS_STYLES: Record<Withdrawal['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Approved: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function AdminWithdrawalsView({ withdrawals, onUpdateStatus, currencySymbol = '₦' }: AdminWithdrawalsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Withdrawal['status']>('all');

  const filtered = withdrawals.filter((w) => {
    const matchesSearch =
      !searchTerm ||
      w.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingTotal = withdrawals.filter((w) => w.status === 'Pending').reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Vendor Withdrawals</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Review and process vendor payout requests.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Banknote className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide block">Pending Requests Total</span>
          <span className="text-lg font-black">{currencySymbol}{pendingTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vendor name or request ID..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-xs">No withdrawal requests found.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{w.vendorName}</p>
                  <p className="text-[10px] text-gray-400">{w.vendorEmail} • {w.id}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg shrink-0 ${STATUS_STYLES[w.status]}`}>
                  {w.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-950 rounded-xl p-3">
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-base">{currencySymbol}{w.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {w.bankName} • {w.accountNumber} • {w.accountName}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(w.requestedAt).toLocaleDateString()}
                </span>
              </div>

              {w.status === 'Pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onUpdateStatus(w.id, 'Approved')}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for rejecting this withdrawal? (optional)') || undefined;
                      onUpdateStatus(w.id, 'Rejected', reason);
                    }}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}

              {w.status === 'Approved' && (
                <button
                  onClick={() => onUpdateStatus(w.id, 'Paid')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Mark as Paid (after sending the bank transfer)
                </button>
              )}

              {w.notes && (
                <p className="text-[10px] text-gray-400 italic">Note: {w.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
