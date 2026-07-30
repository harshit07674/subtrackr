'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Folder,
  FolderPlus,
  Edit3,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { workspaceApi, subsApi } from '@/lib/api';
import type { Workspace, Subscription } from '@/types';
import { getWorkspaceIcon } from '@/lib/workspaceIcons';
import WorkspaceModal from '@/components/WorkspaceModal';
import DeleteWorkspaceModal from '@/components/DeleteWorkspaceModal';

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

export default function WorkspacesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Modals
  const [workspaceModal, setWorkspaceModal] = useState<null | 'add' | { mode: 'edit'; ws: Workspace }>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [wsRes, subsRes] = await Promise.all([
        workspaceApi.getAll(token),
        subsApi.getAll(token),
      ]);
      const wsList = (wsRes as any).workspaces || (wsRes as any).workspace || [];
      setWorkspaces(wsList as Workspace[]);
      setAllSubs((subsRes.subscriptions || []) as Subscription[]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateWorkspace = async (data: {
    name: string;
    category: string;
    colorTheme: { primary: string; secondary: string };
    iconName: string;
  }) => {
    try {
      await workspaceApi.create(data, token!);
      toast.success('Workspace created successfully!');
      setWorkspaceModal(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  };

  const handleUpdateWorkspace = async (id: string, data: {
    name: string;
    category: string;
    colorTheme: { primary: string; secondary: string };
    iconName: string;
  }) => {
    try {
      await workspaceApi.update(id, data, token!);
      toast.success('Workspace updated successfully!');
      setWorkspaceModal(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!deletingWorkspace || !token) return;
    try {
      await workspaceApi.delete(deletingWorkspace._id, token);
      toast.success('Workspace deleted!');
      setDeletingWorkspace(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Calculate spend per workspace
  const getWorkspaceSpend = (wsId: string) => {
    const subs = allSubs.filter((s) => s.workSpaceId === wsId);
    return subs.reduce((sum, s) => {
      let cost = s.price;
      if (s.billingCycle === 'yearly') cost = s.price / 12;
      else if (s.billingCycle === 'weekly') cost = (s.price * 52) / 12;
      else if (s.billingCycle === 'daily') cost = s.price * 30.43;
      return sum + cost;
    }, 0);
  };

  const userCurrency = user?.primaryCurrency || 'INR';

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
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
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
        <div className="space-y-4 border-b border-slate-200/80 pb-6">
          <Link
            href="/dashboard"
            className="btn-frost-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                <Folder size={24} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Workspaces</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {workspaces.length} Total
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Organize subscriptions by project, team, or category with custom color themes</p>
              </div>
            </div>

            <button
              onClick={() => setWorkspaceModal('add')}
              className="btn-frost-primary text-sm px-6 py-3 shadow-lg shadow-indigo-500/20 flex items-center gap-2 flex-shrink-0"
            >
              <FolderPlus size={18} /> Create Workspace
            </button>
          </div>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div className="frost-card p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Folder size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Workspaces Created</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Create your first workspace to group subscriptions by team or project.</p>
            <button
              onClick={() => setWorkspaceModal('add')}
              className="btn-frost-primary text-xs px-6 py-3 inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workspaces.map((ws) => {
              const subCount = ws.totalNumberOfSubscriptions ?? allSubs.filter((s) => s.workSpaceId === ws._id).length;
              const IconComp = getWorkspaceIcon(ws.iconName);
              const primary = ws.colorTheme?.primary || '#6366f1';
              const secondary = ws.colorTheme?.secondary || '#8b5cf6';
              const monthlySpend = getWorkspaceSpend(ws._id);

              return (
                <div
                  key={ws._id}
                  className="frost-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl bg-white"
                >
                  {/* Top Color Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: 'linear-gradient(90deg, ' + primary + ', ' + secondary + ')' }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, ' + primary + ', ' + secondary + ')',
                        boxShadow: '0 8px 20px -3px ' + primary + '40'
                      }}
                    >
                      <IconComp size={22} strokeWidth={2.2} />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1">
                      <Link
                        href={'/dashboard/workspace/' + ws._id}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                        title="View Workspace Detail Page"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => setWorkspaceModal({ mode: 'edit', ws })}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 flex items-center justify-center transition-colors"
                        title="Edit Workspace"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingWorkspace(ws)}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Workspace Content */}
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 truncate mb-1">{ws.name}</h3>
                    <p className="text-xs font-semibold text-slate-400 mb-4 truncate">
                      {ws.category || 'General Workspace'}
                    </p>

                    {/* Stats & Spend Info */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">Active Subscriptions</span>
                        <span
                          className="font-extrabold text-xs px-2.5 py-0.5 rounded-full border"
                          style={{
                            color: primary,
                            backgroundColor: primary + '12',
                            borderColor: primary + '30'
                          }}
                        >
                          {subCount} subs
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">Monthly Run-Rate</span>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(monthlySpend, userCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Open Button */}
                    <Link
                      href={'/dashboard/workspace/' + ws._id}
                      className="mt-4 w-full btn-frost-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-all"
                    >
                      Open Workspace <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>

      {/* Modals */}
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
    </div>
  );
}
