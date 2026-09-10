import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Shield, UserX, UserCheck, Trash2, Eye, Mail, Phone, Calendar, 
  MapPin, DollarSign, X, CheckCircle, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { AdminUser } from './AdminTypes';

interface AdminUsersViewProps {
  users: AdminUser[];
  onUpdateUserStatus: (userId: string, newStatus: 'Active' | 'Suspended') => void;
  onDeleteUser: (userId: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onAddUser?: (user: AdminUser) => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

export default function AdminUsersView({
  users,
  onUpdateUserStatus,
  onDeleteUser,
  onToast,
  onAddUser,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminUsersViewProps) {
  // Search and Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'vendor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected User for Detail Modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Confirm Delete Dialog
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Show Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'buyer' | 'vendor' | 'admin'>('admin');

  // Search filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate current items to display
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleToggleStatus = (user: AdminUser) => {
    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    onUpdateUserStatus(user.id, nextStatus);
    onToast(
      `${user.name}'s account is now ${nextStatus === 'Active' ? 'Re-activated' : 'Suspended'}.`,
      nextStatus === 'Active' ? 'success' : 'info'
    );
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      onToast(`User profile for ${userToDelete.name} has been deleted permanently.`, 'error');
      setUserToDelete(null);
      // Reset page if needed
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPhone.trim()) {
      onToast("Please fill in all details.", "error");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newUserEmail.trim())) {
      onToast("Please input a valid email address.", "error");
      return;
    }

    if (onAddUser) {
      onAddUser({
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        status: 'Active',
        phone: newUserPhone.trim(),
        dateJoined: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalSpent: 0
      });
      onToast(`Staff/User account for ${newUserName} created successfully as ${newUserRole}!`, "success");
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserRole('admin');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Platform Directory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Moderate active accounts, review user transactions, and provision back office staff authorization cards.
          </p>
        </div>
        
        <button
          onClick={() => {
            setNewUserRole('admin');
            setShowAddModal(true);
          }}
          style={{ backgroundColor: '#003D36', color: '#95C93D' }}
          className="px-4 py-2 hover:opacity-90 active:scale-95 duration-200 cursor-pointer rounded-xl flex items-center justify-center gap-2 border border-[#95C93D]/30 shadow-md font-extrabold text-xs uppercase"
        >
          <Shield className="w-4 h-4 text-[#95C93D]" />
          <span>Create Staff / Account</span>
        </button>
      </div>

      {/* Control Bar: Search + Filter toggles */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on filter
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Filter Stack */}
        <div className="flex flex-wrap items-center gap-3 w-full justify-start md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Filter className="w-3.5 h-3.5 text-[#95C93D]" />
            <span className="font-semibold">Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-850 dark:text-gray-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#95C93D]"
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Administrators</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pl-1">
            <Shield className="w-3.5 h-3.5 text-[#95C93D]" />
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-850 dark:text-gray-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#95C93D]"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Accounts</option>
            <option value="Suspended">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Paginated Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800/80">
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">User Identity</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider">Mobile Number</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Account Role</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Fulfillment Spent</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-center font-mono">Status</th>
                <th className="py-3 px-5 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Moderator actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {currentItems.length > 0 ? (
                currentItems.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-teal-400 font-bold flex items-center justify-center border border-[#95C93D]/20 uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-950 dark:text-white truncate max-w-[160px]">{user.name}</p>
                          <p className="text-[10.5px] text-gray-450 dark:text-gray-400 truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Phone */}
                    <td className="py-3.5 px-5 font-mono text-[11px] text-gray-500 dark:text-gray-300">
                      {user.phone}
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full select-none ${
                        user.role === 'admin' 
                          ? 'bg-rose-500/15 text-rose-500 dark:text-rose-450' 
                          : user.role === 'vendor' 
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' 
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Spent / Orders */}
                    <td className="py-3.5 px-5 text-center">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {user.role === 'vendor' ? 'N/A' : `${currencySymbol}${user.totalSpent.toLocaleString()}`}
                      </p>
                      {user.role !== 'vendor' && (
                        <p className="text-[10px] text-gray-400 font-semibold">{user.totalOrders} Orders</p>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Actions dropdown/buttons */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View action */}
                        <button
                          onClick={() => setSelectedUser(user)}
                          title="View statistics"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-gray-400 dark:text-gray-305 hover:text-emerald-500 dark:hover:text-[#95C93D] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Suspend action */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'Active' ? 'Flag & Suspend' : 'Whitelist & Active'}
                          className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer ${
                            user.status === 'Active'
                              ? 'text-gray-450 hover:text-amber-500'
                              : 'text-amber-500 hover:text-emerald-500'
                          }`}
                        >
                          {user.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Delete action */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          title="Delete Account"
                          disabled={user.role === 'admin'}
                          className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-gray-400 dark:text-gray-500 mb-2">
                      <Search className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">No client accounts found</h3>
                    <p className="text-[11px] text-gray-400 px-4 mt-0.5 max-w-xs mx-auto">
                      Adjust your search parameter or category filters to locate registered subscribers.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-gray-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Showing <strong className="text-gray-700 dark:text-white font-bold">{startIndex + 1}</strong> to{' '}
              <strong className="text-gray-700 dark:text-white font-bold">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </strong>{' '}
              of <strong className="text-gray-700 dark:text-white font-bold">{totalItems}</strong> users
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
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-850'
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

      {/* User Info Overlay Drawer/Modal */}
      <AnimatePresence>
        {selectedUser && (
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
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-gray-450 dark:text-gray-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#95C93D] border border-emerald-500/20 font-black text-lg flex items-center justify-center">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white capitalize leading-none">
                    {selectedUser.name}
                  </h3>
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-gray-500 mt-1.5 inline-block">
                    {selectedUser.role} Account Profile
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">Email Address</span>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <Mail className="w-4 h-4 text-[#95C93D]" />
                      <span className="truncate max-w-[130px]">{selectedUser.email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">Registered Phone</span>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-mono">
                      <Phone className="w-4 h-4 text-[#95C93D]" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase font-bold">State Location</span>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-250">
                      <MapPin className="w-4 h-4 text-[#95C93D]" />
                      <span>{selectedUser.id === 'usr-1' ? 'Lagos' : selectedUser.id === 'usr-2' ? 'FCT (Abuja)' : 'Kano'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase font-bold font-mono">Joining Date</span>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-250 font-mono">
                      <Calendar className="w-4 h-4 text-[#95C93D]" />
                      <span>{selectedUser.dateJoined}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800/65 flex justify-between items-center text-center">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Platform Status</span>
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold mt-1 ${
                      selectedUser.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {selectedUser.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {selectedUser.status}
                    </span>
                  </div>

                  <div className="w-[1.5px] h-8 bg-gray-200 dark:bg-slate-800" />

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Fulfillment count</span>
                    <span className="font-mono text-gray-800 dark:text-white font-extrabold block text-sm mt-1">
                      {selectedUser.totalOrders} Completed txns
                    </span>
                  </div>

                  <div className="w-[1.5px] h-8 bg-gray-200 dark:bg-slate-800" />

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Escrow Clearance</span>
                    <span className="font-mono font-black text-[#95C93D] block text-sm mt-1">
                      {selectedUser.role === 'vendor' ? 'Seller Accounts' : `${currencySymbol}${selectedUser.totalSpent.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      handleToggleStatus(selectedUser);
                      setSelectedUser(null);
                    }}
                    className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer duration-200 flex items-center justify-center gap-1.5 ${
                      selectedUser.status === 'Active'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/15'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/15'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? (
                      <>
                        <UserX className="w-4 h-4" />
                        <span>Suspend Account</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Unsuspend & Clear</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedUser(null)}
                    className="py-2 px-3 border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-gray-600 dark:text-gray-350 text-xs font-bold rounded-xl cursor-pointer duration-200"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Deletion Modal Overlay */}
      <AnimatePresence>
        {userToDelete && (
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
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-xl relative text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5 animate-bounce" />
              </div>

              <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight">
                Destructive Account Erasure
              </h3>
              <p className="text-xs text-gray-450 dark:text-gray-400 mt-2.5 leading-relaxed">
                Are you absolutely sure you want to permanently erase the user account record for{' '}
                <strong className="text-gray-900 dark:text-white font-black">{userToDelete.name}</strong> ({userToDelete.email})? 
                This action is irreversible and clears all transaction linkage metrics.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Confirm Permanent Erasure
                </button>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-1.5 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE STAFF / USER ACCOUNT MODAL */}
      <AnimatePresence>
        {showAddModal && (
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
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-450 hover:bg-slate-150 dark:hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#95C93D]" />
                Provision Staff / Account
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    placeholder="e.g. Adebayo Ogunlesi"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    placeholder="staff@tradeease.ng"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Authorization Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-bold"
                    >
                      <option value="admin">Admin / Staff</option>
                      <option value="vendor">Vendor Owner</option>
                      <option value="buyer">Buyer Member</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Mobile Phone</label>
                    <input
                      type="text"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      required
                      placeholder="+234..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                    className="flex-1 py-2 text-xs font-black rounded-xl border border-[#95C93D]/30 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
                  >
                    <span>Create User Record</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
