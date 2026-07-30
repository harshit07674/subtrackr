'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  LayoutDashboard,
  Folder,
  Sliders,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: 'subscriptions' | 'workspaces' | 'preferences';
  email?: string;
  verified?: boolean;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab = 'subscriptions',
  email,
  verified,
  onLogout,
}: SidebarProps) {
  const getTabClass = (tabName: 'subscriptions' | 'workspaces' | 'preferences') => {
    const isActive = activeTab === tabName;
    if (isActive) {
      return 'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 w-full text-left shadow-sm transition-all';
    }
    return 'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all w-full text-left';
  };

  return (
    <div className="flex flex-col h-full text-slate-700 font-sans">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-6 mb-6 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 flex-shrink-0 animate-float">
          <Layers size={20} strokeWidth={2.2} />
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900">
          SubTrackr<span className="text-indigo-600">.</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className={getTabClass('subscriptions')}>
          <LayoutDashboard
            size={18}
            strokeWidth={2.2}
            className={activeTab === 'subscriptions' ? 'text-indigo-600' : 'text-slate-500'}
          />
          Subscriptions
        </Link>
        <Link href="/dashboard/workspaces" className={getTabClass('workspaces')}>
          <Folder
            size={18}
            strokeWidth={2}
            className={activeTab === 'workspaces' ? 'text-indigo-600' : 'text-slate-500'}
          />
          Workspaces
        </Link>
        <Link href="/dashboard/preferences" className={getTabClass('preferences')}>
          <Sliders
            size={18}
            strokeWidth={2}
            className={activeTab === 'preferences' ? 'text-indigo-600' : 'text-slate-500'}
          />
          Preferences
        </Link>
      </nav>

      {/* Modern Aesthetic User Account Footer */}
      <div className="border-t border-slate-200/80 pt-5 mt-auto">
        <div className="frost-card p-4 rounded-3xl relative overflow-hidden bg-gradient-to-b from-white/90 to-slate-50/90 border border-slate-200/90 shadow-lg shadow-slate-200/40 group hover:border-indigo-300 transition-all duration-300">
          {/* Top Multi-hue Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />

          {/* User Profile Header */}
          <div className="flex items-center gap-3 mb-3.5 mt-0.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/30 ring-2 ring-indigo-100 flex-shrink-0">
              {email ? email[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">{email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={11} className="text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onLogout}
            className="w-full btn-frost-secondary text-xs py-2 flex items-center justify-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 font-bold transition-all"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
