'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { Workspace } from '@/types';
import toast from 'react-hot-toast';

interface DeleteWorkspaceModalProps {
  workspace: Workspace;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteWorkspaceModal({ workspace, onConfirm, onClose }: DeleteWorkspaceModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success(`Workspace "${workspace.name}" deleted successfully!`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-[460px] relative flex flex-col animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Warning Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <AlertTriangle size={28} strokeWidth={2.2} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Delete Workspace?</h2>
          <p className="text-xs text-slate-500 font-medium">
            You are about to delete <strong className="text-slate-900 font-bold">"{workspace.name}"</strong>
          </p>
        </div>

        {/* Alert Callout Box */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
            <AlertTriangle size={15} className="text-rose-600 flex-shrink-0" />
            <span>Permanent Data Loss Warning</span>
          </div>
          <p className="text-xs text-rose-900 font-medium leading-relaxed">
            Deleting this workspace will <strong className="font-extrabold underline decoration-rose-400">permanently delete all {workspace.totalNumberOfSubscriptions || 0} subscription(s)</strong> associated with it. This action cannot be undone!
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-frost-secondary text-xs px-5 py-2.5 font-bold"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Delete Workspace & All Subscriptions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
