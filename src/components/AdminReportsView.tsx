import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Download, CheckCircle, Radio, AlertTriangle, HelpCircle, 
  Trash2, X, RefreshCw, User, TrendingUp, BarChart2, Star
} from 'lucide-react';
import { ForumReport, AdminVendor } from './AdminTypes';

interface AdminReportsViewProps {
  reports: ForumReport[];
  vendors: AdminVendor[];
  onUpdateReportStatus: (reportId: string, newStatus: ForumReport['status']) => void;
  onCreateReport: (report: { reporterName: string; subject: string; type: ForumReport['type']; description?: string }) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminReportsView({
  reports,
  vendors,
  onUpdateReportStatus,
  onCreateReport,
  onToast,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminReportsViewProps) {
  // Dispute Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ForumReport['status']>('all');

  // New dispute logging form
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [newReporterName, setNewReporterName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newType, setNewType] = useState<ForumReport['type']>('Product Dispute');
  const [newDescription, setNewDescription] = useState('');

  const handleLogNewDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReporterName.trim() || !newSubject.trim()) {
      onToast('Reporter name and subject are required.', 'error');
      return;
    }
    onCreateReport({
      reporterName: newReporterName.trim(),
      subject: newSubject.trim(),
      type: newType,
      description: newDescription.trim() || undefined,
    });
    setShowNewReportModal(false);
    setNewReporterName('');
    setNewSubject('');
    setNewDescription('');
    setNewType('Product Dispute');
  };

  // Payout CSV compilation simulation
  const [isCompilingCSV, setIsCompilingCSV] = useState(false);
  const [compiledSuccess, setCompiledSuccess] = useState(false);

  // Expanded complaint ID
  const [activeReport, setActiveReport] = useState<ForumReport | null>(null);

  // Search filter Complaint logs
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleResolveDispute = (reportId: string) => {
    onUpdateReportStatus(reportId, 'Resolved');
    onToast(`Dispute ticket ${reportId} has been successfully resolved under trade agreements.`, 'success');
  };

  const handleInvestigateDispute = (reportId: string) => {
    onUpdateReportStatus(reportId, 'Investigating');
    onToast(`Dispute ticket ${reportId} is assigned to legal active investigations.`, 'info');
  };

  const triggerCSVCompilationSimulation = () => {
    setIsCompilingCSV(true);
    setCompiledSuccess(false);

    setTimeout(() => {
      setIsCompilingCSV(false);
      setCompiledSuccess(true);
      onToast("TradeEase analytical ledger exported as TradeEase-Report-Q2.csv", "success");
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Audit Ledger Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Export comprehensive financial summaries, monitor customer purchase disputes, and moderate active logistics compliance.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewReportModal(true)}
            className="py-2 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 shadow-xs hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-black rounded-xl duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Log New Dispute</span>
          </button>
          <button
            onClick={triggerCSVCompilationSimulation}
            style={{ backgroundColor: '#003D36', color: '#95C93D' }}
            className="py-2 px-4 shadow-xs hover:bg-[#003D36]/80 border border-[#95C93D]/30 text-xs font-black rounded-xl duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#95C93D]" />
            <span>Export Analytics Ledger</span>
          </button>
        </div>
      </div>

      {/* New Dispute Modal */}
      <AnimatePresence>
        {showNewReportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewReportModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md space-y-4 border border-gray-150 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Log a New Dispute</h3>
                  <button onClick={() => setShowNewReportModal(false)} className="p-1 rounded-full bg-gray-100 dark:bg-slate-800 cursor-pointer">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleLogNewDispute} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Reporter Name</label>
                    <input
                      value={newReporterName}
                      onChange={(e) => setNewReporterName(e.target.value)}
                      placeholder="Buyer or vendor name"
                      className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Subject</label>
                    <input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Short summary"
                      className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ForumReport['type'])}
                      className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="Product Dispute">Product Dispute</option>
                      <option value="Failed Payout">Failed Payout</option>
                      <option value="Seller Fraud">Seller Fraud</option>
                      <option value="Delivery Complaint">Delivery Complaint</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Description (optional)</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-[11px] cursor-pointer"
                  >
                    Log Dispute
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Analytics Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Vendors by Cumulative metrics Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-[#95C93D]" />
            <div>
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider pl-0.5">Top Sellers by Gross Revenue</h3>
              <p className="text-[11px] text-gray-400">Performance rating of elite digital distributors</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {vendors
              .filter(v => v.status === 'Approved')
              .sort((a, b) => b.totalSales - a.totalSales)
              .slice(0, 4)
              .map((vendor, index) => {
                // Percentage representation
                const maxVal = 2100000; // Lagos Gadget Hub Max
                const pct = Math.round((vendor.totalSales / maxVal) * 100);
                
                return (
                  <div key={vendor.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-[#95C93D] flex items-center justify-center font-black text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-gray-801 dark:text-gray-200 capitalize">{vendor.name}</span>
                        <span className="text-[9px] text-gray-400">({vendor.storeCategory})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">{vendor.totalProducts} items</span>
                        <strong className="font-mono text-gray-910 dark:text-white font-extrabold">
                          {currencySymbol}{vendor.totalSales.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100 dark:border-slate-805">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#95C93D] to-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Dispute health scores index */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider pl-0.5">Resolved disputes index</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed block">
              Mitigation performance matrix. Resolving complaints promptly builds buyer trust.
            </p>

            <div className="relative flex items-center justify-center py-4">
              <svg width="120" height="120" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke={isDarkMode ? "#1B4D47" : "#E2E8F0"} strokeWidth="4" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#95C93D" strokeWidth="4" strokeDasharray="80 20" strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-mono font-black text-gray-901 dark:text-white">80%</span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block mt-0.5">Cleared rate</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-gray-100 dark:border-slate-805">
            <span className="text-[10px] text-emerald-500 font-extrabold flex items-center justify-center gap-1">
              ★ Escrow Insurance Shield active
            </span>
          </div>
        </div>

      </div>

      {/* Disputes / Resolution Center Row */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row md:items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-805/30 pb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-955 dark:text-white">
              Resolution Clearance Center
            </h2>
            <p className="text-[11px] text-gray-400">
              Receive buyer dispute arbitration applications on shipping failures, defective items, or missing orders.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 text-xs text-gray-700 dark:text-gray-250 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-[#95C93D] rounded-xl font-bold"
            >
              <option value="all">All statuses</option>
              <option value="Open">Open Tickets</option>
              <option value="Investigating">Investigation</option>
              <option value="Resolved">Resolved Issues</option>
            </select>
          </div>
        </div>

        {/* Disputes Grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((rep) => {
              // Indicators
              let alertStyle = "bg-rose-500/10 border-rose-500/20 text-rose-500";
              if (rep.status === 'Investigating') alertStyle = "bg-amber-500/10 border-amber-500/20 text-amber-500";
              else if (rep.status === 'Resolved') alertStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";

              return (
                <div 
                  key={rep.id} 
                  className="p-4 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/40 border border-gray-150 dark:border-slate-850/80 rounded-2xl flex flex-col justify-between space-y-3.5 transition-all text-left"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#95C93D] text-[10.5px] font-black">{rep.id}</span>
                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${alertStyle}`}>
                        {rep.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-950 dark:text-white">{rep.subject}</h4>
                    <p className="text-[10.5px] text-gray-400 capitalize flex items-center gap-1 font-semibold">
                      <User className="w-3.5 h-3.5 text-[#95C93D]" />
                      Reporter: <strong className="text-gray-800 dark:text-white font-bold">{rep.reporterName}</strong>
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-405 leading-relaxed bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-805/50 rounded-xl p-3">
                    {rep.description}
                  </p>

                  <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-gray-100/20 font-mono">
                    <span className="text-gray-400">Class: <strong>{rep.type}</strong></span>
                    
                    <div className="flex gap-2">
                      {rep.status !== 'Resolved' && (
                        <>
                          {rep.status === 'Open' && (
                            <button
                              onClick={() => handleInvestigateDispute(rep.id)}
                              className="px-2.5 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                            >
                              Investigate
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveDispute(rep.id)}
                            style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                            className="px-2.5 py-1 border border-[#95C93D]/35 hover:bg-[#003d36]/80 text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => setActiveReport(rep)}
                        className="p-1 px-2 border border-gray-250 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 text-gray-500 duration-200 rounded-lg"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 py-10 text-center text-gray-500">
              No customer complaint disputes matched filter parameters.
            </div>
          )}
        </div>

      </div>

      {/* Simulated Compile analytical Spreadsheet popup overlay */}
      <AnimatePresence>
        {isCompilingCSV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-xl text-center space-y-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#003D36] border border-[#95C93D]/30 text-[#95C93D] flex items-center justify-center mx-auto scale-105">
                <RefreshCw className="w-5 h-5 animate-spin text-[#95C93D]" />
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight">Compiling analytical files</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Parsing escrow ledger, seller products catalogues, and local settlement coordinates...
                </p>
              </div>

              <div className="w-full h-1.5 bg-gray-105 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.6 }}
                  className="h-full bg-gradient-to-r from-[#95C93D] to-emerald-600 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dispute details Lightbox panel */}
      <AnimatePresence>
        {activeReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left"
            >
              <button
                onClick={() => setActiveReport(null)}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-405 dark:text-gray-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="pb-4 border-b border-gray-100 dark:border-slate-805/85 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[#95C93D] font-black text-xs block">{activeReport.id}</span>
                  <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight mt-1 truncate max-w-[280px]">
                    {activeReport.subject}
                  </h3>
                </div>
              </div>

              <div className="pt-4 space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100/50">
                  <div>
                    <span className="text-[10px] text-gray-405 font-bold uppercase block font-mono">Incident Type</span>
                    <strong className="text-gray-801 dark:text-gray-250 font-black">{activeReport.type}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-405 font-bold uppercase block font-mono font-mono">Date Filed</span>
                    <strong className="text-gray-801 dark:text-gray-250 font-mono font-bold">{activeReport.date}</strong>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-450 font-bold uppercase block font-mono">Reporter identity</span>
                    <strong className="text-gray-801 dark:text-gray-220 font-black capitalize">{activeReport.reporterName}</strong>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-450 font-bold uppercase block font-mono">Arbitration Case status</span>
                    <span className="text-emerald-580 font-black flex items-center gap-1 font-bold">
                      {activeReport.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-gray-150 dark:border-slate-805 rounded-xl leading-relaxed text-gray-650 dark:text-gray-305 text-xs">
                  <h4 className="font-bold text-gray-950 dark:text-white uppercase text-[9.5px] font-mono tracking-wide mb-1.5">Statement from complainant</h4>
                  {activeReport.description}
                </div>

                <div className="flex gap-2 pt-2">
                  {activeReport.status !== 'Resolved' && (
                    <button
                      onClick={() => {
                        handleResolveDispute(activeReport.id);
                        setActiveReport(null);
                      }}
                      style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                      className="flex-1 py-2 rounded-xl text-xs font-black border border-[#95C93D]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Set Ticket as Resolved</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 border border-gray-205 dark:border-slate-805 text-gray-500 hover:bg-slate-50 dark:text-gray-350 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
