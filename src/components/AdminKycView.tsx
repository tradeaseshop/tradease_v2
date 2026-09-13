import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, IdCard, MapPinned, Eye, Check, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import * as api from '../api';

interface AdminKycViewProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

type QueueEntry = {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  kycStatus: string;
  documents: api.KycDocument[];
};

export default function AdminKycView({ onToast, isDarkMode = true }: AdminKycViewProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Verified' | 'Rejected'>('all');
  const [rejectModalDoc, setRejectModalDoc] = useState<api.KycDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyDocId, setBusyDocId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const data = await api.getKycQueue();
      setQueue(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Could not load the KYC review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleView = async (doc: api.KycDocument) => {
    try {
      const url = await api.getKycFileUrl(doc.id, true);
      window.open(url, '_blank');
    } catch (e: any) {
      onToast(e.message || 'Could not open document.', 'error');
    }
  };

  const handleApprove = async (doc: api.KycDocument) => {
    setBusyDocId(doc.id);
    try {
      await api.reviewKycDocument(doc.id, 'Approved');
      onToast('Document approved.', 'success');
      await refresh();
    } catch (e: any) {
      onToast(e.message || 'Could not approve document.', 'error');
    } finally {
      setBusyDocId(null);
    }
  };

  const openRejectModal = (doc: api.KycDocument) => {
    setRejectModalDoc(doc);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalDoc) return;
    if (!rejectReason.trim()) {
      onToast('Please provide a reason for rejecting this document.', 'error');
      return;
    }
    setBusyDocId(rejectModalDoc.id);
    try {
      await api.reviewKycDocument(rejectModalDoc.id, 'Rejected', rejectReason.trim());
      onToast('Document rejected.', 'success');
      setRejectModalDoc(null);
      await refresh();
    } catch (e: any) {
      onToast(e.message || 'Could not reject document.', 'error');
    } finally {
      setBusyDocId(null);
    }
  };

  const filteredQueue = queue.filter((v) => statusFilter === 'all' || v.kycStatus === statusFilter);

  const statusBadge = (status: string) => {
    if (status === 'Verified') return 'bg-emerald-500/10 text-emerald-600';
    if (status === 'Rejected') return 'bg-rose-500/10 text-rose-600';
    if (status === 'Pending') return 'bg-amber-500/10 text-amber-600';
    return 'bg-gray-500/10 text-gray-500';
  };

  const docStatusBadge = (status: string) => {
    if (status === 'Approved') return 'bg-emerald-500/10 text-emerald-600';
    if (status === 'Rejected') return 'bg-rose-500/10 text-rose-600';
    return 'bg-amber-500/10 text-amber-600';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#95C93D]" />
          <div>
            <h2 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider">Vendor KYC Verification</h2>
            <p className="text-[11px] text-gray-400">Review submitted ID and address documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'Pending', 'Verified', 'Rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`py-1.5 px-3 rounded-xl text-[10px] font-black uppercase cursor-pointer ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 text-xs text-gray-400 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading verification queue...
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500 font-bold">{error}</div>
      )}
      {!loading && !error && filteredQueue.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-gray-400">
          No vendors match this filter yet.
        </div>
      )}

      <div className="space-y-3">
        {filteredQueue.map((entry) => (
          <div key={entry.vendorId} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-black text-gray-900 dark:text-white">{entry.vendorName}</p>
                <p className="text-[10px] text-gray-400">{entry.vendorEmail}</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${statusBadge(entry.kycStatus)}`}>
                {entry.kycStatus}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {entry.documents.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {doc.docType === 'id' ? <IdCard className="w-3.5 h-3.5 text-gray-400" /> : <MapPinned className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        {doc.docType === 'id' ? 'Government ID' : 'Proof of Address'}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${docStatusBadge(doc.status)}`}>{doc.status}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 truncate">{doc.originalFileName}</p>
                  {doc.status === 'Rejected' && doc.rejectionReason && (
                    <p className="text-[9px] text-rose-500">Reason: {doc.rejectionReason}</p>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleView(doc)}
                      className="flex-1 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {doc.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(doc)}
                          disabled={busyDocId === doc.id}
                          className="flex-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 disabled:opacity-60 text-emerald-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(doc)}
                          disabled={busyDocId === doc.id}
                          className="flex-1 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 disabled:opacity-60 text-rose-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectModalDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRejectModalDoc(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm space-y-3.5 border border-gray-150 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-gray-900 dark:text-white">Reject Document</h3>
              </div>
              <p className="text-[10px] text-gray-400">
                Explain why this document is being rejected — the vendor will see this message.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Image is blurry, ID is expired, address doesn't match store profile..."
                className="w-full text-xs border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectModalDoc(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={busyDocId === rejectModalDoc.id}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
