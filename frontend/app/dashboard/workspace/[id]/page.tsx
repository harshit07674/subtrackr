'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Folder,
  Plus,
  Edit3,
  Trash2,
  Package,
  Sparkles,
  TrendingUp,
  CreditCard,
  PieChart,
  Calendar,
  AlertCircle,
  Clock,
  Download,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { workspaceApi, subsApi } from '@/lib/api';
import type { Workspace, Subscription, SubscriptionFormData } from '@/types';
import { getWorkspaceIcon } from '@/lib/workspaceIcons';
import SubscriptionCard from '@/components/SubscriptionCard';
import SubscriptionModal from '@/components/SubscriptionModal';
import WorkspaceModal from '@/components/WorkspaceModal';
import DeleteWorkspaceModal from '@/components/DeleteWorkspaceModal';
import AnalyticsView from '@/components/AnalyticsView';
import ExportModal from '@/components/ExportModal';

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token, loading: authLoading, logout } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subs' | 'analytics'>('subs');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Modals state
  const [modal, setModal] = useState<'add' | { mode: 'edit'; sub: Subscription } | null>(null);
  const [editWorkspaceModal, setEditWorkspaceModal] = useState(false);
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch Workspace details + Subscriptions
  const fetchWorkspaceData = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [wsData, subsData] = await Promise.all([
        workspaceApi.getById(id, token),
        workspaceApi.getSubscriptions(id, token),
      ]);
      setWorkspace(wsData.workspace as Workspace);
      setSubscriptions((subsData.subscriptions || []) as Subscription[]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Subscription CRUD Handlers
  const handleAddSubscription = async (data: SubscriptionFormData) => {
    if (!token) return;
    try {
      await subsApi.add({ ...data, workSpaceId: id }, token);
      toast.success('Subscription added to workspace!');
      setModal(null);
      fetchWorkspaceData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add subscription');
    }
  };

  const handleEditSubscription = async (subId: string, data: SubscriptionFormData) => {
    if (!token) return;
    try {
      await subsApi.update(subId, data, token);
      toast.success('Subscription updated!');
      setModal(null);
      fetchWorkspaceData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update subscription');
    }
  };

  const handleDeleteSubscription = async (subId: string) => {
    if (!token) return;
    setDeletingSubId(subId);
    try {
      await subsApi.delete(subId, token);
      toast.success('Subscription removed!');
      fetchWorkspaceData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setDeletingSubId(null);
    }
  };

  const handleWorkspaceUpdate = async (data: {
    name: string;
    category: string;
    colorTheme: { primary: string; secondary: string };
    iconName: string;
  }) => {
    if (!token || !id) return;
    await workspaceApi.update(id, data, token);
    toast.success('Workspace updated successfully!');
    setEditWorkspaceModal(false);
    fetchWorkspaceData();
  };

  const handleWorkspaceDelete = async () => {
    if (!token || !id) return;
    await workspaceApi.delete(id, token);
    router.replace('/dashboard');
  };

  if (loading || !workspace) {
    return (
      <div className="min-[#0a0a14] min-h-screen flex items-center justify-center p-6 text-white">
        <div className="spinner w-8 h-8" style={{ borderWidth: 3 }} />
      </div>
    );
  }

  const primary = workspace.colorTheme?.primary || '#6366f1';
  const secondary = workspace.colorTheme?.secondary || '#8b5cf6';
  const IconComp = getWorkspaceIcon(workspace.iconName);

  // Calculate workspace KPIs
  const activeSubs = subscriptions.filter((s) => (s.status || 'active') === 'active');
  const userCurrency = user?.primaryCurrency || 'USD';
  const monthlyTotal = activeSubs.reduce((sum, s) => {
    let cost = s.price;
    if (s.billingCycle === 'yearly') cost = s.price / 12;
    else if (s.billingCycle === 'weekly') cost = (s.price * 52) / 12;
    else if (s.billingCycle === 'daily') cost = s.price * 30.43;
    return sum + cost;
  }, 0);

  const upcomingRenewals = subscriptions.filter((s) => {
    const d = new Date(s.renewalDate).getTime() - Date.now();
    return d >= 0 && d <= 30 * 86400000;
  }).length;

  const freeTrialsCount = subscriptions.filter((s) => s.isFreeTrial).length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Frost UI Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 sticky top-0 h-screen p-6 shadow-sm z-30">
        <Sidebar activeTab="workspaces" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
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
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-[#334155] flex items-center justify-center cursor-pointer"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 p-6 animate-frost-pop shadow-xl">
          <Sidebar activeTab="workspaces" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto min-w-0 font-sans antialiased pb-20">
        <div className="max-w-7xl mx-auto space-y-8 animate-frost-fade-up">
        {/* Navigation & Header */}
        <div className="space-y-6">
          <Link
            href="/dashboard"
            className="btn-frost-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          {/* Workspace Hero Header */}
          <div className="frost-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <IconComp size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900">{workspace.name}</h1>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: primary, backgroundColor: `${primary}15` }}
                  >
                    {workspace.category || 'Workspace'}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  {subscriptions.length} Subscription{subscriptions.length !== 1 ? 's' : ''} in workspace
                </p>
              </div>
            </div>

            {/* Workspace Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setExportModalOpen(true)}
                className="btn-frost-secondary text-xs px-3.5 py-2.5 flex items-center gap-1.5"
                title="Export Workspace Inventory as CSV or PDF"
              >
                <Download size={15} /> Export
              </button>
              <button
                onClick={() => setModal('add')}
                className="btn-frost-primary text-xs px-4 py-2.5 flex items-center gap-2 flex-1 md:flex-initial justify-center shadow-md"
              >
                <Plus size={15} /> Add Subscription
              </button>
              <button
                onClick={() => setEditWorkspaceModal(true)}
                className="btn-frost-secondary text-xs px-3.5 py-2.5 flex items-center gap-1.5"
                title="Edit Workspace"
              >
                <Edit3 size={15} /> Edit
              </button>
              <button
                onClick={() => setDeleteWorkspaceModal(true)}
                className="p-2.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                title="Delete Workspace"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Workspace KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="kpi-card kpi-card-lime p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">Monthly Workspace Spend</span>
              <span className="text-2xl font-black text-slate-950">
                {formatCurrency(monthlyTotal, userCurrency)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-900/10 flex items-center justify-center text-slate-900 shadow-sm">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="kpi-card kpi-card-purple p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1">Active Subscriptions</span>
              <span className="text-2xl font-black text-purple-950">{activeSubs.length}</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-md border border-purple-900/10 flex items-center justify-center text-purple-900 shadow-sm">
              <Package size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="kpi-card kpi-card-cyan p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 block mb-1">30-Day Renewals</span>
              <span className="text-2xl font-black text-cyan-950">{upcomingRenewals}</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-md border border-cyan-900/10 flex items-center justify-center text-cyan-900 shadow-sm">
              <Clock size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="kpi-card kpi-card-pink p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-800 block mb-1">Free Trials</span>
              <span className="text-2xl font-black text-pink-950">{freeTrialsCount}</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-900/10 flex items-center justify-center text-pink-900 shadow-sm">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
          </div>
        </div>

        {/* Tab Switcher: Subscriptions vs Analytics */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/60 backdrop-blur-md border border-slate-300/50 shadow-inner">
            <button
              onClick={() => setActiveTab('subs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'subs'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Package size={16} strokeWidth={2.2} /> Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <PieChart size={16} strokeWidth={2.2} /> Workspace Analytics & Forecasting
            </button>
          </div>

          {/* Subscriptions Tab */}
          {activeTab === 'subs' && (
            <div>
              {subscriptions.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center mx-auto text-indigo-400">
                    <Package size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white">No subscriptions in this workspace</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Add your first subscription to &quot;{workspace.name}&quot; to start tracking spending and renewal dates.
                  </p>
                  <button onClick={() => setModal('add')} className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2">
                    <Plus size={15} /> Add Subscription
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions.map((sub, i) => (
                    <SubscriptionCard
                      key={sub._id}
                      sub={sub}
                      delay={i * 0.04}
                      onEdit={() => setModal({ mode: 'edit', sub })}
                      onDelete={() => handleDeleteSubscription(sub._id)}
                      deleting={deletingSubId === sub._id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics & Forecasting Tab (Flow 4) */}
          {activeTab === 'analytics' && (
            <AnalyticsView workSpaceId={id} />
          )}
        </div>
      </div>
    </main>

      {/* Modals */}
      {modal === 'add' && (
        <SubscriptionModal
          title={`Add Subscription to ${workspace.name}`}
          workspaces={[workspace]}
          onSubmit={handleAddSubscription}
          onClose={() => setModal(null)}
        />
      )}
      {modal !== null && modal !== 'add' && modal.mode === 'edit' && (
        <SubscriptionModal
          title="Edit Subscription"
          initial={modal.sub}
          onSubmit={(data) => handleEditSubscription(modal.sub._id, data)}
          onClose={() => setModal(null)}
        />
      )}
      {editWorkspaceModal && (
        <WorkspaceModal
          title="Edit Workspace"
          initial={workspace}
          onSubmit={handleWorkspaceUpdate}
          onClose={() => setEditWorkspaceModal(false)}
        />
      )}
      {deleteWorkspaceModal && (
        <DeleteWorkspaceModal
          workspace={workspace}
          onConfirm={handleWorkspaceDelete}
          onClose={() => setDeleteWorkspaceModal(false)}
        />
      )}
      {exportModalOpen && (
        <ExportModal
          subscriptions={subscriptions}
          workspaceName={workspace.name}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
}
