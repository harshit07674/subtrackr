'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Plus,
  Sliders,
  SlidersHorizontal,
  X,
  Search,
  ArrowUpDown,
  Package,
  TrendingUp,
  AlertCircle,
  Check,
  ChevronDown,
  Menu,
  Sparkles,
  PauseCircle,
  Settings,
  Globe,
  Upload,
  Folder,
  FolderPlus,
  Edit3,
  Trash2,
  ExternalLink,
  ArrowRight,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { subsApi, authApi, workspaceApi } from '@/lib/api';
import type { Subscription, SubscriptionFormData, SubscriptionStatus, Workspace } from '@/types';
import SubscriptionCard from '@/components/SubscriptionCard';
import SubscriptionModal from '@/components/SubscriptionModal';
import SettingsModal from '@/components/SettingsModal';
import CSVImportModal from '@/components/CSVImportModal';
import WorkspaceModal from '@/components/WorkspaceModal';
import DeleteWorkspaceModal from '@/components/DeleteWorkspaceModal';
import AnalyticsView from '@/components/AnalyticsView';
import ExportModal from '@/components/ExportModal';
import { getWorkspaceIcon } from '@/lib/workspaceIcons';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'CA$',
  JPY: '¥',
};

function formatCurrencyAmount(amount: number, currency: string = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ModalState = null | 'add' | { mode: 'edit'; sub: Subscription };

interface Filters {
  name:          string;
  category:      string;
  status:        string;
  isFreeTrial:   string;
  billingCycle:  string;
  renewal:       string;
  paymentMethod: string;
  currency:      string;
  minPrice:      string;
  maxPrice:      string;
  sortBy:        string;
  order:         string;
}

const DEFAULT_FILTERS: Filters = {
  name:          '',
  category:      '',
  status:        '',
  isFreeTrial:   '',
  billingCycle:  '',
  renewal:       '',
  paymentMethod: '',
  currency:      '',
  minPrice:      '',
  maxPrice:      '',
  sortBy:        'renewalDate',
  order:         'asc',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function hasActiveFilters(f: Filters): boolean {
  return !!(f.name || f.category || f.status || f.isFreeTrial || f.billingCycle || f.renewal ||
            f.paymentMethod || f.currency || f.minPrice || f.maxPrice ||
            f.sortBy !== 'renewalDate' || f.order !== 'asc');
}

function buildApiFilters(f: Filters) {
  const out: Record<string, unknown> = {};
  if (f.name)          out.name          = f.name;
  if (f.category)      out.category      = f.category;
  if (f.status)        out.status        = f.status;
  if (f.isFreeTrial)   out.isFreeTrial   = f.isFreeTrial;
  if (f.billingCycle)  out.billingCycle  = f.billingCycle;
  if (f.renewal)       out.renewal       = f.renewal;
  if (f.paymentMethod) out.paymentMethod = f.paymentMethod;
  if (f.currency)      out.currency      = f.currency;
  if (f.minPrice)      out.minPrice      = Number(f.minPrice);
  if (f.maxPrice)      out.maxPrice      = Number(f.maxPrice);
  if (f.sortBy)        out.sortBy        = f.sortBy;
  if (f.order)         out.order         = f.order;
  return out;
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25 font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X size={12} />
      </button>
    </span>
  );
}


interface OptionItem {
  label: string;
  value: string;
}

const CATEGORY_OPTIONS: OptionItem[] = [
  { label: 'All Categories', value: '' },
  { label: 'Dev Tools & Cloud', value: 'Developer Tools & Cloud' },
  { label: 'Streaming & Ent.', value: 'Entertainment & Streaming' },
  { label: 'Software & SaaS', value: 'Software & SaaS' },
  { label: 'Gaming', value: 'Gaming' },
  { label: 'Fitness & Health', value: 'Fitness & Health' },
  { label: 'Utilities', value: 'Utilities & Infrastructure' },
];

const STATUS_OPTIONS: OptionItem[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active Only', value: 'active' },
  { label: 'Paused Only', value: 'paused' },
  { label: 'Cancelled Only', value: 'cancelled' },
];

const CYCLE_OPTIONS: OptionItem[] = [
  { label: 'All Cycles', value: '' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
];

const SORT_OPTIONS: OptionItem[] = [
  { label: 'Sort: Renewal', value: 'renewalDate' },
  { label: 'Sort: Price', value: 'price' },
  { label: 'Sort: Name', value: 'serviceName' },
  { label: 'Sort: Added', value: 'createdAt' },
];

function FrostSelect({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (val: string) => void;
  icon?: any;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value) || options[0];
  const isActive = value !== '' && value !== options[0].value;

  return (
    <div className="relative z-50" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-2 border cursor-pointer ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-extrabold'
            : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />}
          <span className="truncate">{selectedOpt.label}</span>
        </div>
        <ChevronDown size={14} className={`${isActive ? 'text-indigo-600' : 'text-slate-400'} transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 p-1.5 z-[100] animate-frost-pop space-y-1 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-black'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-white flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [displayed, setDisplayed] = useState<Subscription[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('all');
  const [fetching, setFetching] = useState(true);
  const [searching, setSearching] = useState(false);

  // Stats / KPIs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kpis, setKpis] = useState<any>(null);

  // Modals & UI View state
  const [modal, setModal] = useState<ModalState>(null);
  const [workspaceModal, setWorkspaceModal] = useState<null | 'add' | { mode: 'edit'; ws: Workspace }>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dashboardView, setDashboardView] = useState<'subs' | 'analytics'>('subs');

  // Filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // ── Instant Client-Side Filtered & Sorted Subscriptions ──────────────────────
  const displayedSubs = useMemo(() => {
    let list = selectedWorkspaceId === 'all'
      ? [...allSubs]
      : allSubs.filter((s) => s.workSpaceId === selectedWorkspaceId);

    if (filters.name) {
      const q = filters.name.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }

    if (filters.category) {
      list = list.filter((s) => s.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.status) {
      list = list.filter((s) => (s.status || 'active').toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.billingCycle) {
      list = list.filter((s) => s.billingCycle.toLowerCase() === filters.billingCycle.toLowerCase());
    }

    // Sort
    list.sort((a, b) => {
      let comp = 0;
      if (filters.sortBy === 'price') {
        comp = a.price - b.price;
      } else if (filters.sortBy === 'serviceName') {
        comp = a.serviceName.localeCompare(b.serviceName);
      } else if (filters.sortBy === 'createdAt') {
        comp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else {
        // renewalDate (default)
        comp = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
      }
      return filters.order === 'desc' ? -comp : comp;
    });

    return list;
  }, [allSubs, selectedWorkspaceId, filters]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Redirect unauthenticated
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // ── Fetch Initial Data ───────────────────────────────────────────────────
  const fetchSubs = useCallback(async () => {
    if (!token) return;
    try {
      const [subsRes, kpisRes] = await Promise.all([
        subsApi.getAll(token),
        authApi.getDashboardKPIs(token),
      ]);
      const list = (subsRes.subscriptions ?? []) as Subscription[];
      setAllSubs(list);
      setDisplayed(list);
      setKpis(kpisRes);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setFetching(false);
    }
  }, [token]);

  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await workspaceApi.getAll(token);
      setWorkspaces((data.workspace || []) as Workspace[]);
    } catch {
      // workspace fetch optional
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSubs();
      fetchWorkspaces();
    }
  }, [token, fetchSubs, fetchWorkspaces]);

  // ── Fetch Workspace specific subs ───────────────────────────────────────
  const fetchWorkspaceSubs = useCallback(async (wsId: string) => {
    if (!token) return;
    setSearching(true);
    try {
      if (wsId === 'all') {
        const subsData = await subsApi.getAll(token);
        const list = (subsData.subscriptions ?? []) as Subscription[];
        setAllSubs(list);
        setDisplayed(list);
      } else {
        const res = await workspaceApi.getSubscriptions(wsId, token);
        const wsSubs = (res.subscriptions || []) as Subscription[];
        setDisplayed(wsSubs);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch workspace subscriptions');
    } finally {
      setSearching(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkspaceSubs(selectedWorkspaceId);
  }, [selectedWorkspaceId, fetchWorkspaceSubs]);

  // ── Workspace Handlers ────────────────────────────────────────────────────
  const handleCreateWorkspace = async (data: { name: string; category: string; colorTheme: { primary: string; secondary: string }; iconName: string }) => {
    if (!token) return;
    await workspaceApi.create(data, token);
    toast.success(`Workspace "${data.name}" created!`);
    setWorkspaceModal(null);
    fetchWorkspaces();
  };

  const handleUpdateWorkspace = async (id: string, data: { name: string; category: string; colorTheme: { primary: string; secondary: string }; iconName: string }) => {
    if (!token) return;
    await workspaceApi.update(id, data, token);
    toast.success('Workspace updated successfully!');
    setWorkspaceModal(null);
    fetchWorkspaces();
  };

  const handleDeleteWorkspace = async () => {
    if (!token || !deletingWorkspace) return;
    await workspaceApi.delete(deletingWorkspace._id, token);
    if (selectedWorkspaceId === deletingWorkspace._id) {
      setSelectedWorkspaceId('all');
    }
    setDeletingWorkspace(null);
    fetchWorkspaces();
    fetchSubs();
  };



  const refreshActiveView = useCallback(async () => {
    await Promise.all([
      fetchSubs(),
      fetchWorkspaces(),
      fetchWorkspaceSubs(selectedWorkspaceId),
    ]);
  }, [fetchSubs, fetchWorkspaces, fetchWorkspaceSubs, selectedWorkspaceId]);

  const handleAdd = async (data: SubscriptionFormData) => {
    try {
      await subsApi.add(data, token!);
      toast.success('Subscription added!');
      setModal(null);
      await refreshActiveView();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  const handleEdit = async (id: string, data: SubscriptionFormData) => {
    try {
      await subsApi.update(id, data, token!);
      toast.success('Subscription updated!');
      setModal(null);
      await refreshActiveView();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleStatusChange = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      await subsApi.update(id, { status: newStatus }, token!);
      toast.success(`Subscription marked as ${newStatus}`);
      await refreshActiveView();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await subsApi.delete(id, token!);
      toast.success('Subscription removed');
      await refreshActiveView();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="spinner w-10 h-10 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const activeFilterCount = [
    filters.name, filters.category, filters.status, filters.isFreeTrial,
    filters.billingCycle, filters.renewal, filters.paymentMethod,
    filters.currency, filters.minPrice, filters.maxPrice,
  ].filter(Boolean).length + (filters.sortBy !== 'renewalDate' || filters.order !== 'asc' ? 1 : 0);

  const primaryCurr = kpis?.primaryCurrency || user?.primaryCurrency || 'INR';
  const totalAmount = kpis?.totalExpensesAmount ?? kpis?.totalExpensesAmountINR ?? 0;

  // Calculate top 3 workspaces by recurring spend
  const topWorkspaces = [...workspaces]
    .map((ws) => {
      const wsSubs = allSubs.filter((s) => s.workSpaceId === ws._id);
      const monthlyCost = wsSubs.reduce((sum, s) => {
        let cost = s.price;
        if (s.billingCycle === 'yearly') cost = s.price / 12;
        else if (s.billingCycle === 'weekly') cost = (s.price * 52) / 12;
        else if (s.billingCycle === 'daily') cost = s.price * 30.43;
        return sum + cost;
      }, 0);
      return { ...ws, monthlyCost, subCount: wsSubs.length };
    })
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* ── Desktop Frost UI Sidebar ───────────────────── */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 sticky top-0 h-screen p-6 shadow-sm z-30">
        <Sidebar activeTab="subscriptions" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile Header ─────────────────────────────────────────────────── */}
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

      {/* ── Mobile Dropdown Menu ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 p-6 animate-frost-pop shadow-xl">
          <Sidebar activeTab="subscriptions" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
        </div>
      )}

      {/* ── Main Canvas ──────────────────────── */}
      <main className="flex-1 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto min-w-0">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-frost-fade-up">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, <span className="text-indigo-600">{user?.username || 'User'}</span>! 👋
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {hasActiveFilters(filters)
                ? `Showing ${displayedSubs.length} filtered result${displayedSubs.length !== 1 ? 's' : ''}`
                : `Managing ${allSubs.length} active subscription${allSubs.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="btn-frost-secondary text-sm"
              title="Import Subscriptions from CSV"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="btn-frost-secondary text-sm text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
              title="Export Subscriptions"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setModal('add')}
              className="btn-frost-primary text-sm shadow-md"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Subscription
            </button>
          </div>
        </div>

        {/* ── KPI Pastel Cards Grid ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="kpi-card-lime p-6 flex flex-col justify-between animate-frost-fade-up stagger-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Total Active Cost</span>
              <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-sm">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                {kpis ? formatCurrencyAmount(totalAmount, primaryCurr) : formatCurrencyAmount(0, primaryCurr)}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-2">Converted live to {primaryCurr}</p>
            </div>
          </div>

          <div className="kpi-card-purple p-6 flex flex-col justify-between animate-frost-fade-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-950">Active Subscriptions</span>
              <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center text-purple-900 shadow-sm">
                <Package size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black tracking-tight text-purple-950">
                {kpis ? kpis.activeSubscriptionCount : 0}
              </p>
              <p className="text-xs font-semibold text-purple-900 mt-2">Currently billing</p>
            </div>
          </div>

          <div className="kpi-card-pink p-6 flex flex-col justify-between animate-frost-fade-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-950">Free Trials</span>
              <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center text-pink-900 shadow-sm">
                <Sparkles size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black tracking-tight text-pink-950">
                {kpis ? (kpis.freeTrialCount ?? 0) : 0}
              </p>
              <p className="text-xs font-semibold text-pink-900 mt-2">Trial mode active</p>
            </div>
          </div>

          <div className="kpi-card-cyan p-6 flex flex-col justify-between animate-frost-fade-up stagger-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-950">Inactive / Paused</span>
              <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center text-sky-900 shadow-sm">
                <PauseCircle size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black tracking-tight text-sky-950">
                {kpis ? (kpis.pausedSubscriptionCount ?? 0) + kpis.expiredSubscriptionCount : 0}
              </p>
              <p className="text-xs font-semibold text-sky-900 mt-2">Paused or overdue</p>
            </div>
          </div>
        </div>

        {/* Permanent High-Contrast Filter & Sort Panel */}
        <div className="frost-card p-6 mb-8 bg-white border border-slate-200/90 animate-frost-fade-up space-y-4 relative z-40">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <SlidersHorizontal size={16} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Filter & Sort Subscriptions</h3>
                <p className="text-[11px] font-medium text-slate-500">Refine subscriptions by category, status, billing cycle, or search term</p>
              </div>
              {activeFilterCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {activeFilterCount} Active
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="btn-frost-secondary text-xs px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 font-bold inline-flex items-center gap-1.5"
              >
                <X size={13} /> Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={filters.name || ''}
                onChange={(e) => setFilter('name', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Custom Frost UI Category Select */}
            <FrostSelect
              label="All Categories"
              value={filters.category || ''}
              options={CATEGORY_OPTIONS}
              onChange={(val) => setFilter('category', val)}
            />

            {/* Custom Frost UI Status Select */}
            <FrostSelect
              label="All Statuses"
              value={filters.status || ''}
              options={STATUS_OPTIONS}
              onChange={(val) => setFilter('status', val as SubscriptionStatus)}
            />

            {/* Custom Frost UI Billing Cycle Select */}
            <FrostSelect
              label="All Cycles"
              value={filters.billingCycle || ''}
              options={CYCLE_OPTIONS}
              onChange={(val) => setFilter('billingCycle', val as any)}
            />

            {/* Custom Frost UI Sort & Order Controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1">
                <FrostSelect
                  label="Sort: Renewal"
                  value={filters.sortBy}
                  options={SORT_OPTIONS}
                  onChange={(val) => setFilter('sortBy', val as any)}
                />
              </div>
              <button
                type="button"
                onClick={() => setFilter('order', filters.order === 'asc' ? 'desc' : 'asc')}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  filters.order === 'desc'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                title={`Sort ${filters.order === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown size={14} className={filters.order === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Workspaces by Spend Section */}
        <div className="mb-10 animate-frost-fade-up stagger-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Folder size={18} className="text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">Top Workspaces by Spend</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold">
                Top 3 by Recurring Cost
              </span>
            </div>

            <Link
              href="/dashboard/workspaces"
              className="btn-frost-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold hover:text-indigo-600 hover:border-indigo-200"
            >
              See All Workspaces ({workspaces.length}) <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* "All Subscriptions" Master Card */}
            <div
              onClick={() => setSelectedWorkspaceId('all')}
              style={{
                boxShadow: selectedWorkspaceId === 'all' ? '0 14px 35px -5px rgba(79, 70, 229, 0.25)' : undefined,
                borderColor: selectedWorkspaceId === 'all' ? '#4f46e5' : undefined,
                borderWidth: selectedWorkspaceId === 'all' ? '2px' : '1px',
              }}
              className={`frost-card p-5 rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                selectedWorkspaceId === 'all'
                  ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 shadow-lg'
                  : 'hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600" />

              <div className="flex items-start justify-between mb-4 mt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <Layers size={22} strokeWidth={2.2} />
                </div>
                {selectedWorkspaceId === 'all' ? (
                  <span className="pill-badge pill-indigo shadow-sm">Active Filter</span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Cards</span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1">All Workspaces</h3>
                <p className="text-xs font-medium text-slate-500 mb-4">Combined master view across all subscriptions</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-medium text-slate-500">Total Subscriptions</span>
                  <span className="font-black text-slate-900 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {allSubs.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Top 3 Workspaces sorted by recurring spend */}
            {topWorkspaces.map((ws) => {
              const isSelected = selectedWorkspaceId === ws._id;
              const IconComp = getWorkspaceIcon(ws.iconName);
              const primary = ws.colorTheme?.primary || '#6366f1';
              const secondary = ws.colorTheme?.secondary || '#8b5cf6';

              return (
                <div
                  key={ws._id}
                  onClick={() => setSelectedWorkspaceId(ws._id)}
                  style={{
                    boxShadow: isSelected ? `0 14px 35px -5px ${primary}35` : undefined,
                    borderColor: isSelected ? primary : undefined,
                    borderWidth: isSelected ? '2px' : '1px',
                  }}
                  className={`frost-card p-5 rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between group ${
                    isSelected ? 'bg-white' : 'hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                  />

                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                        boxShadow: `0 8px 20px -3px ${primary}40`
                      }}
                    >
                      <IconComp size={22} strokeWidth={2.2} />
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/dashboard/workspace/${ws._id}`}
                        className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                        title="View Workspace Detail Page"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-extrabold text-base text-slate-900 truncate">{ws.name}</h3>
                      {isSelected && (
                        <span
                          className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                          style={{ background: primary }}
                        >
                          Active Filter
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-400 mb-4 truncate">
                      {ws.category || 'General Workspace'}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-900">
                        {formatCurrencyAmount(ws.monthlyCost, primaryCurr)}/mo
                      </span>
                      <span
                        className="font-extrabold text-xs px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: primary,
                          backgroundColor: `${primary}12`,
                          borderColor: `${primary}30`
                        }}
                      >
                        {ws.subCount} subs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
          <button onClick={() => setDashboardView('subs')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${dashboardView === 'subs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            <Package size={15} /> Subscriptions ({displayedSubs.length})
          </button>
          <button onClick={() => setDashboardView('analytics')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${dashboardView === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            <PieChart size={15} /> Analytics & Cash Flow Forecasting
          </button>
        </div>

        {/* Content Section */}
        {dashboardView === 'analytics' ? (
          <AnalyticsView workSpaceId={selectedWorkspaceId} />
        ) : searching ? (
          <div className="flex items-center justify-center py-24">
            <div className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
          </div>
        ) : displayedSubs.length === 0 ? (
          <div className="frost-card flex flex-col items-center justify-center p-12 md:p-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <Package size={28} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {hasActiveFilters(filters) ? 'No matching subscriptions' : 'No subscriptions in this workspace'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {hasActiveFilters(filters)
                ? 'Try adjusting or clearing your filters to see your subscriptions.'
                : 'Get started by adding your first subscription to this workspace.'}
            </p>
            {hasActiveFilters(filters) ? (
              <button onClick={clearFilters} className="btn-frost-secondary px-6 py-3 text-sm">Clear Filters</button>
            ) : (
              <button onClick={() => setModal('add')} className="btn-frost-primary px-6 py-3 text-sm"><Plus size={16} /> Add Subscription</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSubs.map((sub, i) => (
              <SubscriptionCard
                key={sub._id}
                sub={sub}
                delay={i * 0.04}
                onEdit={() => setModal({ mode: 'edit', sub })}
                onDelete={() => handleDelete(sub._id)}
                onStatusChange={(newStatus) => handleStatusChange(sub._id, newStatus)}
                deleting={deleting === sub._id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onSaved={fetchSubs} />
      )}
      {csvModalOpen && (
        <CSVImportModal onClose={() => setCsvModalOpen(false)} onSuccess={fetchSubs} />
      )}
      {modal === 'add' && (
        <SubscriptionModal
          title="Add New Subscription"
          workspaces={workspaces}
          onSubmit={handleAdd}
          onClose={() => setModal(null)}
        />
      )}
      {modal !== null && modal !== 'add' && modal.mode === 'edit' && (
        <SubscriptionModal
          title="Edit Subscription"
          initial={modal.sub}
          workspaces={workspaces}
          onSubmit={(data) => handleEdit(modal.sub._id, data)}
          onClose={() => setModal(null)}
        />
      )}
      {workspaceModal === 'add' && (
        <WorkspaceModal
          title="Create New Workspace"
          onSubmit={handleCreateWorkspace}
          onClose={() => setWorkspaceModal(null)}
        />
      )}
      {workspaceModal !== null && workspaceModal !== 'add' && workspaceModal.mode === 'edit' && (
        <WorkspaceModal
          title="Edit Workspace"
          initial={workspaceModal.ws}
          onSubmit={(data) => handleUpdateWorkspace(workspaceModal.ws._id, data)}
          onClose={() => setWorkspaceModal(null)}
        />
      )}
      {deletingWorkspace && (
        <DeleteWorkspaceModal
          workspace={deletingWorkspace}
          onConfirm={handleDeleteWorkspace}
          onClose={() => setDeletingWorkspace(null)}
        />
      )}
      {exportModalOpen && (
        <ExportModal
          subscriptions={displayed}
          workspaceName={selectedWorkspaceId !== 'all' ? workspaces.find((w) => w._id === selectedWorkspaceId)?.name : undefined}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
}
