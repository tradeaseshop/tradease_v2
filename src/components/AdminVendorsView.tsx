import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, X, ShieldAlert, Award, AlertTriangle, Building, 
  Mail, Phone, Calendar, ShoppingBag, DollarSign, Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { AdminVendor } from './AdminTypes';

interface AdminVendorsViewProps {
  vendors: AdminVendor[];
  onUpdateVendorStatus: (vendorId: string, newStatus: 'Approved' | 'Pending' | 'Rejected') => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onAddVendor?: (vendor: AdminVendor) => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminVendorsView({
  vendors,
  onUpdateVendorStatus,
  onToast,
  onAddVendor,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminVendorsViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected'>('all');

  // Selected Vendor Detail Modal
  const [selectedVendor, setSelectedVendor] = useState<AdminVendor | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Direct Vendor Onboarding States
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Electronics');

  // Filter application
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      vendor.storeCategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination math
  const totalItems = filteredVendors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApprove = (vendor: AdminVendor) => {
    onUpdateVendorStatus(vendor.id, 'Approved');
    onToast(`Vendor application for ${vendor.name} has been Approved live!`, 'success');
  };

  const handleReject = (vendor: AdminVendor) => {
    onUpdateVendorStatus(vendor.id, 'Rejected');
    onToast(`Vendor application for ${vendor.name} has been Rejected.`, 'error');
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorEmail.trim() || !newVendorPhone.trim()) {
      onToast("Please complete all vendor metric fields.", "error");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newVendorEmail.trim())) {
      onToast("Please provide a valid email address.", "error");
      return;
    }

    if (onAddVendor) {
      onAddVendor({
        id: `vendor-${Date.now().toString().slice(-4)}`,
        name: newVendorName.trim(),
        email: newVendorEmail.trim(),
        phone: newVendorPhone.trim(),
        status: 'Approved',
        totalProducts: 0,
        totalSales: 0,
        rating: 5.0,
        joiningDate: new Date().toISOString().split('T')[0],
        storeCategory: newVendorCategory
      });
      onToast(`Vendor Storefront "${newVendorName}" has been successfully provisioned live!`, "success");
      setNewVendorName('');
      setNewVendorEmail('');
      setNewVendorPhone('');
      setNewVendorCategory('Electronics');
      setShowAddVendorModal(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Sellers & Storefronts
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Review credentials, clear escrow payout eligibility, and manage active licensed TradeEase distributor storefronts.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddVendorModal(true)}
          style={{ backgroundColor: '#003D36', color: '#95C93D' }}
          className="px-4 py-2 hover:opacity-90 active:scale-95 duration-200 cursor-pointer rounded-xl flex items-center justify-center gap-2 border border-[#95C93D]/30 shadow-md font-extrabold text-xs uppercase"
        >
          <Building className="w-4 h-4 text-[#95C93D]" />
          <span>Provision Vendor Store</span>
        </button>
      </div>

      {/* Control Panel: Search & State filters */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stores or categories..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Categories toggler */}
        <div className="flex flex-wrap items-center gap-3 w-full justify-start md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Filter className="w-3.5 h-3.5 text-[#95C93D]" />
            <span className="font-semibold" id="category">License State:</span>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800">
            {(['all', 'Approved', 'Pending', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#95C93D] text-slate-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {status === 'all' ? 'All Sellers' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors List Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800/80">
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">Market Storefront</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">Core Category</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Catalog Products</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Cumulative Sales</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center font-mono">Status State</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Approval decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {currentItems.length > 0 ? (
                currentItems.map((vendor) => (
                  <tr 
                    key={vendor.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                  >
                    
                    {/* Market Storefront */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-950 to-[#003D36] text-[#95C93D] font-black flex items-center justify-center border border-white/5 shadow-xs uppercase font-mono">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-950 dark:text-white truncate max-w-[170px]">{vendor.name}</p>
                          <p className="text-[10.5px] text-gray-400 truncate max-w-[170px]">{vendor.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Core Category */}
                    <td className="py-3.5 px-5 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                      {vendor.storeCategory}
                    </td>

                    {/* Catalog count */}
                    <td className="py-3.5 px-5 text-center text-xs font-mono font-bold text-gray-800 dark:text-white">
                      {vendor.totalProducts} Items
                    </td>

                    {/* Cumulative Volume */}
                    <td className="py-3.5 px-5 text-center font-bold text-xs text-gray-900 dark:text-emerald-400 font-mono">
                      {currencySymbol}{vendor.totalSales.toLocaleString()}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        vendor.status === 'Approved'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                          : vendor.status === 'Pending'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>

                    {/* Approval Interactive Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Detail Inspector icon */}
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          title="Review profile metrics"
                          className="px-2 py-1 bg-gray-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-500 text-[10px] font-bold border border-gray-150 dark:border-slate-800 transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>

                        {/* Inline Quick Action Gating */}
                        {vendor.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(vendor)}
                              title="Approve Storefront"
                              className="p-1 px-1.5 bg-emerald-500/15 text-emerald-600 dark:text-[#95C93D] hover:bg-emerald-500/25 rounded-lg border border-emerald-500/20 duration-200 transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleReject(vendor)}
                              title="Reject Application"
                              className="p-1 px-1.5 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 rounded-lg border border-rose-500/20 duration-200 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {vendor.status === 'Rejected' && (
                          <button
                            onClick={() => handleApprove(vendor)}
                            title="Re-approve licensed store"
                            className="p-1 text-xs px-2.5 bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-950 dark:hover:bg-[#95C93D] dark:hover:text-slate-950 text-gray-500 rounded-lg border border-gray-200 dark:border-slate-800 font-bold transition-all duration-200 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {vendor.status === 'Approved' && (
                          <button
                            onClick={() => handleReject(vendor)}
                            title="De-authorize store licenses"
                            className="p-1 text-xs px-2 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-950 dark:hover:bg-rose-950 dark:hover:text-rose-400 text-gray-400 rounded-lg font-mono border border-gray-200 dark:border-slate-800 transition-all duration-200 cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-gray-400 dark:text-gray-500 mb-2">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-350">No sellers matched parameters</h3>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                      Filter criteria are currently restricting other active or pending merchant applications.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vendors Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-gray-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Showing <strong className="text-gray-700 dark:text-white font-bold">{startIndex + 1}</strong> to{' '}
              <strong className="text-gray-700 dark:text-white font-bold">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </strong>{' '}
              of <strong className="text-gray-700 dark:text-white font-bold">{totalItems}</strong> sellers
            </span>

            <div className="flex gap-1">
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
                  className={`w-7.5 h-7.5 rounded-lg border text-xs font-bold transition-all ${
                    currentPage === i + 1
                      ? 'bg-[#95C93D] border-[#95C93D] text-slate-950'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-305 hover:bg-slate-100 dark:hover:bg-slate-850'
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

      {/* Vendor Profile inspection lightbox modal */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative text-left"
            >
              <button
                onClick={() => setSelectedVendor(null)}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-gray-450 dark:text-gray-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-950 to-[#003D36] border border-[#95C93D]/30 flex items-center justify-center text-2xl font-black text-[#95C93D] uppercase">
                  {selectedVendor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white capitalize leading-none">
                    {selectedVendor.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 font-semibold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Store Category: <strong className="text-gray-900 dark:text-white font-bold">{selectedVendor.storeCategory}</strong></span>
                  </p>
                </div>
              </div>

              {/* Vendor Statistics */}
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-150 dark:border-slate-850/50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Products Cataloged</span>
                  <p className="text-base font-black text-gray-900 dark:text-white mt-1 font-mono">{selectedVendor.totalProducts}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-150 dark:border-slate-850/50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Gross Revenues</span>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-450 mt-1 font-mono">
                    {currencySymbol}{selectedVendor.totalSales.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-150 dark:border-slate-850/50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Merchant Rating</span>
                  <p className="text-base font-black text-amber-500 mt-1 font-mono">
                    {selectedVendor.rating > 0 ? `★ ${selectedVendor.rating}` : 'New Store'}
                  </p>
                </div>
              </div>

              {/* Meta information lists */}
              <div className="space-y-3.5 text-xs">
                
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-950/80 p-4 border border-gray-150 dark:border-slate-850 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Contact Email</span>
                    <span className="text-gray-805 dark:text-gray-200 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#95C93D]" />
                      <span className="truncate max-w-[130px]">{selectedVendor.email}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Store Telephone</span>
                    <span className="text-gray-805 dark:text-gray-200 font-mono font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#95C93D]" />
                      <span>{selectedVendor.phone}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Licensing Date</span>
                    <span className="text-gray-805 dark:text-gray-200 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#95C93D]" />
                      <span>{selectedVendor.joiningDate}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Compliance rating</span>
                    <span className={`font-bold flex items-center gap-1.5 ${
                      selectedVendor.status === 'Approved' ? 'text-emerald-500' : 'text-amber-505'
                    }`}>
                      <Award className="w-3.5 h-3.5 text-[#95C93D]" />
                      <span>96% Escrow Rating</span>
                    </span>
                  </div>
                </div>

                {/* Additional Description of application */}
                {selectedVendor.status === 'Pending' && (
                  <div className="bg-amber-550/10 border border-amber-500/25 p-3.5 rounded-xl flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Compliance Action Required</strong>: Vendor requires initial storefront activation review. Ensure they are a verified registered entity in Nigeria with valid logistics coverage.
                    </span>
                  </div>
                )}

                {/* Approve / Reject Actions bottom bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800/85">
                  {selectedVendor.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedVendor);
                          setSelectedVendor(null);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Storefront</span>
                      </button>

                      <button
                        onClick={() => {
                          handleReject(selectedVendor);
                          setSelectedVendor(null);
                        }}
                        className="py-2 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20 cursor-pointer"
                      >
                        Decline License
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onUpdateVendorStatus(
                          selectedVendor.id, 
                          selectedVendor.status === 'Approved' ? 'Rejected' : 'Approved'
                        );
                        onToast(
                          `Vendor license has been ${selectedVendor.status === 'Approved' ? 'Revoked' : 'Granted'} live.`,
                          selectedVendor.status === 'Approved' ? 'error' : 'success'
                        );
                        setSelectedVendor(null);
                      }}
                      className={`flex-1 py-2 text-xs font-black rounded-xl duration-200 cursor-pointer ${
                        selectedVendor.status === 'Approved'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/15 hover:bg-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/15 hover:bg-emerald-500/25'
                      }`}
                    >
                      {selectedVendor.status === 'Approved' ? 'Revoke Merchant License' : 'Clear & Grant License'}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="py-2 px-3.5 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-350 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIRECT VENDOR CREATION MODAL */}
      <AnimatePresence>
        {showAddVendorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl text-left relative"
            >
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-450 hover:bg-slate-150 dark:hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#95C93D]" />
                Provision Vendor Storefront
              </h3>

              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Store / Vendor Name</label>
                  <input
                    type="text"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    required
                    placeholder="e.g. Alaba Digital Experts"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Support Email</label>
                  <input
                    type="email"
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                    required
                    placeholder="sales@alabadigital.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Primary Category</label>
                    <select
                      value={newVendorCategory}
                      onChange={(e) => setNewVendorCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-[#003D36] dark:text-white font-bold"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="E-Books">E-Books</option>
                      <option value="Food & Groceries font-bold">Food & Groceries</option>
                      <option value="Home & Garden">Home & Garden</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Contact Phone</label>
                    <input
                      type="text"
                      value={newVendorPhone}
                      onChange={(e) => setNewVendorPhone(e.target.value)}
                      required
                      placeholder="+234..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-910 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                    className="flex-1 py-2 text-xs font-black rounded-xl border border-[#95C93D]/30 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
                  >
                    <span>Onboard New Vendor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddVendorModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
