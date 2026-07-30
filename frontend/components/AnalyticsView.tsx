'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  PieChart,
  Calendar,
  Wallet,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'CA$',
  JPY: '¥',
};

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface AnalyticsData {
  targetCurrency: string;
  kpis: {
    totalMonthlySpend: number;
    activeSubsCount: number;
    upcomingRenewalsCount: number;
    freeTrialCount: number;
  };
  spendingTrends: Array<{ month: string; amount: number; currency: string }>;
  expensesByPaymentGroup: Array<{ paymentMethod: string; amount: number; currency: string; count: number; percentage: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; currency: string; count: number; percentage: number; color: string }>;
  projections: {
    next30Days: number;
    next6Months: number;
    next12Months: number;
    monthlyBreakdown: Array<{ month: string; amount: number; currency: string }>;
  };
}

interface AnalyticsViewProps {
  workSpaceId?: string;
}

export default function AnalyticsView({ workSpaceId }: AnalyticsViewProps) {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectionTab, setProjectionTab] = useState<'30d' | '6m' | '12m'>('6m');

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await analyticsApi.get(token, workSpaceId);
      setData(res as AnalyticsData);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [token, workSpaceId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="frost-card p-8 text-center text-slate-500 font-medium">
        No analytics data available.
      </div>
    );
  }

  const { targetCurrency, kpis, spendingTrends, expensesByPaymentGroup, categoryBreakdown, projections } = data;

  const maxTrendAmount = Math.max(...spendingTrends.map((t) => t.amount), 1);
  const maxProjAmount = Math.max(...projections.monthlyBreakdown.map((p) => p.amount), 1);

  let cumulativePercent = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-8 animate-frost-fade-up">
      {/* ── Historical Spending Trends ──────────────────────────────────── */}
      <div className="frost-card p-6 md:p-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <TrendingUp size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Historical Spending Trends</h3>
              <p className="text-xs text-slate-500 font-medium">6-Month subscription spending trajectory</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Current Monthly Run-Rate</span>
            <span className="text-xl font-extrabold text-indigo-600">
              {formatCurrency(kpis.totalMonthlySpend, targetCurrency)}
            </span>
          </div>
        </div>

        {/* Bar Chart Representation */}
        <div className="pt-6 pb-2">
          <div className="h-52 flex items-end justify-between gap-3 md:gap-6 border-b border-slate-200 pb-2 px-2">
            {spendingTrends.map((trend, i) => {
              const heightPercent = Math.max(12, Math.round((trend.amount / maxTrendAmount) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {formatCurrency(trend.amount, targetCurrency)}
                  </span>
                  <div
                    className="w-full max-w-[48px] rounded-t-2xl transition-all duration-300 group-hover:brightness-110 shadow-sm"
                    style={{
                      height: `${heightPercent}%`,
                      background: `linear-gradient(180deg, #6366f1, #4f46e5)`,
                    }}
                  />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                    {trend.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Category Donut & Expenses by Payment Method ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut Chart */}
        <div className="frost-card p-6 md:p-7 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                <PieChart size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Category Breakdown</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-semibold">{categoryBreakdown.length} Categories</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No active subscription categories</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {categoryBreakdown.map((cat, idx) => {
                    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                    cumulativePercent += cat.percentage;

                    return (
                      <circle
                        key={idx}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Monthly Total</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(kpis.totalMonthlySpend, targetCurrency)}
                  </span>
                </div>
              </div>

              {/* Category Legend */}
              <div className="flex-1 space-y-2 w-full max-h-52 overflow-y-auto pr-1">
                {categoryBreakdown.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-700 truncate text-[11px]">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-right flex-shrink-0">
                      <span className="font-bold text-slate-900 text-[11px]">
                        {formatCurrency(cat.amount, targetCurrency)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses by Payment Method */}
        <div className="frost-card p-6 md:p-7 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <CreditCard size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Expenses by Payment Method</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-semibold">{expensesByPaymentGroup.length} Methods</span>
          </div>

          {expensesByPaymentGroup.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No payment method data available</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {expensesByPaymentGroup.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <CreditCard size={14} className="text-emerald-600" />
                      <span>{item.paymentMethod}</span>
                      <span className="text-[10px] text-slate-400">({item.count} sub{item.count > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(item.amount, targetCurrency)}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cash Flow Forecasting (Future Cost Projections) ──────────────── */}
      <div className="frost-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <BarChart3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cash Flow Forecasting</h3>
              <p className="text-xs text-slate-500 font-medium">Projected upcoming subscription outflows</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setProjectionTab('30d')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                projectionTab === '30d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 30 Days
            </button>
            <button
              onClick={() => setProjectionTab('6m')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                projectionTab === '6m' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 6 Months
            </button>
            <button
              onClick={() => setProjectionTab('12m')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                projectionTab === '12m' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 12 Months
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-amber-700 block">30-Day Outflow</span>
              <span className="text-lg font-black text-amber-950">
                {formatCurrency(projections.next30Days, targetCurrency)}
              </span>
            </div>
            <Calendar size={22} className="text-amber-500" />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-amber-700 block">6-Month Total</span>
              <span className="text-lg font-black text-amber-950">
                {formatCurrency(projections.next6Months, targetCurrency)}
              </span>
            </div>
            <TrendingUp size={22} className="text-amber-500" />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-amber-700 block">12-Month Outflow</span>
              <span className="text-lg font-black text-amber-950">
                {formatCurrency(projections.next12Months, targetCurrency)}
              </span>
            </div>
            <Wallet size={22} className="text-amber-500" />
          </div>
        </div>

        <div className="pt-4">
          <div className="h-44 flex items-end justify-between gap-2 md:gap-4 border-b border-slate-200 pb-2 px-1">
            {projections.monthlyBreakdown
              .slice(0, projectionTab === '30d' ? 3 : projectionTab === '6m' ? 6 : 12)
              .map((item, i) => {
                const heightPercent = Math.max(15, Math.round((item.amount / maxProjAmount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {formatCurrency(item.amount, targetCurrency)}
                    </span>
                    <div
                      className="w-full max-w-[36px] rounded-t-xl transition-all duration-300 group-hover:brightness-105 shadow-sm"
                      style={{
                        height: `${heightPercent}%`,
                        background: `linear-gradient(180deg, #f59e0b, #d97706)`,
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors truncate w-full text-center">
                      {item.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

