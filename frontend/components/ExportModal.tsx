'use client';

import { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, CheckCircle2 } from 'lucide-react';
import type { Subscription } from '@/types';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface ExportModalProps {
  subscriptions: Subscription[];
  workspaceName?: string;
  onClose: () => void;
}

export default function ExportModal({ subscriptions, workspaceName, onClose }: ExportModalProps) {
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
  const { user } = useAuth();
  const primaryCurrency = user?.primaryCurrency || 'INR';

  const handleExportCSV = () => {
    setDownloading('csv');
    try {
      const filename = workspaceName
        ? `subtrackr_${workspaceName.toLowerCase().replace(/\s+/g, '_')}_subscriptions.csv`
        : 'subtrackr_all_subscriptions.csv';
      exportToCSV(subscriptions, filename);
      toast.success('CSV spreadsheet exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV file');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handleExportPDF = () => {
    setDownloading('pdf');
    try {
      const title = workspaceName ? `SubTrackr Workspace Statement — ${workspaceName}` : 'SubTrackr Financial Statement';
      exportToPDF(subscriptions, title, primaryCurrency);
      toast.success('PDF report generated!');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-lg relative space-y-6 animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Download size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Export Subscription Data</h2>
            <p className="text-xs text-slate-500 font-medium">
              {workspaceName ? `Exporting "${workspaceName}" inventory` : 'Exporting all subscription inventories'}{' '}
              <span className="font-extrabold text-indigo-600">({subscriptions.length} items)</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CSV Export Option */}
          <div className="p-5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 space-y-4 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={18} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-black text-slate-900">CSV Spreadsheet</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Raw formatted data spreadsheet for Excel, Google Sheets, or local database tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={downloading === 'csv'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading === 'csv' ? (
                <div className="spinner w-4 h-4" style={{ borderWidth: 2 }} />
              ) : (
                <>
                  <Download size={14} /> Download CSV
                </>
              )}
            </button>
          </div>

          {/* PDF Export Option */}
          <div className="p-5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 space-y-4 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition-transform">
                <FileText size={18} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-black text-slate-900">PDF Statement</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Beautifully formatted printable financial report summarizing monthly spend and renewals.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={downloading === 'pdf'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading === 'pdf' ? (
                <div className="spinner w-4 h-4" style={{ borderWidth: 2 }} />
              ) : (
                <>
                  <FileText size={14} /> Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
