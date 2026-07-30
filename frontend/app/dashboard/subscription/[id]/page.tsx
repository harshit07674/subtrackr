'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  RefreshCw,
  Clock,
  Tag,
  Menu,
  X,
  Sparkles,
  Activity,
  TrendingUp,
  ChevronDown,
  Check,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { subsApi } from '@/lib/api';
import type { Subscription, SubscriptionStatus } from '@/types';
import Sidebar from '@/components/Sidebar';

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  paused: {
    label: 'Paused',
    bg: 'bg-amber-50 text-amber-700 border-amber-200/90',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: PauseCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200/90',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'CA$',
  JPY: '¥',
};

function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function monthlyEquivalent(s: Subscription): number {
  if (s.billingCycle === 'yearly') return s.price / 12;
  if (s.billingCycle === 'weekly') return (s.price * 52) / 12;
  if (s.billingCycle === 'daily') return s.price * 30.43;
  return s.price;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass = '',
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <span className="flex items-center gap-3 text-xs font-semibold text-slate-500">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
            <Icon size={14} strokeWidth={2} />
          </div>
        )}
        {label}
      </span>
      <span className={`text-xs font-extrabold text-right ${valueClass || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

// ── Custom Frost UI Status Dropdown Component ──────────────────────────────
function StatusDropdown({
  currentStatus,
  onChange,
}: {
  currentStatus: SubscriptionStatus;
  onChange: (s: SubscriptionStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="relative z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`px-4 py-2.5 rounded-2xl font-black text-xs inline-flex items-center gap-2.5 transition-all shadow-sm cursor-pointer border ${activeConfig.bg} hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
      >
        <ActiveIcon size={16} strokeWidth={2.2} />
        <span>{activeConfig.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-frost-pop space-y-1">
          {(['active', 'paused', 'cancelled'] as SubscriptionStatus[]).map((stKey) => {
            const cfg = STATUS_CONFIG[stKey];
            const Icon = cfg.icon;
            const isSelected = currentStatus === stKey;

            return (
              <button
                key={stKey}
                type="button"
                onClick={() => {
                  onChange(stKey);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? `${cfg.bg} font-black`
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={15} strokeWidth={2.2} className={cfg.text} />
                  <span>{cfg.label}</span>
                </div>
                {isSelected && <Check size={14} className={cfg.text} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [fetching, setFetching] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const fetchSub = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await subsApi.getById(id, token);
      setSub(data.subscription as Subscription);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load subscription');
      router.replace('/dashboard');
    } finally {
      setFetching(false);
    }
  }, [token, id, router]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!sub) return null;

  const d = daysUntil(sub.renewalDate);
  const renewLabel = d < 0 ? 'Expired' : d === 0 ? 'Due Today' : `${d} days left`;
  const renewBadgeColor =
    d < 0 ? 'text-rose-700 bg-rose-50 border-rose-200' : d <= 3 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
  const status = sub.status || 'active';
  const monthly = monthlyEquivalent(sub);

  const handleStatusChange = async (newStatus: SubscriptionStatus) => {
    if (!sub || !token) return;
    try {
      await subsApi.update(sub._id, { status: newStatus }, token);
      toast.success(`Subscription marked as ${newStatus}`);
      await fetchSub();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Desktop Unified Sidebar Component */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 sticky top-0 h-screen p-6 shadow-sm z-30">
        <Sidebar activeTab="subscriptions" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md">
            <Layers size={16} strokeWidth={2.2} />
          </div>
          <span className="text-base font-extrabold text-slate-900">SubTrackr<span className="text-indigo-600">.</span></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 p-6 animate-frost-pop shadow-xl">
          <Sidebar activeTab="subscriptions" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
        </div>
      )}

      {/* Main Canvas */}
      <main className="flex-1 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto min-w-0">
        <div className="max-w-5xl mx-auto space-y-8 animate-frost-fade-up">
          {/* Back Button */}
          <div>
            <Link
              href="/dashboard"
              className="btn-frost-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>

          {/* Subscription Hero Card */}
          <div className="frost-card p-6 md:p-8 rounded-3xl relative bg-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50 flex-shrink-0">
                {sub.serviceName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{sub.serviceName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="pill-badge pill-indigo text-xs font-extrabold capitalize">
                    {sub.category}
                  </span>
                  <span className="pill-badge pill-emerald text-xs font-extrabold capitalize">
                    {sub.billingCycle}
                  </span>

                  {sub.isFreeTrial && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      <Sparkles size={12} className="text-amber-600" /> Free Trial
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Interactive Frost UI Status Dropdown Component */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status:</span>
              <StatusDropdown currentStatus={status} onChange={handleStatusChange} />
            </div>
          </div>

          {/* Pastel KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price KPI */}
            <div className="kpi-card kpi-card-lime p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime-900 block mb-1">
                  Price
                </span>
                <span className="text-2xl lg:text-3xl font-black text-lime-950 block">
                  {formatCurrency(sub.price, sub.currency)}
                </span>
                <span className="text-xs font-bold text-lime-800 mt-1 block capitalize">
                  Billed {sub.billingCycle}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-lime-900/10 flex items-center justify-center text-lime-900 shadow-sm flex-shrink-0">
                <CreditCard size={22} strokeWidth={2.2} />
              </div>
            </div>

            {/* Monthly Equivalent KPI */}
            <div className="kpi-card kpi-card-purple p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 block mb-1">
                  Monthly Equivalent
                </span>
                <span className="text-2xl lg:text-3xl font-black text-purple-950 block">
                  {formatCurrency(monthly, sub.currency)}
                </span>
                <span className="text-xs font-bold text-purple-800 mt-1 block">
                  Normalised to /month
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-900/10 flex items-center justify-center text-purple-900 shadow-sm flex-shrink-0">
                <TrendingUp size={22} strokeWidth={2.2} />
              </div>
            </div>

            {/* Renewal Status KPI */}
            <div className="kpi-card kpi-card-cyan p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-900 block mb-1">
                  Renewal Status
                </span>
                <span className="text-2xl lg:text-3xl font-black text-cyan-950 block">
                  {renewLabel}
                </span>
                <span className="text-xs font-bold text-cyan-800 mt-1 block">
                  {formatDate(sub.renewalDate)}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-cyan-900/10 flex items-center justify-center text-cyan-900 shadow-sm flex-shrink-0">
                <Clock size={22} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          {/* Details Metadata Frosted Card */}
          <div className="frost-card p-6 md:p-8 rounded-3xl bg-white shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Subscription Details</h2>
              <p className="text-xs font-medium text-slate-500">Complete metadata and billing schedule stored for this item</p>
            </div>

            <div className="divide-y divide-slate-100">
              <DetailRow icon={Tag} label="Service Name" value={<span className="capitalize">{sub.serviceName}</span>} />
              <DetailRow icon={Tag} label="Category" value={<span className="capitalize">{sub.category}</span>} />
              <DetailRow icon={Activity} label="Status" value={<span className="capitalize font-bold text-indigo-600">{status}</span>} />
              <DetailRow icon={Sparkles} label="Free Trial" value={sub.isFreeTrial ? 'Yes' : 'No'} />
              {sub.isFreeTrial && sub.freeTrialEndDate && (
                <DetailRow icon={Calendar} label="Trial End Date" value={formatDate(sub.freeTrialEndDate)} valueClass="text-amber-700" />
              )}
              <DetailRow icon={RefreshCw} label="Billing Cycle" value={<span className="capitalize">{sub.billingCycle}</span>} />
              <DetailRow icon={CreditCard} label="Price" value={formatCurrency(sub.price, sub.currency)} valueClass="text-indigo-600 text-sm" />
              <DetailRow icon={CreditCard} label="Currency" value={sub.currency} />
              <DetailRow
                icon={Calendar}
                label="Next Renewal"
                value={formatDate(sub.renewalDate)}
                valueClass={`px-2.5 py-0.5 rounded-full border text-xs font-extrabold ${renewBadgeColor}`}
              />
              {sub.paymentMethod && <DetailRow icon={CreditCard} label="Payment Method" value={sub.paymentMethod} />}
              <DetailRow icon={Clock} label="Date Added" value={formatDate(sub.createdAt)} />
              <DetailRow icon={Clock} label="Last Updated" value={formatDate(sub.updatedAt)} />
            </div>

            {sub.notes && sub.notes !== 'no notes' && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 leading-relaxed">
                  {sub.notes}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="btn-frost-primary text-sm px-8 py-3.5 shadow-lg shadow-indigo-500/25 font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Subscriptions
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}