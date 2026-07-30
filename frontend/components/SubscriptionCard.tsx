'use client';

import Link from 'next/link';
import { Pencil, Trash2, ArrowRight, CreditCard, Calendar, Sparkles } from 'lucide-react';
import type { Subscription, SubscriptionStatus } from '@/types';

const ICON_COLORS = [
  { bg: '#e0e7ff', text: '#4338ca', border: 'rgba(99,102,241,0.25)' },
  { bg: '#dbeafe', text: '#1e40af', border: 'rgba(59,130,246,0.25)' },
  { bg: '#cff4fc', text: '#0369a1', border: 'rgba(14,165,233,0.25)' },
  { bg: '#d1fae5', text: '#065f46', border: 'rgba(16,185,129,0.25)' },
  { bg: '#fef3c7', text: '#92400e', border: 'rgba(245,158,11,0.25)' },
  { bg: '#ffe4e6', text: '#9f1239', border: 'rgba(244,63,94,0.25)' },
];

const CYCLE_BADGE: Record<string, string> = {
  monthly: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  yearly:  'bg-purple-50 text-purple-700 border border-purple-200/60',
  weekly:  'bg-sky-50 text-sky-700 border border-sky-200/60',
  daily:   'bg-amber-50 text-amber-700 border border-amber-200/60',
};

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  paused:    'bg-amber-50 text-amber-700 border border-amber-200/60',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200/60',
};

function colorFor(name: string) {
  return ICON_COLORS[name.charCodeAt(0) % ICON_COLORS.length];
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

interface Props {
  sub: Subscription;
  delay?: number;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (newStatus: SubscriptionStatus) => void;
  deleting: boolean;
}

export default function SubscriptionCard({ sub, delay = 0, onEdit, onDelete, onStatusChange, deleting }: Props) {
  const d = daysUntil(sub.renewalDate);
  const renewLabel = d < 0 ? 'Expired' : d === 0 ? 'Due Today' : `${d} days left`;
  const renewColor = d < 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200' : d <= 3 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200' : 'text-slate-600 font-medium';

  const status = sub.status || 'active';
  const color = colorFor(sub.serviceName);

  let trialLabel = '';
  if (sub.isFreeTrial && sub.freeTrialEndDate) {
    const trialDays = daysUntil(sub.freeTrialEndDate);
    trialLabel = trialDays < 0 ? 'Trial ended' : trialDays === 0 ? 'Trial ends today' : `Trial: ${trialDays}d left`;
  }

  return (
    <div
      className="bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 animate-frost-fade-up group flex flex-col justify-between"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Decorative subtle top border accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${color.text}, transparent)` }}
      />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Service Initial Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
            style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
          >
            {sub.serviceName.charAt(0).toUpperCase()}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Edit subscription"
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              title="Delete subscription"
              className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
            >
              {deleting ? <span className="spinner w-3.5 h-3.5 border-rose-600 border-t-transparent" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>

        {/* Title & Category Badges */}
        <h3 className="font-bold text-lg text-slate-900 mb-2 truncate leading-tight group-hover:text-indigo-600 transition-colors">
          {sub.serviceName}
        </h3>

        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {/* Category */}
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
            {sub.category}
          </span>

          {/* Billing cycle */}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${CYCLE_BADGE[sub.billingCycle] ?? 'bg-slate-100 text-slate-700'}`}>
            {sub.billingCycle}
          </span>

          {/* Status Badge */}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.active}`}>
            {status}
          </span>

          {/* Free trial badge */}
          {sub.isFreeTrial && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sparkles size={11} />
              {trialLabel || 'Free Trial'}
            </span>
          )}
        </div>

        {/* Price & Details Section */}
        <div className="space-y-2.5 py-3 border-y border-slate-100 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CreditCard size={14} className="text-indigo-500" /> Price
            </span>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              {sub.currency}&nbsp;{sub.price.toFixed(2)}
            </span>
          </div>

          {sub.paymentMethod && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment via</span>
              <span className="font-medium text-slate-700">{sub.paymentMethod}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar size={13} className="text-indigo-500" /> Renewal status
            </span>
            <span className={renewColor}>{renewLabel}</span>
          </div>
        </div>

        {sub.notes && sub.notes !== 'no notes' && (
          <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
            {sub.notes}
          </p>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-2 border-t border-slate-100">
        <Link
          href={`/dashboard/subscription/${sub._id}`}
          className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group/link py-1"
        >
          <span>View details & stats</span>
          <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

