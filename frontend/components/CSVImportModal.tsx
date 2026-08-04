'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { subsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CSVImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedSubscription {
  serviceName: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  paymentMethod: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

const SAMPLE_CSV = `serviceName,category,price,currency,billingCycle,renewalDate,paymentMethod,notes
Netflix,Entertainment & Streaming,15.49,USD,monthly,2026-08-15,Credit Card,4K Plan
ChatGPT Plus,AI & Automation,20.00,USD,monthly,2026-08-20,PayPal,GPT-4o access
GitHub Pro,Developer Tools & Cloud,4.00,USD,monthly,2026-08-28,Credit Card,Pro account`;

export default function CSVImportModal({ onClose, onSuccess }: CSVImportModalProps) {
  const { token, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSubscription[]>([]);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const parseCSVContent = (content: string) => {
    setFormatError(null);
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      const err = 'CSV file must contain a header row and at least one data row';
      setFormatError(err);
      toast.error(err);
      setParsedData([]);
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    
    // Map headers to fields
    const getIndex = (keys: string[]) => header.findIndex((h) => keys.includes(h));
    const nameIdx = getIndex(['servicename', 'service', 'name', 'subscription']);
    const priceIdx = getIndex(['price', 'amount', 'cost', 'fee']);
    const categoryIdx = getIndex(['category', 'type']);
    const currencyIdx = getIndex(['currency', 'curr']);
    const cycleIdx = getIndex(['billingcycle', 'cycle', 'frequency', 'period']);
    const dateIdx = getIndex(['renewaldate', 'renewal', 'date', 'nextbilling', 'nextdate']);
    const paymentIdx = getIndex(['paymentmethod', 'payment', 'card', 'method']);
    const notesIdx = getIndex(['notes', 'description', 'memo', 'comment']);

    // MANDATORY SUBSCRIPTION FORMAT VALIDATION
    const isSubscriptionCSV = nameIdx !== -1 && (priceIdx !== -1 || categoryIdx !== -1 || cycleIdx !== -1 || dateIdx !== -1);

    if (!isSubscriptionCSV) {
      const err = 'Invalid CSV Format: File is missing required subscription columns (serviceName/name and price/category/renewalDate). Please use the Sample CSV template.';
      setFormatError(err);
      toast.error('Invalid CSV file format');
      setParsedData([]);
      return;
    }

    const userDefaultCurr = user?.primaryCurrency || 'USD';
    const VALID_CYCLES = ['monthly', 'yearly', 'weekly', 'daily'];
    const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'];

    const rows: ParsedSubscription[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanCols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ''));

      const rawName = nameIdx !== -1 ? cleanCols[nameIdx] : '';
      const rawCategory = categoryIdx !== -1 ? cleanCols[categoryIdx] : 'General';
      const rawPriceStr = priceIdx !== -1 ? cleanCols[priceIdx] : '';
      const parsedPrice = parseFloat(rawPriceStr);

      const rawCurrency = currencyIdx !== -1 ? cleanCols[currencyIdx].toUpperCase() : userDefaultCurr;
      const rawCycle = cycleIdx !== -1 ? cleanCols[cycleIdx].toLowerCase() : 'monthly';
      const rawDateStr = dateIdx !== -1 ? cleanCols[dateIdx] : '';
      const rawPayment = paymentIdx !== -1 ? cleanCols[paymentIdx] : 'Credit Card';
      const rawNotes = notesIdx !== -1 ? cleanCols[notesIdx] : 'CSV imported';

      // Validation
      let isValid = true;
      let error = '';

      if (!rawName) {
        isValid = false;
        error = 'Missing Service Name';
      } else if (isNaN(parsedPrice) || parsedPrice < 0) {
        isValid = false;
        error = 'Invalid Price amount';
      } else if (!rawDateStr || isNaN(Date.parse(rawDateStr))) {
        isValid = false;
        error = 'Invalid Renewal Date format';
      }

      rows.push({
        serviceName: rawName,
        category: rawCategory,
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        currency: VALID_CURRENCIES.includes(rawCurrency) ? rawCurrency : userDefaultCurr,
        billingCycle: VALID_CYCLES.includes(rawCycle) ? rawCycle : 'monthly',
        renewalDate: isValid ? new Date(rawDateStr).toISOString().slice(0, 10) : rawDateStr,
        paymentMethod: rawPayment,
        notes: rawNotes,
        isValid,
        error,
      });
    }

    setParsedData(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      const err = 'Please upload a valid CSV file (.csv)';
      setFormatError(err);
      toast.error(err);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseCSVContent(text);
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_subscriptions.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded sample CSV template');
  };

  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid subscriptions to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        await subsApi.add(
          {
            serviceName: row.serviceName,
            category: row.category,
            price: row.price,
            currency: row.currency,
            billingCycle: row.billingCycle as any,
            renewalDate: row.renewalDate,
            paymentMethod: row.paymentMethod,
            notes: row.notes,
          },
          token!
        );
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setImporting(false);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} subscription(s)!`);
      onSuccess();
      onClose();
    } else {
      toast.error('Failed to import subscriptions');
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Upload size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Bulk CSV Import</h2>
            <p className="text-xs text-slate-500 font-medium">Upload your existing subscriptions via CSV file</p>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pr-1">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50'
                : formatError
                ? 'border-rose-300 bg-rose-50/50'
                : fileName
                ? 'border-indigo-300 bg-indigo-50/30'
                : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <FileText size={32} className={formatError ? 'text-rose-500' : fileName ? 'text-emerald-600' : 'text-slate-400'} />
            <p className="text-sm font-black text-slate-900">
              {fileName ? fileName : 'Click or Drag & Drop CSV file here'}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Expected columns: <span className="font-bold text-slate-700">serviceName, category, price, currency, billingCycle, renewalDate</span>
            </p>
          </div>

          {/* Header Format Error Alert Banner */}
          {formatError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fade-in">
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-black block text-rose-900">Format Error</span>
                <span className="font-medium">{formatError}</span>
              </div>
            </div>
          )}

          {/* Validation Warning Summary Banner */}
          {!formatError && parsedData.length > 0 && invalidCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <span className="font-medium">
                  <strong className="font-black">{invalidCount} row(s)</strong> failed validation. Hover over the error icons below for details. Only valid rows will be imported.
                </span>
              </div>
            </div>
          )}

          {/* Validation & Preview Table */}
          {!formatError && parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Preview ({validCount}/{parsedData.length} valid)
                </h3>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Cycle</th>
                        <th className="p-3">Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="p-3">
                            {row.isValid ? (
                              <CheckCircle2 size={15} className="text-emerald-600" strokeWidth={2.2} />
                            ) : (
                              <span title={row.error} className="flex items-center gap-1 text-rose-600 font-bold cursor-help">
                                <AlertCircle size={15} />
                                <span className="text-[10px] hidden sm:inline">{row.error}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{row.serviceName || '—'}</td>
                          <td className="p-3 text-slate-600">{row.category}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {row.currency} {row.price}
                          </td>
                          <td className="p-3 text-slate-600 capitalize">{row.billingCycle}</td>
                          <td className="p-3 text-slate-600">{row.renewalDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-shrink-0 mt-4">
          <button
            type="button"
            onClick={downloadSampleCSV}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Download size={14} strokeWidth={2.2} /> Sample CSV
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn-frost-secondary text-xs px-5 py-2.5 font-bold" disabled={importing}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="btn-frost-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {importing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${validCount} Subscription${validCount !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
