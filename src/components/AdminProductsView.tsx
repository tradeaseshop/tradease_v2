import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShieldAlert, Edit, Trash2, CheckCircle, XCircle, ShoppingBag, 
  PlusCircle, DollarSign, ListFilter, AlertTriangle, Eye, X, Check, Save, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Product, Category } from '../types';

interface AdminProductsViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
  onUpdateProduct: (product: Product) => void;
  onUpdateProductCommission?: (productId: string, commissionPercent: number | null) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
  isDarkMode?: boolean;
}

// Small inline editor for a single product's commission override, kept
// separate so each card manages its own draft input independently.
function ProductCommissionCell({
  productId,
  value,
  onSave,
}: {
  productId: string;
  value: number | null | undefined;
  onSave: (productId: string, commissionPercent: number | null) => void;
}) {
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '');
  const initial = value != null ? String(value) : '';
  const isDirty = draft !== initial;

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Default"
        title={value == null ? "Using the vendor's rate (or platform default)" : `Custom rate: ${value}%`}
        className="w-16 text-center text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      {isDirty && (
        <button
          onClick={() => onSave(productId, draft.trim() === '' ? null : Number(draft))}
          title="Save commission rate"
          className="p-1 bg-emerald-500/15 text-emerald-600 dark:text-[#95C93D] hover:bg-emerald-500/25 rounded-lg border border-emerald-500/20 cursor-pointer shrink-0"
        >
          <Save className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Internal interface extension to support approval simulation states
interface AdminProductExtended extends Product {
  status?: 'Approved' | 'Pending' | 'Rejected';
}

export default function AdminProductsView({
  products,
  categories,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct,
  onUpdateProductCommission,
  onToast,
  currencySymbol = "₦",
  isDarkMode = true
}: AdminProductsViewProps) {
  // Let's model internal list-state that extends base items with customizable statuses
  const [localProducts, setLocalProducts] = useState<AdminProductExtended[]>(() => {
    // Standard catalog is approved
    const list: AdminProductExtended[] = products.map(p => ({ ...p, status: 'Approved' }));
    
    // Supplement with 3 outstanding compliance pending product listings for interactive fun!
    list.unshift(
      {
        id: "prod-pending-1",
        title: "Gucci Replia Silk Scarf Luxury",
        price: 15000,
        originalPrice: 35000,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
        rating: 0,
        reviewsCount: 0,
        category: "fashion",
        description: "Exact 1:1 replications of premium scarves imported directly from foreign textile zones. Top tier threads.",
        vendorName: "Copycat PDF Store",
        vendorId: "vendor-rejected-1",
        isFeatured: false,
        stock: 45,
        status: 'Pending'
      },
      {
        id: "prod-pending-2",
        title: "Kano Chili Red Powder (Organic Hot Blend)",
        price: 3500,
        originalPrice: 5000,
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600",
        rating: 4.8,
        reviewsCount: 0,
        category: "food",
        description: "Pure hot chili peppers ground dried under hyper sanitary parameters. Instant taste enhancers.",
        vendorName: "Kano Spices & Grains",
        vendorId: "vendor-pending-1",
        isFeatured: true,
        stock: 200,
        status: 'Pending'
      },
      {
        id: "prod-pending-3",
        title: "High Frequency USB Mosquito Sonic Repeller",
        price: 8900,
        originalPrice: 12000,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600",
        rating: 0,
        reviewsCount: 0,
        category: "electronics",
        description: "Creates sub-audible high-pitched radar bursts that physically repels mosquitoes up to 10 meters.",
        vendorName: "Oshodi Electronics",
        vendorId: "vendor-pending-2",
        isFeatured: false,
        stock: 120,
        status: 'Pending'
      }
    );

    return list;
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected'>('all');

  // Selected Product for editing
  const [editingProduct, setEditingProduct] = useState<AdminProductExtended | null>(null);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter list
  const filteredProducts = localProducts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination math
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Actions
  const handleApprove = (product: AdminProductExtended) => {
    setLocalProducts(prev => 
      prev.map(p => p.id === product.id ? { ...p, status: 'Approved' } : p)
    );
    onToast(`Listing for "${product.title}" has been Approved live for catalog buyers.`, 'success');
  };

  const handleReject = (product: AdminProductExtended) => {
    setLocalProducts(prev => 
      prev.map(p => p.id === product.id ? { ...p, status: 'Rejected' } : p)
    );
    onToast(`Listing for "${product.title}" was Rejected of compliance standards.`, 'error');
  };

  const handleDelete = (product: AdminProductExtended) => {
    onRemoveProduct(product.id);
    setLocalProducts(prev => prev.filter(p => p.id !== product.id));
    onToast(`Listing for "${product.title}" deleted completely.`, 'error');
  };

  const handleStartEdit = (product: AdminProductExtended) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditPrice(product.price);
    setEditStock(product.stock);
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      if (!editTitle.trim()) {
        onToast("Title field cannot remain blank.", "error");
        return;
      }
      if (editPrice <= 0) {
        onToast("Price must represent a positive amount.", "error");
        return;
      }
      
      const updated: AdminProductExtended = {
        ...editingProduct,
        title: editTitle.trim(),
        price: editPrice,
        stock: editStock
      };

      setLocalProducts(prev => 
        prev.map(p => p.id === editingProduct.id ? updated : p)
      );
      
      // Release callback upstream
      onUpdateProduct(updated);

      onToast(`Product "${updated.title}" catalog values updated securely.`, 'success');
      setEditingProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Manage Inventory Catalog
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Monitor product postings, modify store pricing thresholds, check warehouse stock alerts, and filter out unauthorized items.
        </p>
      </div>

      {/* Control row */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, sellers name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Filters dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full justify-start md:justify-end">
          <div className="flex items-center gap-1.2 text-xs text-gray-500 dark:text-gray-400">
            <ListFilter className="w-3.5 h-3.5 text-[#95C93D]" />
            <span className="font-semibold">Section:</span>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#95C93D]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#95C93D]"
          >
            <option value="all">All Postings</option>
            <option value="Approved">Approved Listings</option>
            <option value="Pending">Approval Pending</option>
            <option value="Rejected">Compliance Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid containing products card items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentItems.length > 0 ? (
          currentItems.map((prod) => {
            const hasStockIssue = prod.stock <= 5;
            return (
              <motion.div
                key={prod.id}
                layout
                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between"
              >
                {/* Visual Image with overlay badge state */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category overlay */}
                  <span className="absolute left-3 top-3 bg-black/75 text-white backdrop-blur-xs font-semibold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {prod.category}
                  </span>

                  {/* Status overlay */}
                  <span className={`absolute right-3 top-3 text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-xs uppercase tracking-wider ${
                    prod.status === 'Approved'
                      ? 'bg-emerald-500/90 border-emerald-400 text-white'
                      : prod.status === 'Pending'
                        ? 'bg-amber-500/95 border-amber-400 text-slate-950'
                        : 'bg-rose-500/90 border-rose-450 text-white'
                  }`}>
                    {prod.status || 'Approved'}
                  </span>
                </div>

                {/* Content Panel */}
                <div className="p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-gray-950 dark:text-white line-clamp-1 group-hover:text-[#95C93D] transition-colors">
                        {prod.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Seller: <strong className="text-gray-800 dark:text-white font-bold">{prod.vendorName}</strong>
                    </p>
                  </div>

                  {/* Stock and Price indicators */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-100 dark:border-slate-805/50 font-mono">
                    <div>
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide block">Naira Price</span>
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {currencySymbol}{prod.price.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide block">Stock Reserve</span>
                      <span className={`text-xs font-extrabold flex items-center gap-1 ${hasStockIssue ? 'text-rose-500 font-black' : 'text-gray-900 dark:text-gray-300'}`}>
                        {prod.stock} Left
                        {hasStockIssue && (
                          <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-rose-500 shrink-0" />
                        )}
                      </span>
                    </div>
                  </div>

                  {onUpdateProductCommission && (
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide">Commission Override</span>
                      <ProductCommissionCell
                        productId={prod.id}
                        value={prod.commissionPercent}
                        onSave={onUpdateProductCommission}
                      />
                    </div>
                  )}

                  <p className="text-[10.5px] text-gray-500 dark:text-gray-405 line-clamp-2 h-7.5 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-50 dark:border-slate-850/30">
                    
                    {/* Compliance Approvals or standard Modify actions */}
                    {prod.status === 'Pending' ? (
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handleApprove(prod)}
                          style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                          className="flex-1 py-1.5 rounded-xl border border-[#95C93D]/30 text-[10px] font-extrabold hover:bg-[#003d36]/80 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleReject(prod)}
                          className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full justify-between items-center">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-gray-400 dark:text-gray-305 hover:text-emerald-500 dark:hover:text-[#95C93D] transition-colors cursor-pointer"
                            title="Edit metrics"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {prod.status === 'Rejected' ? (
                          <button
                            onClick={() => handleApprove(prod)}
                            className="text-[9.5px] uppercase font-black text-rose-500 hover:text-emerald-500 underline cursor-pointer"
                          >
                            Re-approve listing
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Licensed product</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-gray-400 dark:text-gray-550 mb-3">
              <ShoppingBag className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Catalog matching empty</h3>
            <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
              No products found aligned with selected visual search keys and category filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination row */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-5 py-3 rounded-2xl flex items-center justify-between text-xs mt-4">
          <span className="text-gray-405">
            Showing <strong className="text-gray-705 dark:text-white font-bold">{startIndex + 1}</strong> to{' '}
            <strong className="text-gray-705 dark:text-white font-bold font-bold">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            of <strong className="text-gray-750 dark:text-white font-bold">{totalItems}</strong> entries
          </span>

          <div className="flex gap-1" id="products-pagination-buttons">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 duration-200 rounded-lg text-gray-450 dark:text-gray-400 disabled:opacity-40"
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
                    : 'border-gray-200 dark:border-slate-800 text-gray-600 hover:bg-slate-105'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 duration-200 rounded-lg text-gray-450 dark:text-gray-400 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Product Information light-box Modal Overlay */}
      <AnimatePresence>
        {editingProduct && (
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
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5.5 shadow-xl relative text-left"
            >
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-450 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#95C93D]" />
                Modify Catalog Entry
              </h3>

              <div className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono pl-0.5">Product Title / Heading</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white"
                  />
                </div>

                {/* Price and Stock inline rows */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono pl-0.5">Unit Price (₦)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono pl-0.5">Warehouse Stock</label>
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Confirm Save bar */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                    className="flex-1 py-2 text-xs font-black rounded-xl border border-[#95C93D]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Parameters</span>
                  </button>

                  <button
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-805 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer duration-205"
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
